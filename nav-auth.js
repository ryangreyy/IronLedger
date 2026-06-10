/* nav-auth.js — shared nav auth handler for sub-pages (guide.html, settings.html) */
(function () {
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

  const CDN = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets';
  const AVATARS = [
    { id:'bunny',    url:`${CDN}/Rabbit%20face/3D/rabbit_face_3d.png` },
    { id:'cat',      url:`${CDN}/Cat%20face/3D/cat_face_3d.png` },
    { id:'unicorn',  url:`${CDN}/Unicorn/3D/unicorn_3d.png` },
    { id:'flamingo', url:`${CDN}/Flamingo/3D/flamingo_3d.png` },
    { id:'panda',    url:`${CDN}/Panda/3D/panda_3d.png` },
    { id:'fox',      url:`${CDN}/Fox/3D/fox_3d.png` },
    { id:'koala',    url:`${CDN}/Koala/3D/koala_3d.png` },
    { id:'otter',    url:`${CDN}/Otter/3D/otter_3d.png` },
    { id:'wolf',     url:`${CDN}/Wolf/3D/wolf_3d.png` },
    { id:'lion',     url:`${CDN}/Lion/3D/lion_3d.png` },
    { id:'tiger',    url:`${CDN}/Tiger%20face/3D/tiger_face_3d.png` },
    { id:'bear',     url:`${CDN}/Bear/3D/bear_3d.png` },
    { id:'shark',    url:`${CDN}/Shark/3D/shark_3d.png` },
    { id:'gorilla',  url:`${CDN}/Gorilla/3D/gorilla_3d.png` },
    { id:'trex',     url:`${CDN}/T-rex/3D/t-rex_3d.png` },
    { id:'dragon',   url:`${CDN}/Dragon/3D/dragon_3d.png` },
  ];

  function applyAvatar(el, user, avatarId, avatarBg) {
    if (!el) return;
    const av = avatarId && AVATARS.find(a => a.id === avatarId);
    if (av) {
      el.style.cssText = `background:${avatarBg || '#1a1c1e'};`;
      el.innerHTML = `<img src="${av.url}" alt="" style="width:26px;height:26px;object-fit:contain;" onerror="this.style.display='none'">`;
    } else if (user && user.photoURL) {
      el.style.cssText = '';
      el.innerHTML = `<img src="${user.photoURL}" alt="">`;
    } else if (user) {
      el.style.cssText = '';
      el.innerHTML = '';
      el.textContent = (user.displayName || user.email || '?').charAt(0).toUpperCase();
    } else {
      el.style.cssText = '';
      el.innerHTML = '';
    }
  }

  const auth = firebase.auth();
  const db   = firebase.firestore();

  const navSignedIn  = document.getElementById('nav-signed-in');
  const navSignedOut = document.getElementById('nav-signed-out');
  const navUserName  = document.getElementById('nav-user-name');
  const navAvatarEl  = document.getElementById('nav-avatar');
  const signOutBtn   = document.getElementById('signOut');

  if (signOutBtn) signOutBtn.addEventListener('click', () => auth.signOut());

  auth.onAuthStateChanged(async user => {
    if (user) {
      if (navSignedIn)  navSignedIn.style.display  = 'flex';
      if (navSignedOut) navSignedOut.style.display = 'none';
      if (navUserName)  navUserName.textContent = user.displayName || user.email.split('@')[0];
      try {
        const snap = await db.doc(`users/${user.uid}/settings/main`).get();
        const d = snap.data() || {};
        applyAvatar(navAvatarEl, user, d.avatarId, d.avatarBg);
      } catch (_) {
        applyAvatar(navAvatarEl, user, null, null);
      }
    } else {
      if (navSignedIn)  navSignedIn.style.display  = 'none';
      if (navSignedOut) navSignedOut.style.display = '';
      applyAvatar(navAvatarEl, null, null, null);
    }
  });

  /* Hamburger toggle */
  const hamburger  = document.getElementById('nav-hamburger');
  const navLinksEl = document.getElementById('nav-links');
  if (hamburger && navLinksEl) {
    hamburger.addEventListener('click', e => { e.stopPropagation(); navLinksEl.classList.toggle('open'); });
    navLinksEl.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinksEl.classList.remove('open')));
    document.addEventListener('click', () => navLinksEl.classList.remove('open'));
  }
})();
