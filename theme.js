const THEMES = {
  charcoal: { label:'Charcoal', paper:'#171717', ink:'#ece8e1', muted:'#aaa39a', line:'#3c3935', soft:'#252321', accent:'#b28b67' },
  midnight: { label:'Midnight Blue', paper:'#101722', ink:'#e8edf4', muted:'#98a4b3', line:'#2d3948', soft:'#192433', accent:'#7894b8' },
  forest: { label:'Deep Forest', paper:'#101813', ink:'#e4ebe5', muted:'#97a59a', line:'#2b3b30', soft:'#18241c', accent:'#7f9b82' },
  burgundy: { label:'Burgundy', paper:'#1a1114', ink:'#eee5e7', muted:'#aa969b', line:'#422b31', soft:'#27191d', accent:'#a66d79' },
  slate: { label:'Slate', paper:'#161a1e', ink:'#e9ecef', muted:'#9da5ac', line:'#353d44', soft:'#20262b', accent:'#8495a3' },
  aubergine: { label:'Aubergine', paper:'#171218', ink:'#eee7ef', muted:'#a89daa', line:'#3d3040', soft:'#241b26', accent:'#967b9c' },
  espresso: { label:'Espresso', paper:'#191411', ink:'#eee8e3', muted:'#aa9e95', line:'#43352d', soft:'#271e19', accent:'#a47d62' },
  petrol: { label:'Petrol', paper:'#0f181a', ink:'#e4ecec', muted:'#93a5a6', line:'#294044', soft:'#172528', accent:'#6f999b' },
  graphite: { label:'Graphite', paper:'#141516', ink:'#e7e7e5', muted:'#9d9e9c', line:'#343637', soft:'#202223', accent:'#8d918c' },
  'black-gold': { label:'Black & Gold', paper:'#11110f', ink:'#eeeadd', muted:'#aaa38d', line:'#3e392a', soft:'#1e1c16', accent:'#b49a5d' }
};

const FONTS = [
  ['georgia','Georgia'], ['baskerville','Baskerville'], ['garamond','Garamond'],
  ['times','Times New Roman'], ['palatino','Palatino'], ['book-antiqua','Book Antiqua'],
  ['trebuchet','Trebuchet'], ['arial','Arial'], ['verdana','Verdana'], ['courier','Courier New']
];

const savedTheme = localStorage.getItem('composer-theme') || 'charcoal';
const savedFont = localStorage.getItem('composer-font') || 'georgia';

function applyTheme(name) {
  const theme = THEMES[name] || THEMES.charcoal;
  const root = document.documentElement;
  root.dataset.theme = name in THEMES ? name : 'charcoal';
  root.style.setProperty('--paper', theme.paper);
  root.style.setProperty('--ink', theme.ink);
  root.style.setProperty('--muted', theme.muted);
  root.style.setProperty('--line', theme.line);
  root.style.setProperty('--soft', theme.soft);
  root.style.setProperty('--accent', theme.accent);
  document.body?.style.setProperty('background', theme.paper);
  document.body?.style.setProperty('color', theme.ink);
}

function applyFont(name) {
  document.documentElement.dataset.font = name;
}

applyTheme(savedTheme);
applyFont(savedFont);

function createPicker(labelText, ariaLabel, options, selectedValue, onChange) {
  const wrap = document.createElement('label');
  wrap.className = 'site-picker';
  const label = document.createElement('span');
  label.textContent = labelText;
  const select = document.createElement('select');
  select.setAttribute('aria-label', ariaLabel);
  options.forEach(([value, text]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    option.selected = value === selectedValue;
    select.appendChild(option);
  });
  select.addEventListener('change', () => onChange(select.value));
  wrap.append(label, select);
  return wrap;
}

function mountPickers() {
  const host = document.querySelector('.site-header');
  if (!host || host.querySelector('.site-pickers')) return;
  const controls = document.createElement('div');
  controls.className = 'site-pickers';
  controls.appendChild(createPicker('Theme', 'Choose site theme', Object.entries(THEMES).map(([value, item]) => [value, item.label]), savedTheme, value => {
    applyTheme(value);
    localStorage.setItem('composer-theme', value);
  }));
  controls.appendChild(createPicker('Font', 'Choose site font', FONTS, savedFont, value => {
    applyFont(value);
    localStorage.setItem('composer-font', value);
  }));
  host.appendChild(controls);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountPickers);
else mountPickers();