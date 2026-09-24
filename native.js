/* ============ NATIVE SHELL (iOS via Capacitor) ============ */
/* Does nothing in a normal browser. When the same files run inside the iOS
   app, this wires up the status bar, splash screen, hardware back gesture,
   and hands the app native share and photo pickers. Plugins are read off the
   Capacitor global, so there is still no build step. */
(function () {
  const cap = window.Capacitor;
  const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const P = (cap && cap.Plugins) || {};
  window.TF_NATIVE = native;
  document.documentElement.classList.toggle('is-native', native);
  if (!native) return;

  document.documentElement.classList.add('ios');

  const ready = async () => {
    try { await P.StatusBar?.setStyle({ style: 'DARK' }); } catch (e) {}
    try { await P.StatusBar?.setBackgroundColor({ color: '#07140f' }); } catch (e) {}
    try { await P.SplashScreen?.hide(); } catch (e) {}
  };
  if (document.readyState === 'complete') ready();
  else addEventListener('load', () => setTimeout(ready, 350));

  /* the swipe-back gesture should walk the app's own history, not close it */
  try {
    P.App?.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack || (location.hash && location.hash !== '#/')) history.back();
      else P.App?.exitApp();
    });
  } catch (e) {}

  /* links to other sites open in the system browser rather than replacing the app */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[target="_blank"], a[rel~="noopener"]');
    if (!a || !a.href || a.href.startsWith(location.origin)) return;
    e.preventDefault();
    try { P.Browser?.open({ url: a.href, presentationStyle: 'popover' }); }
    catch (err) { window.open(a.href, '_blank'); }
  });

  /* Sign-in runs in the system browser; it comes back through the app's link
     scheme, which reopens the app and lands here. */
  window.tfOpenAuth = async (url) => {
    try { await P.Browser?.open({ url, presentationStyle: 'popover' }); } catch (e) { location.href = url; }
  };
  try {
    P.App?.addListener('appUrlOpen', async ({ url }) => {
      if (!url || !url.startsWith('app.thetradingfloor.ios://')) return;
      try { await P.Browser?.close(); } catch (e) {}
      if (typeof DB === 'undefined') return;
      const msg = await DB.finishAppSignIn(url);
      window.dispatchEvent(new CustomEvent('tf:app-signin', { detail: msg }));
    });
  } catch (e) {}

  /* share sheet, used by the share button when running natively */
  window.tfShare = async ({ title, text, url }) => {
    try { await P.Share?.share({ title, text, url, dialogTitle: 'Share' }); return true; } catch (e) { return false; }
  };

  /* camera or library, returns a File so the existing upload code is unchanged */
  window.tfPickPhoto = async (fromCamera) => {
    try {
      const shot = await P.Camera?.getPhoto({
        quality: 82, allowEditing: false, resultType: 'base64',
        source: fromCamera ? 'CAMERA' : 'PHOTOS', saveToGallery: false,
      });
      if (!shot?.base64String) return null;
      const bin = atob(shot.base64String);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      const type = shot.format === 'png' ? 'image/png' : 'image/jpeg';
      return new File([buf], `photo.${shot.format || 'jpg'}`, { type });
    } catch (e) { return null; }
  };

  /* a little feedback on likes and posts, the way native apps do */
  window.tfTap = () => { try { P.Haptics?.impact({ style: 'LIGHT' }); } catch (e) {} };

  /* Push: ask once, after someone has signed in and has a reason to want it.
     The token goes to the database; tapping a notification opens its screen. */
  let pushWired = false;
  window.tfEnablePush = async () => {
    const PN = P.PushNotifications; if (!PN) return false;
    try {
      if (!pushWired) {
        pushWired = true;
        PN.addListener('registration', ({ value }) => {
          window.tfPushToken = value;
          /* DB is a top-level const in data.js, which is a global binding but not a
             property of window, so check the name itself rather than window.DB */
          try { if (typeof DB !== 'undefined') DB.savePushToken(value, 'ios'); } catch (e) {}
        });
        PN.addListener('registrationError', () => {});
        PN.addListener('pushNotificationActionPerformed', ({ notification }) => {
          const to = notification?.data?.url;
          if (to && to.startsWith('#/')) location.hash = to;
        });
      }
      let perm = await PN.checkPermissions();
      if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') perm = await PN.requestPermissions();
      if (perm.receive !== 'granted') return false;
      await PN.register();
      return true;
    } catch (e) { return false; }
  };
})();
