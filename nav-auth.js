/* nav-auth.js — shared nav auth handler for sub-pages (guide.html, settings.html) */
(function () {
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

  const CDN = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets';
  const AVATARS = [
    { id:'bunny',    url:`${CDN}/Rabbit%20face/3D/rabbit_face_3d.png` },
    { id:'cat',      url:`${CDN}/Cat%20face/3D/cat_face_3d.png` },
    { id:'panda',    url:`${CDN}/Panda/3D/panda_3d.png` },
    { id:'fox',      url:`${CDN}/Fox/3D/fox_3d.png` },
    { id:'koala',    url:`${CDN}/Koala/3D/koala_3d.png` },
    { id:'otter',    url:`${CDN}/Otter/3D/otter_3d.png` },
    { id:'flamingo', url:`${CDN}/Flamingo/3D/flamingo_3d.png` },
    { id:'penguin',  url:`${CDN}/Penguin/3D/penguin_3d.png` },
    { id:'wolf',     url:`${CDN}/Wolf/3D/wolf_3d.png` },
    { id:'lion',     url:`${CDN}/Lion/3D/lion_3d.png` },
    { id:'tiger',    url:`${CDN}/Tiger%20face/3D/tiger_face_3d.png` },
    { id:'bear',     url:`${CDN}/Bear/3D/bear_3d.png` },
    { id:'shark',    url:`${CDN}/Shark/3D/shark_3d.png` },
    { id:'gorilla',  url:`${CDN}/Gorilla/3D/gorilla_3d.png` },
    { id:'trex',     url:`${CDN}/T-rex/3D/t-rex_3d.png` },
    { id:'leopard',  url:`${CDN}/Leopard/3D/leopard_3d.png` },
    { id:'dolphin',  url:`${CDN}/Dolphin/3D/dolphin_3d.png` },
    { id:'octopus',  url:`${CDN}/Octopus/3D/octopus_3d.png` },
    { id:'whale',    url:`${CDN}/Spouting%20whale/3D/spouting_whale_3d.png` },
    { id:'crab',     url:`${CDN}/Crab/3D/crab_3d.png` },
    { id:'lobster',  url:`${CDN}/Lobster/3D/lobster_3d.png` },
    { id:'seal',     url:`${CDN}/Seal/3D/seal_3d.png` },
    { id:'blowfish', url:`${CDN}/Blowfish/3D/blowfish_3d.png` },
    { id:'tropfish', url:`${CDN}/Tropical%20fish/3D/tropical_fish_3d.png` },
    { id:'eagle',    url:`${CDN}/Eagle/3D/eagle_3d.png` },
    { id:'horse',    url:`${CDN}/Horse%20face/3D/horse_face_3d.png` },
    { id:'croc',     url:`${CDN}/Crocodile/3D/crocodile_3d.png` },
    { id:'rhino',    url:`${CDN}/Rhinoceros/3D/rhinoceros_3d.png` },
    { id:'peacock',  url:`${CDN}/Peacock/3D/peacock_3d.png` },
    { id:'bison',    url:`${CDN}/Bison/3D/bison_3d.png` },
    { id:'boar',     url:`${CDN}/Boar/3D/boar_3d.png` },
    { id:'mammoth',  url:`${CDN}/Mammoth/3D/mammoth_3d.png` },
    { id:'dragon',   url:`${CDN}/Dragon/3D/dragon_3d.png` },
    { id:'unicorn',  url:`${CDN}/Unicorn/3D/unicorn_3d.png` },
    { id:'alien',    url:`${CDN}/Alien/3D/alien_3d.png` },
    { id:'ghost',    url:`${CDN}/Ghost/3D/ghost_3d.png` },
    { id:'robot',    url:`${CDN}/Robot/3D/robot_3d.png` },
    { id:'drgface',  url:`${CDN}/Dragon%20face/3D/dragon_face_3d.png` },
    { id:'sauro',    url:`${CDN}/Sauropod/3D/sauropod_3d.png` },
    { id:'jackolan', url:`${CDN}/Jack-o-lantern/3D/jack-o-lantern_3d.png` },
    { id:'bicep',    url:`${CDN}/Mechanical%20arm/3D/mechanical_arm_3d.png` },
    { id:'trophy',   url:`${CDN}/Trophy/3D/trophy_3d.png` },
    { id:'fire',     url:`${CDN}/Fire/3D/fire_3d.png` },
    { id:'bolt',     url:`${CDN}/High%20voltage/3D/high_voltage_3d.png` },
    { id:'dumbbell', url:`${CDN}/Skull/3D/skull_3d.png` },
    { id:'medal',    url:`${CDN}/Sports%20medal/3D/sports_medal_3d.png` },
    { id:'crown',    url:`${CDN}/Crown/3D/crown_3d.png` },
    { id:'shoe',     url:`${CDN}/Running%20shoe/3D/running_shoe_3d.png` },
    { id:'zany',     url:`${CDN}/Zany%20face/3D/zany_face_3d.png` },
    { id:'clown',    url:`${CDN}/Clown%20face/3D/clown_face_3d.png` },
    { id:'updown',   url:`${CDN}/Upside-down%20face/3D/upside-down_face_3d.png` },
    { id:'cowboy',   url:`${CDN}/Cowboy%20hat%20face/3D/cowboy_hat_face_3d.png` },
    { id:'nerd',     url:`${CDN}/Nerd%20face/3D/nerd_face_3d.png` },
    { id:'disguise', url:`${CDN}/Disguised%20face/3D/disguised_face_3d.png` },
    { id:'party',    url:`${CDN}/Partying%20face/3D/partying_face_3d.png` },
    { id:'wink',     url:`${CDN}/Winking%20face%20with%20tongue/3D/winking_face_with_tongue_3d.png` },
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
