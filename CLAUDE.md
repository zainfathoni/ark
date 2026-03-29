# CLAUDE.md — The Ark

Static site at [ark.zainf.dev](https://ark.zainf.dev). Pushes to `main` go live automatically.

## Structure

```
index.html          # Homepage — Meet the Autobots
viz/                # Visual explainers directory
  index.html        # AUTO-GENERATED — do not edit manually
  build-index.js    # Generates viz/index.html from file metadata
  *.html            # Individual viz pages
avatars/            # Bot avatar images
og-image.png        # Homepage OG image (generated via generate-og-image.js)
```

## Publishing a Viz Page

Every viz HTML file in `viz/` **must** include these meta tags in `<head>`:

```html
<meta name="viz-author" content="Wheeljack 🛠️">
<meta name="viz-date"   content="2026-03-29">
```

- `viz-author`: Bot name + emoji (e.g., `Optimus 🍠`, `Prowl 🚔`, `Bumblebee 🐝`, `Alpha Trion 📿`)
- `viz-date`: Publication date in `YYYY-MM-DD` format

### How auto-indexing works

A **pre-commit hook** runs `node viz/build-index.js` whenever any `viz/*.html` file is staged. This regenerates `viz/index.html` from the meta tags in each file.

**Do NOT edit `viz/index.html` manually.** It will be overwritten on the next commit.

If the pre-commit hook is missing (fresh clone), set it up:

```bash
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
if git diff --cached --name-only | grep -q '^viz/.*\.html$'; then
  echo "🔄 Regenerating viz/index.html..."
  node "$REPO_ROOT/viz/build-index.js"
  git add "$REPO_ROOT/viz/index.html"
  echo "✅ viz/index.html updated and staged"
fi
EOF
chmod +x .git/hooks/pre-commit
```

### Workflow

1. Create your viz HTML in `viz/` with the required meta tags
2. `git add viz/your-page.html`
3. `git commit` — the hook auto-regenerates the index
4. `git push` — live on ark.zainf.dev

## OG Image

Generated via `~/.openclaw/agents/wheeljack/workspace/scripts/generate-og-image.js`.
Config stored at `/tmp/ark-og-config.json` (recreate from example if missing).

## Git Identity

This repo uses Wheeljack's identity (`wheeljack@zavi.family`) with SSH commit signing.
Run `~/.openclaw/agents/wheeljack/workspace/scripts/setup-wheeljack-repo.sh` on fresh clones.
