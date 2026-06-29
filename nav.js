(function () {
  var style = document.createElement('style');
  style.textContent =
    '.mobile-bottom-nav{' +
      'display:none;position:fixed;bottom:0;left:0;right:0;z-index:999;' +
      'flex-direction:row;' +
      'background:#0d0f12;' +
      'border-top:1px solid transparent;' +
      'background-clip:padding-box;' +
      'box-shadow:inset 0 1px 0 rgba(210,185,110,.2),0 -6px 24px rgba(0,0,0,.55);' +
      'padding-bottom:env(safe-area-inset-bottom,0px);' +
    '}' +
    '.mbn-item{' +
      'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
      'gap:3px;padding:9px 0 6px;text-decoration:none;' +
      'color:rgba(255,255,255,.22);' +
      'font-size:9px;font-family:"JetBrains Mono",var(--mono,monospace);font-weight:700;' +
      'letter-spacing:.06em;text-transform:uppercase;' +
      '-webkit-tap-highlight-color:transparent;transition:color .12s;' +
    '}' +
    '.mbn-item i{font-size:23px;line-height:1;}' +
    '.mbn-item.mbn-active{color:#c1272d;}' +
    '.mbn-item:not(.mbn-active):active{color:rgba(255,255,255,.55);}' +
    '@media(max-width:700px){' +
      '.mobile-bottom-nav{display:flex;}' +
      'body{padding-bottom:calc(58px + env(safe-area-inset-bottom,0px)) !important;}' +
    '}';
  document.head.appendChild(style);

  var p = location.pathname.split('/').pop();
  if (!p || p === '/') p = 'index.html';

  var items = [
    ['index.html',    'ti-home-2',       'Home',     ['index.html', '']],
    ['training.html', 'ti-barbell',      'Training', ['training.html']],
    ['dashboard.html','ti-chart-bar',    'Dashboard',['dashboard.html']],
    ['feed.html',     'ti-activity',     'Feed',     ['feed.html']],
    ['profile.html',  'ti-user-circle',  'Profile',  ['profile.html']],
  ];

  var nav = document.createElement('nav');
  nav.className = 'mobile-bottom-nav';
  nav.setAttribute('aria-label', 'Main navigation');
  nav.innerHTML = items.map(function (item) {
    var active = item[3].indexOf(p) >= 0 ? ' mbn-active' : '';
    return '<a href="' + item[0] + '" class="mbn-item' + active + '">' +
      '<i class="ti ' + item[1] + '" aria-hidden="true"></i>' +
      '<span>' + item[2] + '</span>' +
    '</a>';
  }).join('');

  function mount() { document.body.appendChild(nav); }
  if (document.body) { mount(); } else { document.addEventListener('DOMContentLoaded', mount); }
}());
