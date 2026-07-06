LEAF ?= leaf
PROD_URL := https://you.agreely.ca

# agreely-vous: a single static landing (FR at /, EN under /en/). No docs tree,
# so the build is just `leaf build` plus a smoke-test gate. The gate enforces the
# house rules: NO em-dash (U+2014) and NO en-dash (U+2013) anywhere in dist, plus
# hreflang + og + sitemap/robots emitted from production_url.

.PHONY: dev build clean check preview

dev:
	$(LEAF) dev -addr :8080

build: clean
	$(LEAF) build
	@# Prune the auto-emitted 404 error pages from the sitemap: they are error pages,
	@# not crawlable URLs, and listing them makes Search Console flag "not found".
	@python3 -c "import re; p='dist/sitemap.xml'; s=open(p,encoding='utf-8').read(); s=re.sub(r'\s*<url>\s*<loc>[^<]*/404/</loc>.*?</url>', '', s, flags=re.S); open(p,'w',encoding='utf-8').write(s)"

clean:
	rm -rf dist

check: build
	@# ---- Pages render (FR root + EN /en/) --------------------------------------
	@test -f dist/index.html || (echo "FAIL: dist/index.html (FR landing) missing" && exit 1)
	@test -f dist/en/index.html || (echo "FAIL: dist/en/index.html (EN landing) missing" && exit 1)
	@# ---- SEO artifacts ---------------------------------------------------------
	@test -f dist/sitemap.xml || (echo "FAIL: dist/sitemap.xml missing" && exit 1)
	@test -f dist/robots.txt || (echo "FAIL: dist/robots.txt missing" && exit 1)
	@test -f dist/site.webmanifest || (echo "FAIL: dist/site.webmanifest missing" && exit 1)
	@test -f dist/assets/css/app.css || (echo "FAIL: dist/assets/css/app.css missing" && exit 1)
	@test -f dist/assets/css/citizen.css || (echo "FAIL: dist/assets/css/citizen.css missing" && exit 1)
	@test -f dist/assets/og/og-fr.png || (echo "FAIL: FR og card missing" && exit 1)
	@test -f dist/assets/og/og-en.png || (echo "FAIL: EN og card missing" && exit 1)
	@grep -q 'og-fr.png' dist/index.html || (echo "FAIL: FR landing not serving FR og card" && exit 1)
	@grep -q 'og-en.png' dist/en/index.html || (echo "FAIL: EN landing not serving EN og card" && exit 1)
	@grep -q 'application/ld+json' dist/index.html || (echo "FAIL: landing missing JSON-LD" && exit 1)
	@# ---- Hreflang + locale wiring ----------------------------------------------
	@grep -q 'hreflang="fr"' dist/index.html || (echo "FAIL: FR landing missing hreflang" && exit 1)
	@grep -q 'hreflang="x-default"' dist/index.html || (echo "FAIL: landing missing x-default hreflang" && exit 1)
	@grep -q '<html lang="fr"' dist/index.html || (echo "FAIL: FR landing not lang=fr" && exit 1)
	@grep -q '<html lang="en"' dist/en/index.html || (echo "FAIL: EN landing not lang=en" && exit 1)
	@grep -q 'you.agreely.ca/en/' dist/sitemap.xml || (echo "FAIL: sitemap missing EN /en/ URL" && exit 1)
	@! grep -q '/404/' dist/sitemap.xml || (echo "FAIL: 404 error page leaked into sitemap" && exit 1)
	@# ---- No em-dash, no en-dash, no leaked PHP errors --------------------------
	@! grep -rl $$'\xe2\x80\x94' dist --include='*.html' >/dev/null 2>&1 || (echo "FAIL: em-dash (U+2014) found in dist" && exit 1)
	@! grep -rl $$'\xe2\x80\x93' dist --include='*.html' >/dev/null 2>&1 || (echo "FAIL: en-dash (U+2013) found in dist" && exit 1)
	@! grep -rlE 'Deprecated:|Warning:|Notice:|Fatal error|Parse error' dist --include='*.html' >/dev/null 2>&1 || (echo "FAIL: PHP error text leaked into dist HTML" && exit 1)
	@echo "OK: smoke checks passed (FR root + EN /en/, hreflang, og, sitemap, no em/en-dash, no PHP leak)."

preview:
	cd dist && python3 -m http.server 4173
