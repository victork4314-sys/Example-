const THEMES = [
  ['charcoal','Charcoal'],
  ['midnight','Midnight Blue'],
  ['forest','Deep Forest'],
  ['burgundy','Burgundy'],
  ['slate','Slate'],
  ['aubergine','Aubergine'],
  ['espresso','Espresso'],
  ['petrol','Petrol'],
  ['graphite','Graphite'],
  ['black-gold','Black & Gold']
];

const FONTS = [
  ['georgia','Georgia'],
  ['baskerville','Baskerville'],
  ['garamond','Garamond'],
  ['times','Times New Roman'],
  ['palatino','Palatino'],
  ['book-antiqua','Book Antiqua'],
  ['trebuchet','Trebuchet'],
  ['arial','Arial'],
  ['verdana','Verdana'],
  ['courier','Courier New']
];

const savedTheme = localStorage.getItem('composer-theme') || 'charcoal';
const savedFont = localStorage.getItem('composer-font') || 'georgia';
document.documentElement.dataset.theme = savedTheme;
document.documentElement.dataset.font = savedFont;

function createPicker(labelText, ariaLabel, options, selectedValue, onChange) {
  const wrap = document.createElement('label');
  wrap.className = 'site-picker';
  wrap.innerHTML = `<span>${labelText}</span>`;

  const select = document.createElement('select');
  select.setAttribute('aria-label', ariaLabel);
  options.forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    option.selected = value === selectedValue;
    select.appendChild(option);
  });

  select.addEventListener('change', () => onChange(select.value));
  wrap.appendChild(select);
  return wrap;
}

window.addEventListener('DOMContentLoaded', () => {
  const host = document.querySelector('.site-header');
  if (!host) return;

  const controls = document.createElement('div');
  controls.className = 'site-pickers';

  controls.appendChild(createPicker('Theme', 'Choose site theme', THEMES, savedTheme, value => {
    document.documentElement.dataset.theme = value;
    localStorage.setItem('composer-theme', value);
  }));

  controls.appendChild(createPicker('Font', 'Choose site font', FONTS, savedFont, value => {
    document.documentElement.dataset.font = value;
    localStorage.setItem('composer-font', value);
  }));

  host.appendChild(controls);
});