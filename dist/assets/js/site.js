/* Agreely - shared interaction layer for landing + docs.
   Island nav docking (rAF), scrollspy (IntersectionObserver),
   and reveal-on-scroll. No springs, no bounce. */
(function () {
    'use strict';

    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var nav = document.getElementById('siteHeader');

    // ── A11y: relabel bundled heading permalinks ──────────────
    // The markdown renderer marks the "#" permalinks aria-hidden while leaving
    // them focusable. Give them a real accessible name instead.
    document.querySelectorAll('.heading-permalink').forEach(function (a) {
        a.removeAttribute('aria-hidden');
        if (!a.getAttribute('aria-label')) a.setAttribute('aria-label', 'Permalink to this heading');
    });

    // ── Island nav: dock to pill on scroll ────────────────────
    // Docs: a fixed bar that compacts after ~160px. Landing: the spread is the
    // in-hero header that scrolls away with the page, so the floating island
    // only pops once that header has scrolled out of view (its own height).
    if (nav) {
        var isLanding = nav.getAttribute('data-mode') === 'landing';
        var ticking = false;
        var spread = nav.querySelector('.isl-spread');
        var pillwrap = nav.querySelector('.isl-pillwrap');
        var DOCK_AT = 160;
        var computeDock = function () {
            if (isLanding && spread) {
                // pop just after the in-hero header has cleared the viewport top
                DOCK_AT = Math.max(64, spread.offsetHeight - 6);
            }
        };
        computeDock();
        window.addEventListener('resize', function () {
            computeDock();
            if (!ticking) { window.requestAnimationFrame(apply); ticking = true; }
        }, { passive: true });
        // Keep only the active layer focusable + in the a11y tree (inert removes
        // the hidden layer's focusable children, clearing aria-hidden-focus).
        var setLayer = function (scrolled) {
            if (spread) {
                spread.toggleAttribute('inert', scrolled);
                spread.setAttribute('aria-hidden', scrolled ? 'true' : 'false');
            }
            if (pillwrap) {
                pillwrap.toggleAttribute('inert', !scrolled);
                pillwrap.setAttribute('aria-hidden', scrolled ? 'false' : 'true');
            }
        };
        var apply = function () {
            var scrolled = window.scrollY > DOCK_AT;
            nav.classList.toggle('is-scrolled', scrolled);
            setLayer(scrolled);
            ticking = false;
        };
        apply();
        window.addEventListener('scroll', function () {
            if (!ticking) { window.requestAnimationFrame(apply); ticking = true; }
        }, { passive: true });
    }

    // ── Scrollspy (landing sections) ──────────────────────────
    if (nav && 'IntersectionObserver' in window) {
        var sections = document.querySelectorAll('section[id]');
        if (sections.length) {
            var visible = new Map();
            var setActive = function () {
                var top = null, best = -Infinity;
                visible.forEach(function (ratio, id) { if (ratio > best) { best = ratio; top = id; } });
                if (top) nav.setAttribute('data-active-section', top);
            };
            var obs = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) visible.set(e.target.id, e.intersectionRatio);
                    else visible.delete(e.target.id);
                });
                setActive();
            }, { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });
            sections.forEach(function (s) { obs.observe(s); });
        }
    }

    // ── Reveal-on-scroll ──────────────────────────────────────
    if ('IntersectionObserver' in window && !prefersReduced) {
        document.documentElement.classList.add('js-anim');
        var vh = window.innerHeight;
        var revealObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add('is-visible'); revealObs.unobserve(e.target); }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
        document.querySelectorAll('.reveal-on-scroll').forEach(function (el) {
            if (el.getBoundingClientRect().top < vh) el.classList.add('is-visible');
            else revealObs.observe(el);
        });
    }

    // ── App launch dropdown(s) ─────────────────────────────────
    // Handles both the spread (at-rest) and docked-pill variants. Each instance
    // is independent: click opens, click-away / Escape / Tab closes. Arrow keys
    // move focus between menu items. MutationObserver auto-closes when the host
    // nav layer hides (the spread <-> pill scroll transition).
    document.querySelectorAll('.isl-launch-dropdown').forEach(function (wrapper) {
        var btn = wrapper.querySelector('.isl-launch-btn');
        var menu = wrapper.querySelector('.isl-launch-menu');
        if (!btn || !menu) return;

        var isOpen = false;

        var openDropdown = function () {
            // Close any other open launch menu
            document.querySelectorAll('.isl-launch-menu:not([hidden])').forEach(function (m) {
                if (m !== menu) {
                    m.hidden = true;
                    var b = m.closest('.isl-launch-dropdown');
                    if (b) b.querySelector('.isl-launch-btn').setAttribute('aria-expanded', 'false');
                }
            });
            isOpen = true;
            btn.setAttribute('aria-expanded', 'true');
            menu.hidden = false;
            var first = menu.querySelector('[role="menuitem"]');
            if (first) first.focus();
        };

        var closeDropdown = function (returnFocus) {
            if (!isOpen) return;
            isOpen = false;
            btn.setAttribute('aria-expanded', 'false');
            menu.hidden = true;
            if (returnFocus) btn.focus();
        };

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (isOpen) closeDropdown(true);
            else openDropdown();
        });

        menu.addEventListener('keydown', function (e) {
            var items = Array.prototype.slice.call(menu.querySelectorAll('[role="menuitem"]'));
            var idx = items.indexOf(document.activeElement);
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                items[(idx + 1) % items.length].focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                items[(idx - 1 + items.length) % items.length].focus();
            } else if (e.key === 'Escape' || e.key === 'Esc') {
                e.preventDefault();
                closeDropdown(true);
            } else if (e.key === 'Tab') {
                closeDropdown(false);
            }
        });

        menu.querySelectorAll('[role="menuitem"]').forEach(function (item) {
            item.addEventListener('click', function () { closeDropdown(false); });
        });

        document.addEventListener('click', function (e) {
            if (isOpen && !wrapper.contains(e.target)) { closeDropdown(false); }
        });

        // Auto-close when the host nav layer hides (scroll docking switches spread <-> pill)
        var hostLayer = wrapper.closest('.isl-spread, .isl-pillwrap');
        if (hostLayer && 'MutationObserver' in window) {
            new MutationObserver(function (mutations) {
                for (var i = 0; i < mutations.length; i++) {
                    if (mutations[i].attributeName === 'aria-hidden' &&
                        hostLayer.getAttribute('aria-hidden') === 'true') {
                        closeDropdown(false);
                    }
                }
            }).observe(hostLayer, { attributes: true, attributeFilter: ['aria-hidden'] });
        }
    });
})();
