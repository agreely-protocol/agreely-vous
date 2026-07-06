/* Agreely landing - surface interactions layered on top of site.js.
   1) Footer reveal: pin the footer height into a CSS var so the content sheet
      lifts away to reveal it (the visual is pure CSS).
   2) Law 25 feature map: gentle pointer parallax on the drifting cards.
   No springs, no bounce. Honors prefers-reduced-motion. */
(function () {
    'use strict';
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Footer reveal: keep --footer-h in sync with the real footer height ──
    var footer = document.querySelector('[data-footer-reveal]');
    if (footer) {
        var setFooterH = function () {
            document.body.style.setProperty('--footer-h', footer.offsetHeight + 'px');
        };
        setFooterH();
        window.addEventListener('resize', setFooterH, { passive: true });
        window.addEventListener('load', setFooterH);
        if ('ResizeObserver' in window) { new ResizeObserver(setFooterH).observe(footer); }

        // Reveal the fixed footer only once the page is scrolled close to the
        // bottom (it is fully covered above that). Keeping it hidden while covered
        // matches what sighted users see and keeps it out of the a11y tree + away
        // from contrast checkers (its light text would otherwise be scored against
        // the light page sheet that overlaps it). Buffer reveals it a touch early
        // so no light flash shows as the sheet lifts.
        var ticking = false;
        var applyReveal = function () {
            ticking = false;
            var doc = document.documentElement;
            var remaining = doc.scrollHeight - (window.scrollY + window.innerHeight);
            document.body.classList.toggle('footer-revealed', remaining < footer.offsetHeight + 140);
        };
        applyReveal();
        window.addEventListener('scroll', function () {
            if (!ticking) { window.requestAnimationFrame(applyReveal); ticking = true; }
        }, { passive: true });
        window.addEventListener('resize', applyReveal, { passive: true });
        window.addEventListener('load', applyReveal);
    }

    // ── Mobile menu: hamburger-opened, focus-trapped nav dialog ──────────
    // The toggle (#islMenuToggle) opens #islMobileMenu. We move focus into the
    // panel, trap Tab, close on ESC / scrim click / link tap, lock body scroll,
    // and keep the closed menu out of the tab order via the [hidden] attribute.
    var menu = document.getElementById('islMobileMenu');
    var menuToggle = document.getElementById('islMenuToggle');
    if (menu && menuToggle) {
        var closeTimer = null;
        var focusablesIn = function () {
            return Array.prototype.slice.call(
                menu.querySelectorAll('a[href], button:not([disabled])')
            );
        };
        var onKeydown = function (e) {
            if (e.key === 'Escape' || e.key === 'Esc') {
                e.preventDefault();
                closeMenu(true);
                return;
            }
            if (e.key === 'Tab') {
                var f = focusablesIn();
                if (!f.length) return;
                var first = f[0], last = f[f.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault(); last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault(); first.focus();
                }
            }
        };
        var openMenu = function () {
            if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
            menu.hidden = false;
            // force a reflow so the opening transition runs from the hidden state
            void menu.offsetWidth;
            menu.classList.add('is-open');
            menuToggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('menu-lock');
            document.addEventListener('keydown', onKeydown);
            var f = focusablesIn();
            if (f.length) f[0].focus();
        };
        var closeMenu = function (returnFocus) {
            menu.classList.remove('is-open');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-lock');
            document.removeEventListener('keydown', onKeydown);
            var finish = function () {
                menu.hidden = true;
                menu.removeEventListener('transitionend', finish);
                if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
            };
            menu.addEventListener('transitionend', finish);
            // fallback in case transitionend never fires (reduced motion, etc.)
            closeTimer = window.setTimeout(finish, 360);
            if (returnFocus) menuToggle.focus();
        };
        menuToggle.addEventListener('click', function () {
            if (menuToggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
            else openMenu();
        });
        // click on the scrim (outside the panel) closes
        menu.addEventListener('click', function (e) {
            if (e.target === menu) closeMenu(true);
        });
        // tapping any link closes the menu, then lets navigation / scroll proceed
        menu.querySelectorAll('a[href]').forEach(function (a) {
            a.addEventListener('click', function () { closeMenu(false); });
        });
        // leaving the mobile breakpoint while open: close instantly
        var mq = window.matchMedia('(min-width: 821px)');
        var onMq = function (e) {
            if (e.matches && menuToggle.getAttribute('aria-expanded') === 'true') {
                closeMenu(false);
            }
        };
        if (mq.addEventListener) mq.addEventListener('change', onMq);
        else if (mq.addListener) mq.addListener(onMq);
    }

    // ── Footer contact: assemble the obfuscated email ────────────────────
    // The address ships base64-encoded with no "mailto:" or literal email in
    // the HTML source; we decode it and wire the link on load so scrapers that
    // read the markup never see a harvestable address.
    document.querySelectorAll('.isl-footer-mail[data-cmail]').forEach(function (a) {
        try {
            var addr = atob(a.getAttribute('data-cmail'));
            a.setAttribute('href', 'mai' + 'lto:' + addr);
            a.removeAttribute('data-cmail');
        } catch (e) { /* leave the fallback href="#" */ }
    });

    // ── Footer service status (codequill pattern) ────────────────────────
    // Default is operational (server-rendered). We try the status page's
    // uptime-kuma API and only downgrade the dot if it confirms an incident or
    // maintenance; any error keeps the operational state silently.
    var statusEls = document.querySelectorAll('[data-status-footer]');
    if (statusEls.length) {
        var lang = (document.documentElement.lang || 'fr').slice(0, 2) === 'en' ? 'en' : 'fr';
        var STATUS_LABELS = {
            operational: { fr: 'Operationnel', en: 'Operational' },
            degraded: { fr: 'Maintenance en cours', en: 'Under maintenance' },
            down: { fr: 'Incident en cours', en: 'Active incident' }
        };
        fetch('https://status.agreely.ca/api/status-page/agreely', { cache: 'no-store' })
            .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
            .then(function (data) {
                var hasIncident = !!(data && data.incident);
                var maint = !!(data && Array.isArray(data.maintenanceList) && data.maintenanceList.length);
                var status = hasIncident ? 'down' : maint ? 'degraded' : 'operational';
                statusEls.forEach(function (el) {
                    el.setAttribute('data-status', status);
                    var labelEl = el.querySelector('[data-status-label]');
                    if (labelEl) labelEl.textContent = STATUS_LABELS[status][lang];
                });
            })
            .catch(function () { /* keep operational silently */ });
    }

    // ── Law 25 map: pointer parallax (desktop, motion-allowed only) ──
    var stage = document.querySelector('[data-lawmap]');
    if (stage && !reduced && window.matchMedia('(min-width: 901px)').matches && window.matchMedia('(hover: hover)').matches) {
        var cards = Array.prototype.slice.call(stage.querySelectorAll('.lawmap-card'));
        var raf = null, tx = 0, ty = 0;
        var render = function () {
            raf = null;
            cards.forEach(function (card) {
                var depth = parseFloat(card.getAttribute('data-depth')) || 0.04;
                card.style.setProperty('--px', (tx * depth) + 'px');
                card.style.setProperty('--py', (ty * depth) + 'px');
            });
        };
        stage.addEventListener('pointermove', function (e) {
            var r = stage.getBoundingClientRect();
            tx = e.clientX - (r.left + r.width / 2);
            ty = e.clientY - (r.top + r.height / 2);
            if (!raf) raf = window.requestAnimationFrame(render);
        });
        stage.addEventListener('pointerleave', function () {
            tx = 0; ty = 0;
            if (!raf) raf = window.requestAnimationFrame(render);
        });
    }
})();
