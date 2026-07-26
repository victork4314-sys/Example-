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

const savedTheme = localStorage.getItem('composer-theme') || 'charcoal';
document.documentElement.dataset.theme = savedTheme;

window.addEventListener('DOMContentLoaded', () => {
  const host = document.querySelector('.site-header');
  if (!host) return;

  const wrap = document.createElement('label');
  wrap.className = 'theme-picker';
  wrap.innerHTML = '<span>Theme</span>';

  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Choose site theme');
  THEMES.forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    option.selected = value === savedTheme;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    document.documentElement.dataset.theme = select.value;
    localStorage.setItem('composer-theme', select.value);
  });

  wrap.appendChild(select);
  host.appendChild(wrap);
});
