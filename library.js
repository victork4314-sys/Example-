const REPO = 'victork4314-sys/Example-';
const BRANCH = 'main';
const API = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;
const RAW = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;

document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="access.css">');

const treeEl = document.querySelector('#tree');
const viewer = document.querySelector('#viewer');
let activeObjectUrl = null;

const audioTypes = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus']);
const videoTypes = new Set(['mp4', 'webm', 'mov', 'm4v']);
const imageTypes = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);
const textTypes = new Set(['txt', 'md', 'json', 'csv', 'xml', 'musicxml', 'mxl', 'ly', 'abc']);

function revokeActiveUrl() {
  if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
  activeObjectUrl = null;
}

function extension(path) {
  const name = path.split('/').pop() || '';
  return name.includes('.') ? name.split('.').pop().toLowerCase() : '';
}

function displayName(value) {
  return decodeURIComponent(value).replace(/[-_]+/g, ' ');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function rawUrl(path) {
  return RAW + path.split('/').map(encodeURIComponent).join('/');
}

function folderKey(path) {
  return `folder:${path}`;
}

function demoCode(path) {
  const folder = path.split('/').filter(Boolean).pop() || 'music';
  const cleaned = folder.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  return `${cleaned || 'MUSIC'}26`;
}

function isUnlocked(path) {
  return sessionStorage.getItem(folderKey(path)) === 'open';
}

function buildTree(paths) {
  const root = { name: 'music', path: 'music', folders: new Map(), files: [] };

  for (const fullPath of paths) {
    const parts = fullPath.split('/').filter(Boolean);
    if (parts.shift() !== 'music') continue;

    let node = root;
    const walked = ['music'];

    parts.forEach((part, index) => {
      const last = index === parts.length - 1;
      if (last) {
        node.files.push({ name: part, path: fullPath });
        return;
      }

      walked.push(part);
      if (!node.folders.has(part)) {
        node.folders.set(part, {
          name: part,
          path: walked.join('/'),
          folders: new Map(),
          files: []
        });
      }
      node = node.folders.get(part);
    });
  }

  return root;
}

function fileIcon(path) {
  const ext = extension(path);
  if (ext === 'pdf') return '▧';
  if (audioTypes.has(ext)) return '♪';
  if (videoTypes.has(ext)) return '▶';
  if (imageTypes.has(ext)) return '▣';
  if (textTypes.has(ext)) return '≡';
  return '·';
}

function folderContainsFiles(node) {
  return node.files.length > 0;
}

function showUnlock(node, afterUnlock) {
  revokeActiveUrl();
  const code = demoCode(node.path);
  viewer.innerHTML = `
    <div class="gate">
      <p class="eyebrow">Locked folder</p>
      <h2>${escapeHtml(displayName(node.name))}</h2>
      <p>${node.files.length} file${node.files.length === 1 ? '' : 's'} in this folder.</p>
      <button class="buy" type="button">Buy access</button>
      <div class="or"><span>or use a code</span></div>
      <form id="code-form">
        <input id="code" autocomplete="off" placeholder="Access code" aria-label="Access code">
        <button type="submit">Unlock</button>
      </form>
      <p id="code-error" class="code-error" role="alert"></p>
      <p class="demo-note">Demo code: <strong>${escapeHtml(code)}</strong></p>
    </div>`;

  viewer.querySelector('.buy').onclick = () => {
    alert('Connect this button to a protected checkout and server-issued access token.');
  };

  viewer.querySelector('form').onsubmit = event => {
    event.preventDefault();
    const entered = viewer.querySelector('#code').value.trim().toUpperCase();
    if (entered === code) {
      sessionStorage.setItem(folderKey(node.path), 'open');
      renderArchive();
      afterUnlock?.();
    } else {
      viewer.querySelector('#code-error').textContent = 'That code does not match this folder.';
    }
  };
}

async function fetchBlob(path) {
  const response = await fetch(rawUrl(path), {
    cache: 'no-store',
    credentials: 'omit',
    referrerPolicy: 'no-referrer'
  });
  if (!response.ok) throw new Error(`File returned ${response.status}`);
  return response.blob();
}

async function openFile(file, parentNode) {
  if (folderContainsFiles(parentNode) && !isUnlocked(parentNode.path)) {
    showUnlock(parentNode, () => openFile(file, parentNode));
    return;
  }

  revokeActiveUrl();
  const ext = extension(file.path);
  const title = displayName(file.name);
  viewer.innerHTML = `
    <div class="viewer-head">
      <h2>${escapeHtml(title)}</h2>
      <button class="lock-again" type="button">close</button>
    </div>
    <div id="piece-content"><div class="empty-state"><p>Opening file…</p></div></div>`;

  viewer.querySelector('.lock-again').onclick = () => {
    revokeActiveUrl();
    viewer.innerHTML = '<div class="empty-state"><p class="scribble">←</p><h2>Pick something from the shelf.</h2><p>Everything under the music folder appears automatically.</p></div>';
  };

  const content = viewer.querySelector('#piece-content');

  try {
    const blob = await fetchBlob(file.path);
    activeObjectUrl = URL.createObjectURL(blob);

    if (ext === 'pdf') {
      content.innerHTML = `
        <div class="pdf-preview-wrap">
          <object class="pdf-preview" data="${activeObjectUrl}#toolbar=0&navpanes=0" type="application/pdf">
            <iframe class="pdf-preview" src="${activeObjectUrl}#toolbar=0&navpanes=0" title="${escapeHtml(title)}"></iframe>
            <p class="error">This browser cannot show the PDF inline. <a href="${activeObjectUrl}" target="_blank" rel="noreferrer">Open the PDF</a>.</p>
          </object>
        </div>`;
      return;
    }

    if (audioTypes.has(ext)) {
      content.innerHTML = `<div class="audio-view"><div class="record" aria-hidden="true">♪</div><audio controls controlsList="nodownload noplaybackrate" preload="metadata" src="${activeObjectUrl}"></audio></div>`;
      return;
    }

    if (videoTypes.has(ext)) {
      content.innerHTML = `<div class="media-preview"><video controls controlsList="nodownload" src="${activeObjectUrl}"></video></div>`;
      return;
    }

    if (imageTypes.has(ext)) {
      content.innerHTML = `<div class="score-preview-wrap"><img class="score-preview" src="${activeObjectUrl}" alt="${escapeHtml(title)}" draggable="false"></div>`;
      return;
    }

    if (textTypes.has(ext) || blob.type.startsWith('text/')) {
      const text = await blob.text();
      content.innerHTML = `<pre class="text-preview">${escapeHtml(text)}</pre>`;
      return;
    }

    content.innerHTML = `<div class="empty-state"><h2>${escapeHtml(title)}</h2><p>This file type has no inline browser preview.</p><a href="${activeObjectUrl}" target="_blank" rel="noreferrer">Open file</a></div>`;
  } catch (error) {
    content.innerHTML = `<p class="error">This file could not open. ${escapeHtml(error.message)}.</p>`;
  }
}

let archiveRoot = null;

function renderFolder(node, container, depth = 0) {
  const wrapper = document.createElement('div');
  wrapper.className = `archive-node depth-${Math.min(depth, 6)}`;

  if (node !== archiveRoot) {
    const folderButton = document.createElement('button');
    folderButton.type = 'button';
    folderButton.className = 'archive-folder-button';
    folderButton.innerHTML = `<span class="folder-arrow">⌄</span><span class="folder-name">${escapeHtml(displayName(node.name))}</span>${folderContainsFiles(node) ? `<span class="folder-lock">${isUnlocked(node.path) ? 'open' : 'locked'}</span>` : ''}`;
    wrapper.appendChild(folderButton);

    const children = document.createElement('div');
    children.className = 'archive-children';
    wrapper.appendChild(children);

    folderButton.onclick = () => {
      const collapsed = children.classList.toggle('collapsed');
      folderButton.querySelector('.folder-arrow').textContent = collapsed ? '›' : '⌄';
      if (!collapsed && folderContainsFiles(node) && !isUnlocked(node.path)) showUnlock(node);
    };

    container.appendChild(wrapper);
    container = children;
  }

  [...node.folders.values()]
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .forEach(folder => renderFolder(folder, container, depth + 1));

  node.files
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .forEach(file => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'archive-file-button';
      button.innerHTML = `<span class="file-mark">${fileIcon(file.path)}</span><span>${escapeHtml(displayName(file.name))}</span>`;
      button.onclick = () => openFile(file, node);
      container.appendChild(button);
    });
}

function renderArchive() {
  treeEl.innerHTML = '';
  if (!archiveRoot || (!archiveRoot.folders.size && !archiveRoot.files.length)) {
    treeEl.innerHTML = '<p class="error">The music folder is empty.</p>';
    return;
  }
  renderFolder(archiveRoot, treeEl);
}

async function load() {
  try {
    const response = await fetch(API, { cache: 'no-store', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const data = await response.json();
    const paths = data.tree
      .filter(item => item.type === 'blob' && item.path.startsWith('music/'))
      .map(item => item.path)
      .filter(path => !path.split('/').pop().startsWith('.'));

    archiveRoot = buildTree(paths);
    renderArchive();
  } catch (error) {
    treeEl.innerHTML = `<p class="error">The archive could not be read. ${escapeHtml(error.message)}.</p>`;
  }
}

window.addEventListener('pagehide', revokeActiveUrl);
document.addEventListener('contextmenu', event => {
  if (event.target.closest('.pdf-preview-wrap, .score-preview-wrap, .audio-view, .media-preview')) event.preventDefault();
});

load();
