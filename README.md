# Agreely, pour les citoyens (vous.agreely.ca)

The citizen-facing landing for **Agreely**, a warmer static sibling of the
business site (`agreely-site`). Built with [Zephyrus Leaf](https://leaf.ophelios.com)
(Binary tier): Latte templates + JSON locales rendered to a deployable static
`dist/`. Bilingual, FR at `/` and EN under `/en/`.

One surface: a single landing page in ten sections (hero, problem, gifts, app,
why, manifesto, honesty, FAQ, closing CTA, footer). No backend. The manifesto
pledge is share/copy only, there are no stored signatures.

## Build

```bash
make build      # leaf build -> dist/ (FR at /, EN at /en/)
make check      # build + smoke gate (no em-dash / no en-dash, hreflang, og, sitemap)
make dev        # live-reload preview at http://localhost:8080
make preview    # serve the built dist/ at http://localhost:4173
```

## Theme

Shares the token set in `public/assets/css/app.css` with the business site
(copied verbatim). `public/assets/css/citizen.css` is the citizen surface:
indigo carries structure, buttons and links; amber is promoted to co-lead and
one amber highlighter (`.mark`) lands on the single most emotional word per
section. Inter + JetBrains Mono, island nav docking to a pill, reveal footer,
scroll reveals, opt-in dark mode. No new hex values beyond the token set.

## Deploy (gated)

Static, and **deferred**. The build output (`dist/`) is committed to the repo
(the Leaf pattern). When ready, point any static host at `dist/`. Domain:
`vous.agreely.ca`. The primary app link is `my.agreely.ca`; the verifier is
`verify.agreely.ca`; the business site is `agreely.ca`.
