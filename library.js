const REPO = 'victork4314-sys/Example-';
const BRANCH = 'main';
const API = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;
const RAW = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;

document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="access.css">');

const treeEl = document.querySelector('#tree');
const viewer = document.querySelector('#viewer');

const pieces = {
  'north-window': { title: 'North Window', detail: 'Violin and piano · 2026', code: 'WINDOW26', price: '$12' },
  'three-quiet-machines': { title: 'Three Quiet Machines', detail: 'Solo piano · 2025', code: 'QUIET26', price: '$10' },
  'after-the-rain-line': { title: 'After the Rain Line', detail: 'String quartet · 2024', code: 'RAINLINE', price: '$18' },
  'harbour-static': { title: 'Harbour Static', detail: 'Electronics · 2026', code: 'HARBOUR', price: '$8' },
  'paper-birds': { title: 'Paper Birds', detail: 'Flute and cello · 2025', code: 'BIRDS25', price: '$12' },
  'winter-room': { title: 'Winter Room', detail: 'Solo violin · 2024', code: 'WINTER24', price: '$9' },
  'small-hours': { title: 'Small Hours', detail: 'Clarinet trio · 2026', code: 'HOURS26', price: '$14' },
  'stone-and-salt': { title: 'Stone and Salt', detail: 'Mixed ensemble · 2025', code: 'SALTSTONE', price: '$16' },
  'the-last-lamp': { title: 'The Last Lamp', detail: 'Voice and piano · 2024', code: 'LAMP24', price: '$11' },
  'field-notes': { title: 'Field Notes', detail: 'Percussion and tape · 2026', code: 'FIELD26', price: '$13' }
};

let files = {};
let activeObjectUrl = null;

const unlocked = id => sessionStorage.getItem(`piece:${id}`) === 'open';

function revokeActiveUrl() {
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }
}

function showGate(id) {
  revokeActiveUrl();
  const p = pieces[id];
  viewer.innerHTML = `
    <div class="gate">
      <p class="eyebrow">Locked piece</p>
      <h2>${p.title}</h2>
      <p>${p.detail}</p>
      <p class="price">${p.price}</p>
      <button class="buy" type="button">Buy access</button>
      <div class="or"><span>or use a code</span></div>
      <form id="code-form">
        <input id="code" autocomplete="off" inputmode="text" placeholder="Access code" aria-label="Access code">
        <button type="submit">Unlock</button>
      </form>
      <p id="code-error" class="code-error" role="alert"></p>
      <p class="demo-note">Demo code: <strong>${p.code}</strong></p>
    </div>`;

  viewer.querySelector('.buy').onclick = () => {
    alert('Connect this button to a protected checkout and server-issued access token.');
  };

  viewer.querySelector('form').onsubmit = event => {
    event.preventDefault();
    const entered = viewer.querySelector('#code').value.trim().toUpperCase();
    if (entered === p.code) {
      sessionStorage.setItem(`piece:${id}`, 'open');
      renderTree();
      showPiece(id);
    } else {
      viewer.querySelector('#code-error').textContent = 'That code does not match this piece.';
    }
  };
}

async function fetchProtectedBlob(path, expectedType) {
  const response = await fetch(RAW + path, {
    cache: 'no-store',
    credentials: 'omit',
    referrerPolicy: 'no-referrer'
  });

  if (!response.ok) throw new Error(`File returned ${response.status}`);
  const sourceBlob = await response.blob();
  return new Blob([await sourceBlob.arrayBuffer()], { type: expectedType });
}

async function openScore(id) {
  revokeActiveUrl();
  const p = pieces[id];
  const content = viewer.querySelector('#piece-content');
  content.innerHTML = '<div class="empty-state"><p>Opening score…</p></div>';

  try {
    const blob = await fetchProtectedBlob(files[id].score, 'image/svg+xml');
    activeObjectUrl = URL.createObjectURL(blob);
    content.innerHTML = `
      <div class="score-preview-wrap">
        <img class="score-preview" src="${activeObjectUrl}" alt="Score preview for ${p.title}" draggable="false">
      </div>`;
  } catch (error) {
    content.innerHTML = `<p class="error">The score preview could not open. ${error.message}.</p>`;
  }
}

async function openAudio(id) {
  revokeActiveUrl();
  const content = viewer.querySelector('#piece-content');
  content.innerHTML = '<div class="empty-state"><p>Opening recording…</p></div>';

  try {
    const blob = await fetchProtectedBlob(files[id].audio, 'audio/wav');
    activeObjectUrl = URL.createObjectURL(blob);
    content.innerHTML = `
      <div class="audio-view">
        <div class="record" aria-hidden="true">♪</div>
        <audio controls controlsList="nodownload noplaybackrate" preload="metadata" src="${activeObjectUrl}"></audio>
      </div>`;
  } catch (error) {
    content.innerHTML = `<p class="error">The recording could not open. ${error.message}.</p>`;
  }
}

function showPiece(id) {
  if (!unlocked(id)) {
    showGate(id);
    return;
  }

  revokeActiveUrl();
  const p = pieces[id];
  viewer.innerHTML = `
    <div class="viewer-head">
      <h2>${p.title}</h2>
      <button class="lock-again" type="button">lock again</button>
    </div>
    <div class="piece-tabs">
      <button data-kind="score" class="selected">Score</button>
      <button data-kind="audio">Audio</button>
    </div>
    <div id="piece-content"></div>`;

  const tabs = [...viewer.querySelectorAll('.piece-tabs button')];
  const open = kind => {
    tabs.forEach(button => button.classList.toggle('selected', button.dataset.kind === kind));
    if (kind === 'score') openScore(id);
    else openAudio(id);
  };

  tabs.forEach(button => button.onclick = () => open(button.dataset.kind));
  viewer.querySelector('.lock-again').onclick = () => {
    sessionStorage.removeItem(`piece:${id}`);
    revokeActiveUrl();
    renderTree();
    showGate(id);
  };

  open('score');
}

function renderTree() {
  treeEl.innerHTML = '';
  Object.keys(pieces).forEach(id => {
    if (!files[id]?.score || !files[id]?.audio) return;
    const p = pieces[id];
    const group = document.createElement('div');
    group.className = 'piece-folder';
    group.innerHTML = `
      <button class="folder-button" type="button">
        <span>${unlocked(id) ? '⌄' : '▸'}</span>
        <span><strong>${p.title}</strong><small>${p.detail}</small></span>
        <span class="folder-lock">${unlocked(id) ? 'open' : 'locked'}</span>
      </button>
      <div class="folder-files ${unlocked(id) ? '' : 'hidden'}">
        <button data-kind="score" type="button">▧ score</button>
        <button data-kind="audio" type="button">♪ audio</button>
      </div>`;

    group.querySelector('.folder-button').onclick = () => showPiece(id);
    group.querySelectorAll('.folder-files button').forEach(button => {
      button.onclick = () => {
        showPiece(id);
        setTimeout(() => viewer.querySelector(`[data-kind="${button.dataset.kind}"]`)?.click(), 0);
      };
    });
    treeEl.appendChild(group);
  });
}

async function load() {
  try {
    const response = await fetch(API, { cache: 'no-store', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const data = await response.json();

    data.tree
      .filter(item => item.type === 'blob' && item.path.startsWith('pieces/'))
      .forEach(item => {
        const [, id, name] = item.path.split('/');
        if (!pieces[id] || (name !== 'score.svg' && name !== 'audio.wav')) return;
        files[id] ??= {};
        files[id][name === 'score.svg' ? 'score' : 'audio'] = item.path;
      });

    renderTree();
  } catch (error) {
    treeEl.innerHTML = `<p class="error">The archive could not be read. ${error.message}.</p>`;
  }
}

window.addEventListener('pagehide', revokeActiveUrl);
document.addEventListener('contextmenu', event => {
  if (event.target.closest('.score-preview-wrap, .audio-view')) event.preventDefault();
});

load();
