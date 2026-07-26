const REPO = 'victork4314-sys/Example-';
const BRANCH = 'main';
const API = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;
const RAW = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;

const treeEl = document.querySelector('#tree');
const viewerEl = document.querySelector('#viewer');

const scoreTypes = ['pdf', 'svg', 'png', 'jpg', 'jpeg', 'webp'];
const audioTypes = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];

function extension(path) {
  return path.split('.').pop().toLowerCase();
}

function titleFromPath(path) {
  const filename = path.split('/').pop().replace(/\.[^.]+$/, '');
  return filename.replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function nodeForPath(root, path) {
  const parts = path.split('/');
  let node = root;
  parts.forEach((part, index) => {
    if (!node.children[part]) {
      node.children[part] = { children: {}, file: index === parts.length - 1 ? path : null };
    }
    node = node.children[part];
  });
}

function buildTree(paths) {
  const root = { children: {} };
  paths.forEach(path => nodeForPath(root, path));
  return root;
}

function renderNode(node, container) {
  Object.entries(node.children)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .forEach(([name, child]) => {
      if (child.file) {
        const ext = extension(child.file);
        const button = document.createElement('button');
        button.type = 'button';
        button.innerHTML = `<span class="file-mark">${audioTypes.includes(ext) ? '♪' : '▧'}</span>${name.replace(/\.[^.]+$/, '')}`;
        button.addEventListener('click', () => {
          document.querySelectorAll('.tree button').forEach(item => item.classList.remove('selected'));
          button.classList.add('selected');
          openFile(child.file);
        });
        container.appendChild(button);
        return;
      }

      const group = document.createElement('div');
      group.className = 'tree-group';
      const label = document.createElement('div');
      label.className = 'tree-folder';
      label.innerHTML = `<span>⌄</span><span>${name}</span>`;
      const children = document.createElement('div');
      children.className = 'tree-children';
      group.append(label, children);
      container.appendChild(group);
      renderNode(child, children);
    });
}

function openFile(path) {
  const ext = extension(path);
  const url = RAW + path.split('/').map(encodeURIComponent).join('/');
  const title = titleFromPath(path);

  if (audioTypes.includes(ext)) {
    viewerEl.innerHTML = `
      <div class="viewer-head">
        <h2>${title}</h2>
        <a href="${url}" download>download</a>
      </div>
      <div class="audio-view">
        <div class="record" aria-hidden="true">♪</div>
        <audio controls preload="metadata" src="${url}">Your browser cannot play this recording.</audio>
      </div>`;
    return;
  }

  if (scoreTypes.includes(ext)) {
    viewerEl.innerHTML = `
      <div class="viewer-head">
        <h2>${title}</h2>
        <a href="${url}" target="_blank" rel="noreferrer">open separately</a>
      </div>
      <iframe class="score-frame" title="Score: ${title}" src="${url}"></iframe>`;
    return;
  }

  viewerEl.innerHTML = `<p class="error">This file is in the archive, but the site does not know how to preview .${ext} files.</p>`;
}

async function loadArchive() {
  try {
    const response = await fetch(API, { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const data = await response.json();
    const paths = data.tree
      .filter(item => item.type === 'blob')
      .map(item => item.path)
      .filter(path => path.startsWith('scores/') || path.startsWith('audio/'))
      .filter(path => scoreTypes.includes(extension(path)) || audioTypes.includes(extension(path)));

    if (!paths.length) {
      treeEl.textContent = 'No scores or recordings yet.';
      return;
    }

    treeEl.textContent = '';
    renderNode(buildTree(paths), treeEl);
  } catch (error) {
    treeEl.innerHTML = `<p class="error">The archive could not be read right now. ${error.message}.</p>`;
  }
}

loadArchive();
