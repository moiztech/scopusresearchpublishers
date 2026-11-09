# Scopus Research Publishers — website

Hand-coded static website (HTML, CSS, vanilla JavaScript) replacing the old WordPress site.
No build step or framework: upload the files and it works.

## Structure

```
index.html                    Homepage
our-services/                 Services hub
<service-slug>/               6 service pages (same URLs as the old site)
about-us/  feedbacks/  contact-us/  privacy-policy/
blogs/                        Article index (with search)
<article-slug>/               30 articles (same URLs as the old site)
404.html                      "Page not found" page
contact-us/send.php           Contact-form mailer (needs PHP hosting)
assets/css/style.css          Global styles + homepage
assets/css/pages.css          Inner-page components
assets/js/main.js             Menu, animations, FAQ, blog search, contact form
assets/img/                   Images (assets/img/blog/ = article images)
partials/                     Shared header + footer (source of truth)
tools/sync-partials.py        Copies the partials into every page
sitemap.xml, robots.txt, .htaccess
```

## Changing the menu, footer or icons

Edit `partials/header.html` or `partials/footer.html`, then run:

```
python tools/sync-partials.py
```

The header/footer is written into every page between the `BEGIN:site-header` /
`END:site-header` (and `site-footer`) markers, with the correct relative paths.

## Adding a new article

1. Copy any article folder (e.g. `academic-journal-submission-7-mistakes-you-should-never-make/`)
   and rename it to the new URL slug.
2. Edit the title, meta description, date, image paths and the text inside `.prose`.
3. Add images to `assets/img/blog/` as `<slug>.webp`, `<slug>.jpg` (1200×800) and `<slug>-sm.webp` (640×427).
4. Add a card for it at the top of the grid in `blogs/index.html`, and a `<url>` entry in `sitemap.xml`.

## Previewing locally

Links use folder URLs (`about-us/`), so preview through a local web server, not by double-clicking files:

```
python -m http.server 8000
```

Then open http://localhost:8000

## Deploying (Hostinger or any Apache/PHP host)

Push this folder to GitHub, then in Hostinger (hPanel → Advanced → Git) connect the repository
and deploy it into `public_html/`. `partials/`, `tools/` and this README are blocked from public
access by `.htaccess`.

- **Contact form:** `contact-us/send.php` sends mail with PHP `mail()` to `info@scopusresearchpublishers.com`.
  Set `FROM_ADDRESS` in that file to a real mailbox on the domain (e.g. create `no-reply@…` in Hostinger)
  so messages don't land in spam. Send a test message after going live.
- `.htaccess` forces HTTPS, removes `www`, serves `404.html`, and redirects old WordPress
  addresses (`/feed/`, `/category/…`, `/wp-admin/`).
- After launch, submit `https://scopusresearchpublishers.com/sitemap.xml` in Google Search Console.
