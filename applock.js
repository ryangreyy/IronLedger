/* applock.js — optional Face ID / biometric lock screen.
   Loaded render-blocking in <head> on every page so it can hide content
   BEFORE first paint (no flash of your data before the lock appears).

   How it works, and its honest limits:
   - Opt-in. Does nothing unless the user enabled it in Settings, which
     stores `ig-faceid-lock=1` + a WebAuthn credential id in localStorage
     (device-local — the lock is per-device, which is correct).
   - Uses WebAuthn with userVerification:'required', so on an iPhone the
     unlock prompt is Face ID (Touch ID on Mac, fingerprint on Android).
   - There is NO backend, so the biometric result is trusted client-side.
     That makes this a genuine privacy gate, not a cryptographic security
     boundary — someone technical with an unlocked phone could bypass it
     via dev tools. Fine for a personal fitness tracker; documented so
     nobody mistakes it for bank-grade auth.
   - Unlocks once per app launch (sessionStorage `ig-unlocked`), so moving
     between pages in the same session doesn't re-prompt; fully closing
     and reopening the app does. */
(function () {
  'use strict';

  var locked;
  try {
    locked = localStorage.getItem('ig-faceid-lock') === '1' &&
             sessionStorage.getItem('ig-unlocked') !== '1';
  } catch (e) { locked = false; }
  if (!locked) return;

  /* Synchronous, before first paint: styles.css hides everything except
     the .applock overlay while this attribute is present. */
  document.documentElement.setAttribute('data-locked', '1');

  function b64urlToBuf(s) {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/');
    var pad = s.length % 4; if (pad) s += new Array(5 - pad).join('=');
    var bin = atob(s), buf = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf.buffer;
  }

  function unlock() {
    try { sessionStorage.setItem('ig-unlocked', '1'); } catch (e) {}
    window.__igFaceIdPromptInFlight = false;
    document.documentElement.removeAttribute('data-locked');
    try { window.dispatchEvent(new CustomEvent('ig:applock-unlocked')); } catch (e) {}
    var o = document.querySelector('.applock');
    if (o) { o.style.opacity = '0'; setTimeout(function () { if (o.parentNode) o.remove(); }, 200); }
  }

  function setErr(msg) {
    var e = document.getElementById('applock-err');
    if (e) e.textContent = msg || '';
  }

  /* Guards against a real double-prompt: build() auto-fires attempt()
     250ms after the lock screen appears, but the "Unlock with Face ID"
     button ALSO calls attempt() on click. If the user taps the button
     around that 250ms window (or taps again while a request is still
     in flight), both calls used to reach navigator.credentials.get()
     independently, and iOS showed two separate Face ID prompts —
     one from each in-flight WebAuthn request. */
  var attemptInFlight = false;

  function attempt() {
    if (attemptInFlight || window.__igFaceIdPromptInFlight) return;
    var credId;
    try { credId = localStorage.getItem('ig-faceid-cred'); } catch (e) {}
    if (!credId || !window.PublicKeyCredential || !navigator.credentials) {
      setErr('Face ID isn’t available here. Use your password to continue.');
      return;
    }
    setErr('');
    attemptInFlight = true;
    window.__igFaceIdPromptInFlight = true;
    var challenge = new Uint8Array(32);
    (window.crypto || {}).getRandomValues && crypto.getRandomValues(challenge);
    navigator.credentials.get({
      publicKey: {
        challenge: challenge,
        allowCredentials: [{ id: b64urlToBuf(credId), type: 'public-key' }],
        userVerification: 'required',
        timeout: 60000,
        rpId: location.hostname
      }
    }).then(function () { attemptInFlight = false; unlock(); })
      .catch(function () {
        attemptInFlight = false;
        window.__igFaceIdPromptInFlight = false;
        setErr('Couldn’t verify — tap to try again.');
      });
  }

  /* Fallback: full re-login. Sign out (if Firebase is loaded on this page)
     and send them to the sign-in screen. sessionStorage is marked unlocked
     first so they don't get re-locked before they can log back in. */
  function usePassword() {
    try { sessionStorage.setItem('ig-unlocked', '1'); } catch (e) {}
    window.__igFaceIdPromptInFlight = false;
    document.documentElement.removeAttribute('data-locked');
    try { window.dispatchEvent(new CustomEvent('ig:applock-unlocked')); } catch (e) {}
    try {
      if (window.firebase && firebase.apps && firebase.apps.length) firebase.auth().signOut();
    } catch (e) {}
    location.href = '/index.html';
  }

  function lightTitleStyle() {
    var light = document.documentElement.getAttribute('data-theme') === 'light';
    try { light = light || localStorage.getItem('ig-theme') === 'light'; } catch (e) {}
    if (!light) return '';
    return ' style="background:linear-gradient(180deg,#ffffff 0%,#ffffff 28%,#dfe6ee 43%,#ffffff 52%,#f8fafc 72%,#edf2f7 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;-webkit-text-stroke:.45px rgba(0,0,0,.86);filter:drop-shadow(0 0 18px rgba(193,39,45,.25));"';
  }

  function build() {
    if (document.querySelector('.applock')) return;
    var wrap = document.createElement('div');
    wrap.className = 'applock';
    wrap.innerHTML =
      '<img class="applock-logo" src="/favicon.svg" alt="">' +
      '<div class="applock-title"' + lightTitleStyle() + '>IRONGLADIATOR</div>' +
      '<div class="applock-sub">Locked</div>' +
      '<button class="applock-btn" id="applock-go">Unlock with Face ID</button>' +
      '<div class="applock-err" id="applock-err"></div>' +
      '<button class="applock-fallback" id="applock-pw">Use password instead</button>';
    document.body.appendChild(wrap);
    document.getElementById('applock-go').addEventListener('click', attempt);
    document.getElementById('applock-pw').addEventListener('click', usePassword);
    /* Auto-fire on open. The "Use Passkey" chip iOS shows before Face ID
       is Apple's own required consent step for EVERY passkey sign-in on
       Safari -- it isn't caused by (or avoidable via) how this call is
       triggered, gesture or not. So there's no UX upside to waiting for
       a manual tap on our own button first; that just adds a second,
       redundant tap in front of the one Apple already requires. Firing
       immediately means the native "Use Passkey" prompt is the ONLY tap
       needed, and it appears the instant the app opens. */
    setTimeout(attempt, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
