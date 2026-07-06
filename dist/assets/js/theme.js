(function () {
    'use strict';

    var STORAGE_KEY = 'leaf-theme';

    /* Tabler icons (stroke, currentColor, 24 viewBox) for consistency with the nav. */
    var SUN_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" /></svg>';
    var MOON_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" /></svg>';

    function systemPref() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark' : 'light';
    }

    function getPreferred() {
        var stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
        return systemPref(); /* System-auto until the visitor explicitly toggles. */
    }

    function buttons() {
        /* Every toggle instance (docs + landing, spread/pill/mobile) carries the
           class, so a single query keeps them all in sync. */
        return document.querySelectorAll('.js-theme-toggle');
    }

    function apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        var btns = buttons();
        for (var i = 0; i < btns.length; i++) {
            var btn = btns[i];
            btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
            btn.innerHTML = theme === 'dark' ? SUN_SVG : MOON_SVG;
        }
    }

    // Apply immediately to prevent flash
    apply(getPreferred());

    function toggle() {
        var current = document.documentElement.getAttribute('data-theme') || 'dark';
        var next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem(STORAGE_KEY, next);
        apply(next);
    }

    document.addEventListener('DOMContentLoaded', function () {
        var btns = buttons();
        if (!btns.length) return;
        apply(getPreferred());
        for (var i = 0; i < btns.length; i++) {
            btns[i].addEventListener('click', toggle);
        }
    });

    // Follow the OS when the visitor has not explicitly chosen a theme.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        if (!localStorage.getItem(STORAGE_KEY)) {
            apply(getPreferred());
        }
    });
})();
