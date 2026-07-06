/* Agreely (citizens) share.
   Two small enhancements around the manifesto message, all client-side:
     1. js-mailto  -> keeps a prefilled mailto: href in sync with the (editable)
                      message textarea, so "send by email" always sends what the
                      visitor sees. Recipient is left blank on purpose.
     2. js-share   -> revealed only when the Web Share API exists; shares the
                      current message text.
   No dependencies. */
(function () {
    'use strict';

    function sourceEl(el) {
        var sel = el.getAttribute('data-source');
        return sel ? document.querySelector(sel) : null;
    }

    function status(el) {
        var sec = el.closest('section');
        return sec ? sec.querySelector('[role="status"][aria-live]') : null;
    }

    function announce(el, msg) {
        var s = status(el);
        if (s) { s.textContent = ''; window.setTimeout(function () { s.textContent = msg; }, 30); }
    }

    // ── 1. Prefilled mailto, kept in sync with the textarea ──────────────
    document.querySelectorAll('.js-mailto').forEach(function (a) {
        var src = sourceEl(a);
        if (!src) return;
        var subject = src.getAttribute('data-mail-subject') || '';
        var update = function () {
            var body = src.value || '';
            a.setAttribute('href', 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body));
        };
        update();
        src.addEventListener('input', update);
        a.addEventListener('mousedown', update);
        a.addEventListener('focus', update);
    });

    // ── 2. Web Share (progressive; hidden unless supported) ──────────────
    document.querySelectorAll('.js-share').forEach(function (btn) {
        var src = sourceEl(btn);
        if (!src || !(navigator.share)) return;
        btn.hidden = false;
        btn.addEventListener('click', function () {
            var title = src.getAttribute('data-share-title') || document.title;
            navigator.share({ title: title, text: src.value || '' }).catch(function () { /* dismissed */ });
        });
    });

    // ── 3. Sign the manifesto (local only, no backend) ───────────────────
    document.querySelectorAll('.js-sign').forEach(function (btn) {
        var signedLabel = btn.getAttribute('data-signed-label') || 'Signed';
        var thanks = btn.getAttribute('data-thanks') || signedLabel;

        var markSigned = function (announceIt) {
            var label = btn.querySelector('.js-sign-label');
            if (label) label.textContent = signedLabel;
            btn.classList.add('is-signed');
            btn.setAttribute('aria-pressed', 'true');
            if (announceIt) announce(btn, thanks);
        };

        try { if (localStorage.getItem(SIGN_KEY) === '1') markSigned(false); } catch (e) {}

        btn.addEventListener('click', function () {
            try { localStorage.setItem(SIGN_KEY, '1'); } catch (e) {}
            markSigned(true);
        });
    });
})();
