/* Hushblock account page: sign in (email + password or Google), password
   recovery (email link or security question), Pro status and activation on
   each device. Accounts are hosted by Supabase. */
(function () {
  'use strict';
  var S = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var view = $('#view');
  var params = new URLSearchParams(location.search);
  var device = params.get('device') || ''; // windows | mac | extension
  var BASE = location.origin + location.pathname;

  document.querySelectorAll('.js-year').forEach(function (e) { e.textContent = new Date().getFullYear(); });
  document.querySelectorAll('.js-email').forEach(function (a) { a.href = 'mailto:' + S.email; });

  // ---------- tiny DOM builder (text only, no innerHTML) ----------
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
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) return c.forEach(function (x) { add(el, x); });
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  function show() {
    view.textContent = '';
    for (var i = 0; i < arguments.length; i++) add(view, arguments[i]);
    var f = view.querySelector('input');
    if (f && window.innerWidth > 700) f.focus();
  }
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function busy(btn, on, label) {
    btn.disabled = on;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = ''; btn.append(h('span', { class: 'spin' }), ' ' + (label || 'Please wait…')); }
    else if (btn.dataset.label) btn.textContent = btn.dataset.label;
  }
  var GOOGLE_SVG = function () {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 48 48');
    [['#FFC107', 'M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z'],
      ['#FF3D00', 'M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z'],
      ['#4CAF50', 'M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z'],
      ['#1976D2', 'M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z']].forEach(function (p) {
      var path = document.createElementNS(ns, 'path');
      path.setAttribute('fill', p[0]);
      path.setAttribute('d', p[1]);
      svg.append(path);
    });
    return svg;
  };

  // ---------- setup ----------
  if (!S.supabaseUrl || !S.supabaseKey || !window.supabase) {
    show(h('div', { class: 'acc-card' }, h('h1', {}, 'Accounts are coming soon'),
      h('p', { class: 'muted' }, 'Until then, use the license key from your purchase email to activate Pro.')));
    return;
  }
  var sb = window.supabase.createClient(S.supabaseUrl, S.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
  });

  var DEVICE_NAME = { windows: 'Hushblock for Windows', mac: 'Hushblock for Mac', extension: 'the Hushblock browser extension' };
  if (DEVICE_NAME[device]) {
    var b = $('#deviceBanner');
    b.textContent = 'Sign in to use your Pro subscription in ' + DEVICE_NAME[device] + '.';
    b.classList.remove('hidden');
  }

  function redirectBack(extra) {
    var q = new URLSearchParams();
    if (device) q.set('device', device);
    if (extra) q.set(extra, '1');
    var s = q.toString();
    return BASE + (s ? '?' + s : '');
  }

  async function fnError(error, fallback) {
    try {
      if (error && error.context && typeof error.context.json === 'function') {
        var j = await error.context.json();
        if (j && j.error) return j.error;
      }
    } catch (e) { /* ignore */ }
    return (error && error.message) || fallback || 'Something went wrong. Please try again.';
  }
  function authMessage(e) {
    var m = (e && e.message) || '';
    if (/Invalid login credentials/i.test(m)) return 'Wrong email or password.';
    if (/Email not confirmed/i.test(m)) return 'Please confirm your email first — check your inbox for the link.';
    if (/User already registered/i.test(m)) return 'An account with this email already exists. Sign in instead.';
    if (/Password should be/i.test(m)) return 'Use at least 8 characters for your password.';
    if (/rate limit/i.test(m)) return 'Too many emails were sent. Please wait a few minutes and try again.';
    return m || 'Something went wrong. Please try again.';
  }

  // ---------- signed-out views ----------
  var mode = params.get('mode') === 'signup' ? 'signup' : 'signin';

  function googleButton() {
    return h('button', { class: 'btn google block', type: 'button', onclick: async function (e) {
      busy(e.currentTarget, true, 'Opening Google…');
      var r = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectBack() } });
      if (r.error) { busy(e.currentTarget, false); toast(authMessage(r.error)); }
    } }, GOOGLE_SVG(), 'Continue with Google');
  }

  function signInView() {
    var email = h('input', { class: 'input', type: 'email', autocomplete: 'email', required: true, id: 'em' });
    var pw = h('input', { class: 'input', type: 'password', autocomplete: mode === 'signup' ? 'new-password' : 'current-password', required: true, minlength: '8', id: 'pw' });
    var err = h('div', { class: 'err' });
    var submit = h('button', { class: 'btn primary block', type: 'submit' }, mode === 'signup' ? 'Create account' : 'Sign in');
    var form = h('form', { class: 'stack', onsubmit: async function (e) {
      e.preventDefault();
      err.textContent = '';
      if (pw.value.length < 8) { err.textContent = 'Use at least 8 characters for your password.'; return; }
      busy(submit, true);
      var r;
      if (mode === 'signup') {
        r = await sb.auth.signUp({ email: email.value.trim(), password: pw.value, options: { emailRedirectTo: redirectBack() } });
        busy(submit, false);
        if (r.error) { err.textContent = authMessage(r.error); return; }
        if (!r.data.session) return checkEmailView(email.value.trim());
      } else {
        r = await sb.auth.signInWithPassword({ email: email.value.trim(), password: pw.value });
        busy(submit, false);
        if (r.error) { err.textContent = authMessage(r.error); return; }
      }
      loadAccount();
    } },
      h('div', { class: 'field' }, h('label', { for: 'em' }, 'Email'), email),
      h('div', { class: 'field' }, h('label', { for: 'pw' }, 'Password'), pw),
      err, submit);
    show(h('div', { class: 'acc-card' },
      h('h1', {}, mode === 'signup' ? 'Create your account' : 'Sign in to Hushblock'),
      h('p', { class: 'sub' }, mode === 'signup' ? 'Use the same email you pay with, and Pro will follow you to every device.' : 'One account for the Windows app, the Mac app and the browser extension.'),
      h('div', { class: 'tabs' },
        h('button', { class: mode === 'signin' ? 'on' : '', type: 'button', onclick: function () { mode = 'signin'; signInView(); } }, 'Sign in'),
        h('button', { class: mode === 'signup' ? 'on' : '', type: 'button', onclick: function () { mode = 'signup'; signInView(); } }, 'Create account')),
      googleButton(),
      h('div', { class: 'or' }, 'or with email'),
      form,
      mode === 'signin' ? h('button', { class: 'linkbtn', type: 'button', onclick: function () { forgotView(email.value.trim()); } }, 'Forgot your password?') : null));
  }

  function checkEmailView(email) {
    show(h('div', { class: 'acc-card' }, h('h1', {}, 'Check your email'),
      h('p', { class: 'muted' }, 'We sent a confirmation link to ', h('b', {}, email), '. Open it to finish creating your account. It can take a minute — look in Spam too.'),
      h('button', { class: 'btn ghost block', type: 'button', onclick: function () { mode = 'signin'; signInView(); } }, 'Back to sign in')));
  }

  function forgotView(prefill) {
    var email = h('input', { class: 'input', type: 'email', autocomplete: 'email', value: prefill || '', id: 'fe' });
    var err = h('div', { class: 'err' });
    var sendBtn = h('button', { class: 'btn primary block', type: 'button', onclick: async function () {
      err.textContent = '';
      if (!email.value.trim()) { err.textContent = 'Enter the email of your account.'; return; }
      busy(sendBtn, true, 'Sending…');
      var r = await sb.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: redirectBack('reset') });
      busy(sendBtn, false);
      if (r.error) { err.textContent = authMessage(r.error); return; }
      show(h('div', { class: 'acc-card' }, h('h1', {}, 'Check your email'),
        h('p', { class: 'muted' }, 'If an account exists for ', h('b', {}, email.value.trim()), ', we sent a link to set a new password.'),
        h('button', { class: 'btn ghost block', type: 'button', onclick: signInView }, 'Back to sign in')));
    } }, 'Email me a reset link');
    var qBtn = h('button', { class: 'btn ghost block', type: 'button', onclick: async function () {
      err.textContent = '';
      if (!email.value.trim()) { err.textContent = 'Enter the email of your account.'; return; }
      busy(qBtn, true, 'Looking up…');
      var r = await sb.functions.invoke('recover', { body: { action: 'question', email: email.value.trim() } });
      busy(qBtn, false);
      if (r.error) { err.textContent = await fnError(r.error); return; }
      questionView(email.value.trim(), r.data.question);
    } }, 'Answer my security question');
    show(h('div', { class: 'acc-card' }, h('h1', {}, 'Reset your password'),
      h('div', { class: 'field' }, h('label', { for: 'fe' }, 'Email'), email), err, sendBtn,
      h('div', { class: 'or' }, 'no access to your email?'), qBtn,
      h('button', { class: 'linkbtn', type: 'button', onclick: signInView }, '← Back to sign in')));
  }

  function questionView(email, question) {
    var ans = h('input', { class: 'input', type: 'text', autocomplete: 'off', id: 'qa' });
    var pw = h('input', { class: 'input', type: 'password', autocomplete: 'new-password', minlength: '8', id: 'qp' });
    var err = h('div', { class: 'err' });
    var btn = h('button', { class: 'btn primary block', type: 'submit' }, 'Set new password');
    show(h('div', { class: 'acc-card' }, h('h1', {}, 'Security question'),
      h('form', { class: 'stack', onsubmit: async function (e) {
        e.preventDefault();
        err.textContent = '';
        if (pw.value.length < 8) { err.textContent = 'Use at least 8 characters for the new password.'; return; }
        busy(btn, true);
        var r = await sb.functions.invoke('recover', { body: { action: 'reset', email: email, answer: ans.value, password: pw.value } });
        busy(btn, false);
        if (r.error) { err.textContent = await fnError(r.error); return; }
        var s = await sb.auth.signInWithPassword({ email: email, password: pw.value });
        if (s.error) { toast('Password changed. Please sign in.'); return signInView(); }
        toast('Password changed. You are signed in.');
        loadAccount();
      } },
        h('div', { class: 'ok' }, question),
        h('div', { class: 'field' }, h('label', { for: 'qa' }, 'Your answer'), ans),
        h('div', { class: 'field' }, h('label', { for: 'qp' }, 'New password'), pw),
        err, btn),
      h('button', { class: 'linkbtn', type: 'button', onclick: function () { forgotView(email); } }, '← Back')));
  }

  function newPasswordView() {
    var pw = h('input', { class: 'input', type: 'password', autocomplete: 'new-password', minlength: '8', id: 'np' });
    var err = h('div', { class: 'err' });
    var btn = h('button', { class: 'btn primary block', type: 'submit' }, 'Save new password');
    show(h('div', { class: 'acc-card' }, h('h1', {}, 'Choose a new password'),
      h('form', { class: 'stack', onsubmit: async function (e) {
        e.preventDefault();
        if (pw.value.length < 8) { err.textContent = 'Use at least 8 characters.'; return; }
        busy(btn, true);
        var r = await sb.auth.updateUser({ password: pw.value });
        busy(btn, false);
        if (r.error) { err.textContent = authMessage(r.error); return; }
        toast('Your new password is saved.');
        history.replaceState(null, '', redirectBack());
        loadAccount();
      } }, h('div', { class: 'field' }, h('label', { for: 'np' }, 'New password'), pw), err, btn)));
  }

  // ---------- signed-in view ----------
  function mask(k) { return k.length > 12 ? k.slice(0, 6) + '…' + k.slice(-4) : k; }

  async function loadAccount() {
    var sess = (await sb.auth.getSession()).data.session;
    if (!sess) return signInView();
    $('#whoNav').textContent = sess.user.email || '';
    show(h('div', { class: 'acc-card center' }, h('span', { class: 'spin' }), h('span', { class: 'muted' }, 'Checking your subscription…')));
    var r = await sb.functions.invoke('account', { body: { action: 'status' } });
    if (r.error) {
      var msg = await fnError(r.error);
      if (/sign in again/i.test(msg)) { await sb.auth.signOut(); return signInView(); }
      return show(h('div', { class: 'acc-card' }, h('h1', {}, 'Couldn’t load your account'), h('p', { class: 'muted' }, msg),
        h('button', { class: 'btn primary', type: 'button', onclick: loadAccount }, 'Try again')));
    }
    accountView(r.data);
  }

  async function accountAction(body, btn, okMsg) {
    if (btn) busy(btn, true);
    var r = await sb.functions.invoke('account', { body: body });
    if (btn) busy(btn, false);
    if (r.error) { toast(await fnError(r.error)); return null; }
    if (okMsg) toast(okMsg);
    accountView(r.data);
    return r.data;
  }

  function deviceLinks(key, email) {
    var win = 'hushblock://activate?key=' + encodeURIComponent(key) + '&email=' + encodeURIComponent(email);
    var ext = '../thanks.html?license_key=' + encodeURIComponent(key) + '&from=account';
    return h('div', { class: 'devices' },
      h('div', { class: 'dev' + (device === 'windows' ? ' hl' : '') }, h('b', {}, 'Windows app'), h('p', {}, 'Opens Hushblock for Windows and turns on Pro.'),
        h('a', { class: 'btn primary sm', href: win }, 'Activate on Windows'),
        h('a', { class: 'small', href: '../desktop/' }, 'Don’t have it? Download')),
      h('div', { class: 'dev' + (device === 'extension' ? ' hl' : '') }, h('b', {}, 'Browser extension'), h('p', {}, 'Open this in the browser where Hushblock is installed.'),
        h('a', { class: 'btn primary sm', href: ext }, 'Activate in this browser'),
        h('a', { class: 'small', href: '../index.html' }, 'Get the extension')),
      h('div', { class: 'dev' + (device === 'mac' ? ' hl' : '') }, h('b', {}, 'Mac app'), h('p', {}, 'Coming soon. Your Pro subscription will work there too.'),
        h('span', { class: 'btn ghost sm', 'aria-disabled': 'true', style: 'opacity:.6' }, 'Coming soon')));
  }

  function accountView(a) {
    var active = a.keys.filter(function (k) { return k.active; });
    var best = active[0];
    var cards = [];

    cards.push(h('div', { class: 'acc-card wide' },
      h('div', { class: 'row between' }, h('div', {}, h('h1', {}, 'Your account'), h('p', { class: 'muted' }, a.email)),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: async function () { await sb.auth.signOut(); toast('Signed out.'); $('#whoNav').textContent = ''; signInView(); } }, 'Sign out')),
      !a.verified ? h('div', { class: 'warn' }, 'Please confirm your email (check your inbox) — after that, purchases made with this email appear here automatically.') : null,
      h('div', { class: 'row' }, h('span', { class: 'plan-pill ' + (best ? 'pro' : 'free') }, best ? 'Pro' : 'Free'),
        h('span', { class: 'muted' }, best ? (best.plan + ' plan' + (best.expires_at ? ' · renews or ends ' + new Date(best.expires_at).toLocaleDateString() : '')) : 'No active Pro subscription on this account yet.'))));

    if (best) {
      cards.push(h('div', { class: 'acc-card wide' }, h('h2', {}, 'Use Pro on your devices'),
        h('p', { class: 'sub' }, 'Each device uses one of your activations' + (best.activations ? ' (' + best.activations + ' used)' : '') + '.'),
        deviceLinks(best.key, a.email),
        h('div', { class: 'keyrow' }, h('code', { id: 'keyText' }, mask(best.key)),
          h('button', { class: 'btn ghost sm', type: 'button', onclick: function (e) {
            var c = $('#keyText');
            if (c.textContent === best.key) { c.textContent = mask(best.key); e.currentTarget.textContent = 'Show'; }
            else { c.textContent = best.key; e.currentTarget.textContent = 'Hide'; }
          } }, 'Show'),
          h('button', { class: 'btn ghost sm', type: 'button', onclick: function () { navigator.clipboard.writeText(best.key).then(function () { toast('License key copied.'); }); } }, 'Copy')),
        h('p', { class: 'small muted' }, 'Manage or cancel your subscription in the ', h('a', { href: S.portalUrl, target: '_blank', rel: 'noopener' }, 'customer portal'), '.')));
    } else {
      cards.push(h('div', { class: 'acc-card wide' }, h('h2', {}, 'Get Hushblock Pro'),
        h('p', { class: 'sub' }, 'Pay with ', h('b', {}, a.email), ' and Pro appears here automatically — then activate it on any device.'),
        h('div', { class: 'row' },
          h('a', { class: 'btn primary', href: S.checkoutYearly }, 'Yearly · ' + S.priceYear),
          h('a', { class: 'btn ghost', href: S.checkoutMonthly }, 'Monthly · ' + S.priceMonth))));
    }

    var keyIn = h('input', { class: 'input', placeholder: 'Paste a license key', autocomplete: 'off', spellcheck: 'false' });
    var linkBtn = h('button', { class: 'btn ghost', type: 'submit' }, 'Add key');
    cards.push(h('div', { class: 'acc-card wide' }, h('h2', {}, 'License keys'),
      h('p', { class: 'sub' }, 'Bought Pro with a different email? Add that key here and it follows your account.'),
      a.keys.length ? a.keys.map(function (k) {
        return h('div', { class: 'keyrow' }, h('code', {}, mask(k.key)),
          h('span', { class: 'meta' }, (k.active ? 'Active' : 'Inactive') + ' · ' + k.plan + (k.source === 'linked' ? ' · added by you' : '')),
          k.source === 'linked' ? h('button', { class: 'btn ghost sm', type: 'button', onclick: function (e) { accountAction({ action: 'unlink', key: k.key }, e.currentTarget, 'Key removed from your account.'); } }, 'Remove') : null);
      }) : null,
      h('form', { class: 'row', onsubmit: function (e) {
        e.preventDefault();
        if (!keyIn.value.trim()) return;
        accountAction({ action: 'link', key: keyIn.value.trim() }, linkBtn, 'Key added to your account.');
      } }, h('div', { style: 'flex:1;min-width:200px' }, keyIn), linkBtn)));

    var isGoogleOnly = (a.providers || []).length === 1 && a.providers[0] === 'google';
    if (!isGoogleOnly) {
      var q = h('input', { class: 'input', placeholder: 'e.g. What was the name of my first teacher?', maxlength: '200', value: a.recoveryQuestion || '' });
      var ans = h('input', { class: 'input', placeholder: 'Your answer', autocomplete: 'off' });
      var saveBtn = h('button', { class: 'btn ghost', type: 'submit' }, a.recoveryQuestion ? 'Update' : 'Save question');
      cards.push(h('div', { class: 'acc-card wide' }, h('h2', {}, 'Security question'),
        h('p', { class: 'sub' }, 'A backup way to reset your password if you lose access to your email. Pick something only you know and that isn’t on social media. Answers aren’t case-sensitive.'),
        a.recoveryQuestion ? h('div', { class: 'ok' }, 'Set: ', h('b', {}, a.recoveryQuestion)) : null,
        h('form', { class: 'stack', onsubmit: function (e) {
          e.preventDefault();
          accountAction({ action: 'set-recovery', question: q.value, answer: ans.value }, saveBtn, 'Security question saved.');
        } }, q, ans, h('div', { class: 'row' }, saveBtn,
          a.recoveryQuestion ? h('button', { class: 'linkbtn', type: 'button', onclick: function () { accountAction({ action: 'remove-recovery' }, null, 'Security question removed.'); } }, 'Remove') : null))));
    }

    show(cards);

    // Coming from an app: send Pro straight back to it.
    if (best && device === 'windows' && !sessionStorage.getItem('hb-sent-' + best.key)) {
      try { sessionStorage.setItem('hb-sent-' + best.key, '1'); } catch (e) { /* ignore */ }
      location.href = 'hushblock://activate?key=' + encodeURIComponent(best.key) + '&email=' + encodeURIComponent(a.email);
      toast('Opening Hushblock for Windows…');
    }
  }

  // ---------- start ----------
  sb.auth.onAuthStateChange(function (event) {
    if (event === 'PASSWORD_RECOVERY') newPasswordView();
  });
  (async function () {
    var hashErr = new URLSearchParams(location.hash.slice(1)).get('error_description') || params.get('error_description');
    if (hashErr) toast(hashErr.replace(/\+/g, ' '));
    var sess = (await sb.auth.getSession()).data.session;
    if (params.get('reset') && sess) return newPasswordView();
    if (sess) loadAccount();
    else signInView();
  })();
})();
