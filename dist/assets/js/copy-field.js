/* Agreely (citizens) copy-field.
   Wires every .js-copy button: reads the referenced field (data-copy-target),
   copies its current value to the clipboard, swaps the icon to a check, sets the
   button label to data-copied-label, and announces the result through the nearest
   aria-live region so keyboard and screen-reader users get the same confirmation.
   Reverts after a short delay. No dependencies. */
(function () {
    'use strict';

    var CHECK = '<path d="M5 12l5 5l10 -10" />';
    var COPY = '<path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" /><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />';  /* Tabler: copy */

    function status(btn) {
        var sec = btn.closest('section');
        return sec ? sec.querySelector('[role="status"][aria-live]') : null;
    }

    function announce(btn, msg) {
        var el = status(btn);
        if (el) { el.textContent = ''; window.setTimeout(function () { el.textContent = msg; }, 30); }
    }

    function fallbackCopy(text) {
        try {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'absolute';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            var ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return ok;
        } catch (e) { return false; }
    }

    document.querySelectorAll('.js-copy').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var target = document.querySelector(btn.getAttribute('data-copy-target'));
            if (!target) return;
            var text = ('value' in target) ? target.value : target.textContent;
            var doneLabel = btn.getAttribute('data-copied-label') || 'Copied';

            var done = function () {
                var ico = btn.querySelector('.js-copy-ico');
                var label = btn.querySelector('.js-copy-label');
                var prevLabel = label ? label.textContent : '';
                if (ico) ico.innerHTML = CHECK;
                if (label) label.textContent = doneLabel;
                btn.classList.add('is-copied');
                announce(btn, doneLabel);
                window.setTimeout(function () {
                    if (ico) ico.innerHTML = COPY;
                    if (label) label.textContent = prevLabel;
                    btn.classList.remove('is-copied');
                }, 2200);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done, function () { if (fallbackCopy(text)) done(); });
            } else if (fallbackCopy(text)) {
                done();
            }
        });
    });
})();
