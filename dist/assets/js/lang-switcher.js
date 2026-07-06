/* Agreely language switcher (FR default at root, EN under /en/).
   Mirrors the ophelios-site app.js pattern: the FR/EN links in the nav carry a
   static fallback href (home in the target locale); this script rewrites each to
   the SAME page in the other locale, remembers the choice in localStorage, and
   on a first visit sends English-preferring visitors to the /en/ mirror once. */
(function () {
    'use strict';

    var DEFAULT = 'fr';
    var KEY = 'agreely-locale';

    function stripLocale(path) {
        var m = path.match(/^\/(fr|en)(\/|$)/);
        if (m) {
            var rest = path.slice(m[1].length + 1);
            return rest === '' ? '/' : rest;
        }
        return path;
    }

    function withLocale(path, loc) {
        var base = stripLocale(path);
        if (loc === DEFAULT) return base;
        return '/' + loc + (base === '/' ? '/' : base);
    }

    function currentLocale(path) {
        var m = path.match(/^\/(en)(\/|$)/);
        return m ? m[1] : DEFAULT;
    }

    // ── First-visit detection ───────────────────────────────────
    // No stored choice, on a FR (root) path, browser prefers English -> /en/.
    try {
        var stored = localStorage.getItem(KEY);
        var here = window.location.pathname || '/';
        if (!stored && currentLocale(here) === DEFAULT) {
            var lang = (navigator.language || navigator.userLanguage || '').toLowerCase();
            if (lang.indexOf('en') === 0) {
                localStorage.setItem(KEY, 'en');
                window.location.replace(withLocale(here, 'en') + window.location.hash);
                return;
            }
        }
    } catch (e) {}

    // ── Same-page locale links ──────────────────────────────────
    function wire() {
        var path = window.location.pathname || '/';
        var hash = window.location.hash || '';
        var links = document.querySelectorAll('.lang-switch[data-locale]');
        Array.prototype.forEach.call(links, function (a) {
            var loc = a.getAttribute('data-locale');
            a.href = withLocale(path, loc) + hash;
            a.addEventListener('click', function () {
                try { localStorage.setItem(KEY, loc); } catch (e) {}
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wire);
    } else {
        wire();
    }
})();
