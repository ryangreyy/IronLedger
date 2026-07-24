/* Shared Firebase bootstrap, loaded right after firebase-config.js on every
   page and before any script that touches Firestore. Enables offline
   persistence (IndexedDB-backed) so onSnapshot listeners resolve instantly
   from the last-synced local cache on load instead of waiting on a network
   round trip every time — the server copy still reconciles moments later.
   Must run before any other Firestore read/write, which is why this file
   is the very first Firebase-touching script on every page. */
(function () {
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  if (window.__igPersistenceInited) return;
  window.__igPersistenceInited = true;
  try {
    firebase.firestore().enablePersistence({ synchronizeTabs: true }).catch(function () {});
  } catch (e) {}
})();
