/* Hushblock account page.
   Signed out: sign in / create account (email + password or Google), reset password by email.
   Signed in: plan status, upgrade, and clear next steps for each device. */
(function () {
  'use strict';
  var S = window.SITE || {};
  var D = S.desktop || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var view = $('#view');
  var params = new URLSearchParams(location.search);
  var device = params.get('device') || ''; // windows | mac | extension
  var BASE = location.origin + location.pathname;

  document.querySelectorAll('.js-year').forEach(function (e) { e.textContent = new Date().getFullYear(); });
  document.querySelectorAll('.js-email').forEach(function (a) { a.href = 'mailto:' + S.email; });

  // ---------- helpers (DOM is built from text nodes only) ----------
  function h(tag, attrs) {
    var el = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === undefined || v === null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c === null || c === undefined || c === false || c === '') return;
    if (Array.isArray(c)) return c.forEach(function (x) { add(el, x); });
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  function show() {
    view.textContent = '';
    for (var i = 0; i < arguments.length; i++) add(view, arguments[i]);
  }
  function focusFirst() {
    var f = view.querySelector('input');
    if (f && window.innerWidth > 820) f.focus();
  }
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.classList.remove('show'); }, 2800);
  }
  function notice(msg, warn) {
    var n = $('#notice');
    if (!msg) { n.classList.add('hidden'); return; }
    n.textContent = msg;
    n.className = 'notice' + (warn ? ' warn' : '');
  }
  function busy(btn, on, label) {
    if (!btn) return;
    btn.disabled = on;
    if (on) {
      btn._label = Array.prototype.slice.call(btn.childNodes);
      btn.textContent = '';
      btn.append(h('span', { class: 'spin' }), ' ' + (label || 'Please wait…'));
    } else if (btn._label) {
      btn.textContent = '';
      btn._label.forEach(function (n) { btn.append(n); });
    }
  }

  var NS = 'http://www.w3.org/2000/svg';
  var PATHS = {
    check: ['M5 12.5l4.5 4.5L19 7.5'],
    devices: ['M3 6.5A1.5 1.5 0 0 1 4.5 5h11A1.5 1.5 0 0 1 17 6.5V13H3z', 'M1.5 16h17', 'M19.5 9H21a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-2'],
    search: ['M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z', 'M20 20l-4.6-4.6'],
    shield: ['M12 3l7 3v5c0 4.5-3 8.3-7 9.5C8 19.3 5 15.5 5 11V6l7-3z'],
    crown: ['M4 8l4 4 4-7 4 7 4-4-2 11H6z'],
    mail: ['M4 6h16v12H4z', 'M4 7l8 6 8-6'],
    key: ['M8 11a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', 'M11 12l8-8M16 7l2 2M14 9l2 2'],
    globe: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M3.5 12h17M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z'],
  };
  function icon(name) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    (PATHS[name] || []).forEach(function (d) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      svg.append(p);
    });
    return svg;
  }
  function filled(d) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    svg.append(p);
    return svg;
  }
  var WIN = 'M3 5.5l7.5-1v7H3zM11.5 4.3L21 3v8.5h-9.5zM3 12.5h7.5v7L3 18.5zM11.5 12.5H21V21l-9.5-1.3z';
  var APPLE = 'M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.9-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.2.8 1.1 1.7 2.3 2.9 2.3 1.2-.1 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.7zM14.1 5.6c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3z';
  function googleIcon() {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 48 48');
    [['#FFC107', 'M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z'],
      ['#FF3D00', 'M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z'],
      ['#4CAF50', 'M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z'],
      ['#1976D2', 'M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z']].forEach(function (p) {
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('fill', p[0]);
      path.setAttribute('d', p[1]);
      svg.append(path);
    });
    return svg;
  }

  // ---------- setup ----------
  if (!S.supabaseUrl || !S.supabaseKey || !window.supabase) {
    show(h('div', { class: 'panel' }, h('h1', {}, 'Accounts are coming soon'),
      h('p', { class: 'muted' }, 'Until then, use the license key from your purchase email to activate Pro.')));
    return;
  }
  var sb = window.supabase.createClient(S.supabaseUrl, S.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
  });

  var DEVICE_NAME = { windows: 'Hushblock for Windows', mac: 'Hushblock for Mac', extension: 'the Hushblock browser extension' };

  function redirectBack(extra) {
    var q = new URLSearchParams();
    if (device) q.set('device', device);
    if (extra) q.set(extra, '1');
    var s = q.toString();
    return BASE + (s ? '?' + s : '');
  }
  async function fnError(error) {
    try {
      if (error && error.context && typeof error.context.json === 'function') {
        var j = await error.context.json();
        if (j && j.error) return j.error;
      }
    } catch (e) { /* ignore */ }
    return (error && error.message) || 'Something went wrong. Please try again.';
  }
  function authMessage(e) {
    var m = (e && e.message) || '';
    if (/Invalid login credentials/i.test(m)) return 'That email and password don’t match. Try again or reset your password.';
    if (/Email not confirmed/i.test(m)) return 'Please confirm your email first — open the link we sent you (check Spam too).';
    if (/already registered|already been registered/i.test(m)) return 'An account with this email already exists. Sign in instead.';
    if (/Password should be|at least/i.test(m)) return 'Use at least 8 characters for your password.';
    if (/rate limit|too many/i.test(m)) return 'Too many attempts. Please wait a few minutes and try again.';
    if (/valid email|invalid format/i.test(m)) return 'Please enter a valid email address.';
    return m || 'Something went wrong. Please try again.';
  }

  // ---------- signed out ----------
  var mode = params.get('mode') === 'signup' ? 'signup' : 'signin';

  function sidePanel() {
    var perk = function (ic, t, d) { return h('li', {}, h('span', { class: 'pi' }, ic), h('span', {}, h('b', {}, t), d)); };
    return h('div', { class: 'auth-side' },
      h('div', { class: 'mark' }, h('img', { src: '../img/logo.svg', alt: '' }), 'Hushblock'),
      h('h2', {}, DEVICE_NAME[device] ? 'Sign in to finish setting up ' + DEVICE_NAME[device] + '.' : 'One account for all your devices.'),
      h('p', {}, 'Your Hushblock account carries Pro to the Windows app, the browser extension and soon the Mac app.'),
      h('ul', { class: 'perks' },
        perk(icon('devices'), 'Pro everywhere', 'Buy once, use on up to 3 devices.'),
        perk(icon('search'), 'Found automatically', 'Purchases made with your email appear by themselves.'),
        perk(icon('shield'), 'Private', 'We never see which apps or sites you block.')),
      h('p', { class: 'fine' }, 'Free plan users don’t need an account — just download and start.'));
  }

  function pwField(id, autocomplete) {
    var input = h('input', { class: 'input', type: 'password', id: id, autocomplete: autocomplete, required: true, minlength: '8' });
    var peek = h('button', { class: 'peek', type: 'button', 'aria-label': 'Show password', onclick: function () {
      var showIt = input.type === 'password';
      input.type = showIt ? 'text' : 'password';
      peek.textContent = showIt ? 'Hide' : 'Show';
    } }, 'Show');
    return { input: input, wrap: h('div', { class: 'input-wrap' }, input, peek) };
  }

  function signInView(prefillEmail) {
    notice('');
    var email = h('input', { class: 'input', type: 'email', id: 'em', autocomplete: 'email', required: true, value: prefillEmail || '' });
    var pw = pwField('pw', mode === 'signup' ? 'new-password' : 'current-password');
    var err = h('div', { class: 'err', role: 'alert' });
    var submit = h('button', { class: 'btn primary block', type: 'submit' }, mode === 'signup' ? 'Create account' : 'Sign in');
    var form = h('form', { class: 'stack', novalidate: true, onsubmit: async function (e) {
      e.preventDefault();
      err.textContent = '';
      var em = email.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { err.textContent = 'Please enter a valid email address.'; email.focus(); return; }
      if (pw.input.value.length < 8) { err.textContent = 'Use at least 8 characters for your password.'; pw.input.focus(); return; }
      busy(submit, true, mode === 'signup' ? 'Creating account…' : 'Signing in…');
      var r;
      if (mode === 'signup') {
        r = await sb.auth.signUp({ email: em, password: pw.input.value, options: { emailRedirectTo: redirectBack() } });
        busy(submit, false);
        if (r.error) { err.textContent = authMessage(r.error); return; }
        if (r.data && r.data.user && r.data.user.identities && r.data.user.identities.length === 0) { err.textContent = 'An account with this email already exists. Sign in instead.'; return; }
        if (!r.data.session) return checkEmailView(em);
      } else {
        r = await sb.auth.signInWithPassword({ email: em, password: pw.input.value });
        busy(submit, false);
        if (r.error) { err.textContent = authMessage(r.error); return; }
      }
      loadAccount();
    } },
      h('div', { class: 'field' }, h('label', { for: 'em' }, 'Email'), email),
      h('div', { class: 'field' }, h('label', { for: 'pw' }, 'Password',
        mode === 'signin' ? h('button', { class: 'linkbtn', type: 'button', onclick: function () { forgotView(email.value.trim()); } }, 'Forgot password?') : null), pw.wrap,
        mode === 'signup' ? h('span', { class: 'hint' }, 'At least 8 characters.') : null),
      err, submit);

    var google = h('button', { class: 'btn google block', type: 'button', onclick: async function () {
      busy(google, true, 'Opening Google…');
      var r = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectBack() } });
      if (r.error) { busy(google, false); err.textContent = authMessage(r.error); }
    } }, googleIcon(), 'Continue with Google');

    show(h('div', { class: 'auth' }, sidePanel(),
      h('div', { class: 'auth-form' },
        h('h1', {}, mode === 'signup' ? 'Create your account' : 'Welcome back'),
        h('p', { class: 'sub' }, mode === 'signup' ? 'Tip: use the email you paid with, so Pro shows up right away.' : 'Sign in to use Hushblock Pro on your devices.'),
        h('div', { class: 'tabs', role: 'tablist' },
          h('button', { class: mode === 'signin' ? 'on' : '', type: 'button', role: 'tab', 'aria-selected': String(mode === 'signin'), onclick: function () { mode = 'signin'; signInView(email.value.trim()); } }, 'Sign in'),
          h('button', { class: mode === 'signup' ? 'on' : '', type: 'button', role: 'tab', 'aria-selected': String(mode === 'signup'), onclick: function () { mode = 'signup'; signInView(email.value.trim()); } }, 'Create account')),
        google,
        h('div', { class: 'or' }, 'or with email'),
        form,
        h('p', { class: 'legal' }, 'By continuing you agree to the ', h('a', { href: '../terms.html' }, 'Terms'), ' and ', h('a', { href: '../privacy.html' }, 'Privacy Policy'), '.'))));
    focusFirst();
  }

  function checkEmailView(email) {
    show(h('div', { class: 'panel center' },
      h('div', { class: 'big-ic' }, icon('mail')),
      h('h1', {}, 'Check your inbox'),
      h('p', { class: 'muted' }, 'We sent a confirmation link to ', h('b', {}, email), '. Open it to finish creating your account.'),
      h('p', { class: 'muted small' }, 'Can’t find it? Look in Spam or Promotions — and mark it “Not spam” so future emails arrive normally.'),
      h('button', { class: 'btn ghost block', type: 'button', onclick: function () { mode = 'signin'; signInView(email); } }, 'Back to sign in')));
  }

  function forgotView(prefill) {
    var email = h('input', { class: 'input', type: 'email', id: 'fe', autocomplete: 'email', value: prefill || '' });
    var err = h('div', { class: 'err', role: 'alert' });
    var btn = h('button', { class: 'btn primary block', type: 'submit' }, 'Send reset link');
    show(h('div', { class: 'panel' },
      h('div', { class: 'big-ic' }, icon('key')),
      h('h1', {}, 'Reset your password'),
      h('p', { class: 'muted' }, 'Enter your account email and we’ll send you a link to choose a new password.'),
      h('form', { class: 'stack', novalidate: true, onsubmit: async function (e) {
        e.preventDefault();
        err.textContent = '';
        var em = email.value.trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { err.textContent = 'Please enter a valid email address.'; return; }
        busy(btn, true, 'Sending…');
        var r = await sb.auth.resetPasswordForEmail(em, { redirectTo: redirectBack('reset') });
        busy(btn, false);
        if (r.error) { err.textContent = authMessage(r.error); return; }
        show(h('div', { class: 'panel center' },
          h('div', { class: 'big-ic' }, icon('mail')),
          h('h1', {}, 'Check your inbox'),
          h('p', { class: 'muted' }, 'If there’s an account for ', h('b', {}, em), ', you’ll get a link to set a new password in a minute.'),
          h('p', { class: 'muted small' }, 'Not there? Check Spam or Promotions.'),
          h('button', { class: 'btn ghost block', type: 'button', onclick: function () { signInView(em); } }, 'Back to sign in')));
      } }, h('div', { class: 'field' }, h('label', { for: 'fe' }, 'Email'), email), err, btn),
      h('button', { class: 'linkbtn', type: 'button', onclick: function () { signInView(email.value.trim()); } }, '← Back to sign in')));
    focusFirst();
  }

  function newPasswordView() {
    notice('');
    var pw = pwField('np', 'new-password');
    var err = h('div', { class: 'err', role: 'alert' });
    var btn = h('button', { class: 'btn primary block', type: 'submit' }, 'Save new password');
    show(h('div', { class: 'panel' },
      h('div', { class: 'big-ic' }, icon('key')),
      h('h1', {}, 'Choose a new password'),
      h('form', { class: 'stack', novalidate: true, onsubmit: async function (e) {
        e.preventDefault();
        err.textContent = '';
        if (pw.input.value.length < 8) { err.textContent = 'Use at least 8 characters.'; return; }
        busy(btn, true, 'Saving…');
        var r = await sb.auth.updateUser({ password: pw.input.value });
        busy(btn, false);
        if (r.error) { err.textContent = authMessage(r.error); return; }
        toast('Your new password is saved.');
        history.replaceState(null, '', redirectBack());
        loadAccount();
      } }, h('div', { class: 'field' }, h('label', { for: 'np' }, 'New password'), pw.wrap, h('span', { class: 'hint' }, 'At least 8 characters.')), err, btn)));
    focusFirst();
  }

  // ---------- signed in ----------
  function mask(k) { return k.length > 12 ? k.slice(0, 7) + '••••' + k.slice(-4) : k; }
  function initial(email) { return (email || '?').charAt(0).toUpperCase(); }

  function setWho(email) {
    var w = $('#who');
    w.textContent = '';
    if (!email) return;
    w.append(h('span', {}, email), h('div', { class: 'avatar' }, initial(email)));
  }

  async function loadAccount() {
    var sess = (await sb.auth.getSession()).data.session;
    if (!sess) return signInView();
    setWho(sess.user.email);
    show(h('div', { class: 'panel center loading' }, h('span', { class: 'spin' }), h('span', { class: 'muted' }, 'Loading your account…')));
    var r = await sb.functions.invoke('account', { body: { action: 'status' } });
    if (r.error) {
      var msg = await fnError(r.error);
      if (/sign in again/i.test(msg)) { await sb.auth.signOut(); setWho(''); return signInView(); }
      return show(h('div', { class: 'panel' }, h('h1', {}, 'Couldn’t load your account'), h('p', { class: 'muted' }, msg),
        h('button', { class: 'btn primary', type: 'button', onclick: loadAccount }, 'Try again')));
    }
    accountView(r.data);
  }

  async function accountAction(body, btn, okMsg) {
    busy(btn, true);
    var r = await sb.functions.invoke('account', { body: body });
    busy(btn, false);
    if (r.error) { toast(await fnError(r.error)); return null; }
    if (okMsg) toast(okMsg);
    accountView(r.data);
    return r.data;
  }

  function winLink(key, email) {
    return 'hushblock://activate?key=' + encodeURIComponent(key) + '&email=' + encodeURIComponent(email);
  }

  function devicesCard(best, email) {
    var dl = D.windowsUrl || '../desktop/';
    var stores = S.stores || {};
    var names = { chrome: 'Chrome', edge: 'Edge', firefox: 'Firefox' };
    var live = Object.keys(names).filter(function (k) { return stores[k]; });
    var storeBtns = live.map(function (k) { return h('a', { class: 'btn ghost sm', href: stores[k], target: '_blank', rel: 'noopener' }, 'Add to ' + names[k]); });

    var win = h('div', { class: 'device' + (device === 'windows' ? ' hl' : '') },
      h('div', { class: 'dic' }, filled(WIN)),
      h('div', {}, h('b', {}, 'Windows app'),
        h('div', { class: 'how' }, best
          ? 'Have it installed? Click Activate — Hushblock opens and turns on Pro. New computer? Download it first.'
          : 'Blocks apps and websites on your whole PC. Download, install, done.')),
      h('div', { class: 'acts' }, best
        ? [h('a', { class: 'btn primary sm', href: winLink(best.key, email), onclick: function () { toast('Opening Hushblock… If nothing happens, install it first.'); } }, 'Activate'),
          h('a', { class: 'btn ghost sm', href: dl, download: D.windowsUrl ? '' : null }, 'Download')]
        : [h('a', { class: 'btn primary sm', href: dl, download: D.windowsUrl ? '' : null }, 'Download')]));

    var ext = h('div', { class: 'device' + (device === 'extension' ? ' hl' : '') },
      h('div', { class: 'dic' }, icon('globe')),
      h('div', {}, h('b', {}, 'Browser extension'),
        h('div', { class: 'how' }, best
          ? 'Open this page in the browser where Hushblock is installed and click Activate.'
          : live.length ? 'Website blocker for Chrome, Edge and Firefox.' : 'Website blocker for Chrome, Edge and Firefox — arriving in the stores soon.')),
      h('div', { class: 'acts' },
        best ? h('a', { class: 'btn primary sm', href: '../thanks.html?license_key=' + encodeURIComponent(best.key) + '&from=account' }, 'Activate') : null,
        storeBtns.length ? storeBtns : (best ? null : h('span', { class: 'pill soon' }, 'In review'))));

    var mac = h('div', { class: 'device soon' + (device === 'mac' ? ' hl' : '') },
      h('div', { class: 'dic' }, filled(APPLE)),
      h('div', {}, h('b', {}, 'Mac app'), h('div', { class: 'how' }, 'Coming soon. Your account will work there automatically.')),
      h('div', { class: 'acts' }, h('span', { class: 'pill soon' }, 'Coming soon')));

    return h('section', { class: 'card' },
      h('h2', {}, best ? 'Turn on Pro on your devices' : 'Get Hushblock on your devices'),
      h('p', { class: 'sub' }, best
        ? 'Each device uses one of your 3 activations' + (best.activations ? ' — ' + best.activations.replace('/', ' of ') + ' used.' : '.')
        : 'The free plan works without an account. Upgrade any time to unlock everything.'),
      h('div', { class: 'devices' }, win, ext, mac));
  }

  function accountView(a) {
    var active = a.keys.filter(function (k) { return k.active; });
    var best = active[0];
    var out = [];

    out.push(h('div', { class: 'dash-head' },
      h('div', { class: 'avatar' }, initial(a.email)),
      h('div', { class: 'grow' }, h('h1', {}, 'Your account'), h('div', { class: 'em' }, a.email)),
      h('button', { class: 'btn ghost sm', type: 'button', onclick: async function () {
        await sb.auth.signOut();
        setWho('');
        toast('You’re signed out.');
        signInView();
      } }, 'Sign out')));

    if (!a.verified) notice('Please confirm your email address — open the link we sent you. Purchases made with this email show up after that.', true);
    else if (DEVICE_NAME[device] && best) notice('Click “Activate” next to ' + (device === 'windows' ? 'Windows app' : device === 'extension' ? 'Browser extension' : 'Mac app') + ' to turn on Pro in ' + DEVICE_NAME[device] + '.');
    else notice('');

    // Plan
    if (best) {
      out.push(h('section', { class: 'card' }, h('div', { class: 'plan pro' },
        h('div', { class: 'pic' }, icon('crown')),
        h('div', { class: 'grow' }, h('h2', {}, 'Hushblock Pro', h('span', { class: 'pill pro' }, best.plan)),
          h('div', { class: 'sub' }, best.expires_at ? 'Renews or ends on ' + new Date(best.expires_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) + '.' : 'Active.')),
        h('a', { class: 'btn ghost sm', href: S.portalUrl, target: '_blank', rel: 'noopener' }, 'Manage subscription'))));
    } else {
      out.push(h('section', { class: 'card' },
        h('div', { class: 'plan free' },
          h('div', { class: 'pic' }, icon('crown')),
          h('div', { class: 'grow' }, h('h2', {}, 'Free plan', h('span', { class: 'pill free' }, 'Free')),
            h('div', { class: 'sub' }, 'Go Pro for unlimited apps and sites, strict mode, time limits and 90-day insights.'))),
        h('div', { class: 'upgrade' },
          h('a', { class: 'up best', href: S.checkoutYearly }, h('span', { class: 'lbl' }, 'Yearly', h('span', { class: 'pill ok' }, 'Save 50%')),
            h('span', { class: 'amt' }, S.priceYear, h('small', {}, ' / year')), h('span', { class: 'note' }, 'About ' + S.priceYearPerMonth + ' a month')),
          h('a', { class: 'up', href: S.checkoutMonthly }, h('span', { class: 'lbl' }, 'Monthly'),
            h('span', { class: 'amt' }, S.priceMonth, h('small', {}, ' / month')), h('span', { class: 'note' }, 'Cancel anytime'))),
        h('p', { class: 'sub', style: 'margin-top:12px' }, 'Pay with ', h('b', {}, a.email), ' and Pro appears here automatically.')));
    }

    out.push(devicesCard(best, a.email));

    // License key + linking another key
    var keyIn = h('input', { class: 'input', placeholder: 'Paste a license key', autocomplete: 'off', spellcheck: 'false' });
    var linkBtn = h('button', { class: 'btn ghost', type: 'submit' }, 'Add key');
    var linked = a.keys.filter(function (k) { return k.source === 'linked'; });
    var keyCard = h('section', { class: 'card' },
      h('h2', {}, 'License key'),
      best ? [h('p', { class: 'sub' }, 'You can also paste this key in any Hushblock app under Pro.'),
        h('div', { class: 'keybox' }, h('code', { id: 'keyText' }, mask(best.key)),
          h('button', { class: 'btn ghost sm', type: 'button', onclick: function (e) {
            var c = $('#keyText');
            var showing = c.textContent === best.key;
            c.textContent = showing ? mask(best.key) : best.key;
            e.currentTarget.textContent = showing ? 'Show' : 'Hide';
          } }, 'Show'),
          h('button', { class: 'btn primary sm', type: 'button', onclick: function () {
            navigator.clipboard.writeText(best.key).then(function () { toast('License key copied.'); }, function () { toast('Couldn’t copy — click Show and copy it by hand.'); });
          } }, 'Copy'))]
        : h('p', { class: 'sub' }, 'No license key on this account yet.'),
      h('details', { class: 'more', open: !best && linked.length ? true : null },
        h('summary', {}, 'Bought Pro with a different email?'),
        h('div', { class: 'inner' },
          h('p', { class: 'sub', style: 'margin:0' }, 'Add that license key here and it will follow this account.'),
          linked.map(function (k) {
            return h('div', { class: 'keyline' }, h('code', {}, mask(k.key)), h('span', { class: 'pill ' + (k.active ? 'ok' : 'free') }, k.active ? 'Active' : 'Inactive'),
              h('button', { class: 'linkbtn', type: 'button', onclick: function (e) { accountAction({ action: 'unlink', key: k.key }, e.currentTarget, 'Key removed from your account.'); } }, 'Remove'));
          }),
          h('form', { class: 'row', onsubmit: function (e) {
            e.preventDefault();
            if (!keyIn.value.trim()) return;
            accountAction({ action: 'link', key: keyIn.value.trim() }, linkBtn, 'Key added to your account.');
          } }, h('div', { style: 'flex:1;min-width:200px' }, keyIn), linkBtn))));
    out.push(keyCard);

    show(h('div', { class: 'dash' }, out));

    // Came here from the Windows app: hand Pro straight back to it (once per key per tab).
    if (best && device === 'windows') {
      var flag = 'hb-sent-' + best.key;
      var sent = false;
      try { sent = !!sessionStorage.getItem(flag); sessionStorage.setItem(flag, '1'); } catch (e) { /* ignore */ }
      if (!sent) {
        location.href = winLink(best.key, a.email);
        toast('Opening Hushblock for Windows…');
      }
    }
  }

  // ---------- start ----------
  sb.auth.onAuthStateChange(function (event) {
    if (event === 'PASSWORD_RECOVERY') newPasswordView();
  });
  (async function () {
    var hp = new URLSearchParams(location.hash.slice(1));
    var errDesc = hp.get('error_description') || params.get('error_description');
    if (errDesc) {
      var friendly = /expired|invalid/i.test(errDesc) ? 'That link has expired or was already used. Request a new one below.' : errDesc.replace(/\+/g, ' ');
      notice(friendly, true);
    }
    var sess = (await sb.auth.getSession()).data.session;
    if (params.get('reset') && sess) return newPasswordView();
    if (sess) loadAccount();
    else signInView();
    if (errDesc) notice(/expired|invalid/i.test(errDesc) ? 'That link has expired or was already used. Request a new one.' : errDesc.replace(/\+/g, ' '), true);
  })();
})();
