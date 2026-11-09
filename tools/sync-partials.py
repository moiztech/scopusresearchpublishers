#!/usr/bin/env python3
"""
Copy the shared header and footer into every page of the site.

The site is plain static HTML: every page contains its own copy of the header
and footer so it works on any host with no build step. To change the menu,
footer or icon set, edit the files in /partials and run:

    python tools/sync-partials.py

Each page marks where the partials go with:

    <!-- BEGIN:site-header --> ... <!-- END:site-header -->
    <!-- BEGIN:site-footer --> ... <!-- END:site-footer -->

Tokens inside partials:
    {{root}}  relative path to the site root ("" on the homepage, "../" one level down)
    {{home}}  link to the homepage ("./" on the homepage, "../" one level down)
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {"partials", "tools", ".git", "node_modules"}
PARTS = {
    "site-header": (ROOT / "partials" / "header.html").read_text(encoding="utf-8"),
    "site-footer": (ROOT / "partials" / "footer.html").read_text(encoding="utf-8"),
}


def render(template: str, depth: int, absolute: bool = False) -> str:
    # 404.html is served at whatever URL was missing, so it needs root-absolute links
    root = "/" if absolute else "../" * depth
    home = "/" if absolute else (root or "./")
    return template.replace("{{root}}", root).replace("{{home}}", home)


def main() -> int:
    changed = 0
    pages = [p for p in ROOT.rglob("*.html")
             if not any(part in SKIP_DIRS for part in p.relative_to(ROOT).parts)
             and not p.name.startswith("_")]
    for page in sorted(pages):
        depth = len(page.relative_to(ROOT).parts) - 1
        html = page.read_text(encoding="utf-8")
        new = html
        for name, template in PARTS.items():
            pattern = re.compile(rf"(<!-- BEGIN:{name} -->)(.*?)(<!-- END:{name} -->)", re.S)
            if not pattern.search(new):
                print(f"  ! {page.relative_to(ROOT)} has no {name} markers")
                continue
            block = render(template, depth, absolute=(page.name == "404.html")).strip("\n")
            new = pattern.sub(lambda m: f"{m.group(1)}\n{block}\n{m.group(3)}", new, count=1)
        if new != html:
            page.write_text(new, encoding="utf-8")
            changed += 1
    print(f"Synced partials into {changed} of {len(pages)} page(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
