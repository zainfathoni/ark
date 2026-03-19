#!/usr/bin/env node
/**
 * generate-og-image.js
 *
 * Generates a 1200×630 OG image for any viz page and injects meta tags.
 *
 * Usage:
 *   node scripts/generate-og-image.js viz/hilal-idul-fitri-1446h.html
 *
 * Requires: npx playwright (for screenshot)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

// ── Args ────────────────────────────────────────────────────────────────────
const [, , htmlPath] = process.argv;

if (!htmlPath) {
  console.error(
    "Usage: node scripts/generate-og-image.js <path-to-html-file>"
  );
  process.exit(1);
}

const absHtmlPath = path.resolve(htmlPath);
if (!fs.existsSync(absHtmlPath)) {
  console.error(`File not found: ${absHtmlPath}`);
  process.exit(1);
}

const htmlDir = path.dirname(absHtmlPath);
const baseName = path.basename(absHtmlPath, ".html");
const ogImageFile = `${baseName}-og.png`;
const ogImagePath = path.join(htmlDir, ogImageFile);

// ── Parse HTML ──────────────────────────────────────────────────────────────
const htmlContent = fs.readFileSync(absHtmlPath, "utf8");

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : baseName;
}

function extractDescription(html) {
  // Try meta description first
  let m = html.match(
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
  );
  if (m) return m[1].trim();

  // Try og:description
  m = html.match(
    /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i
  );
  if (m) return m[1].trim();

  // Try hero__sub or subtitle class
  m = html.match(
    /<p\s+class=["'](?:hero__sub|subtitle)["'][^>]*>([^<]+)<\/p>/i
  );
  if (m) return m[1].trim();

  // Try first <p> in <body> with meaningful text (>20 chars)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)/i);
  if (bodyMatch) {
    const pTags = bodyMatch[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    for (const pt of pTags) {
      const text = pt[1].replace(/<[^>]+>/g, "").trim();
      if (text.length > 20) return text.slice(0, 160);
    }
  }

  return "";
}

const title = extractTitle(htmlContent);
const description = extractDescription(htmlContent);

console.log(`Title: ${title}`);
console.log(`Description: ${description}`);

// ── Relative path for URL ───────────────────────────────────────────────────
// Compute the viz-relative path: viz/<filename>.html
const repoRoot = path.resolve(__dirname, "..");
const relPath = path.relative(repoRoot, absHtmlPath).replace(/\\/g, "/");
const siteUrl = `https://ark.zainf.dev/${relPath}`;
const ogImageUrl = `https://ark.zainf.dev/${path.relative(repoRoot, ogImagePath).replace(/\\/g, "/")}`;

// ── OG Image Template ───────────────────────────────────────────────────────
const accent = "#f59e0b";
const bg = "#0a0e1a";

// Split long titles for better layout
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Dynamically size the title
function titleFontSize(text) {
  if (text.length > 80) return 36;
  if (text.length > 55) return 42;
  if (text.length > 40) return 48;
  return 56;
}

const fontSize = titleFontSize(title);

const ogHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1200px;
    height: 630px;
    background: ${bg};
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    position: relative;
    padding: 60px 72px;
  }

  /* Warm accent glow — top left */
  body::before {
    content: '';
    position: absolute;
    top: -100px;
    left: -60px;
    width: 500px;
    height: 450px;
    background: radial-gradient(ellipse, ${accent}22 0%, transparent 70%);
    pointer-events: none;
  }

  /* Secondary glow — bottom right */
  body::after {
    content: '';
    position: absolute;
    bottom: -80px;
    right: -40px;
    width: 400px;
    height: 350px;
    background: radial-gradient(ellipse, ${accent}15 0%, transparent 70%);
    pointer-events: none;
  }

  .domain {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: ${accent};
    text-transform: uppercase;
    margin-bottom: 28px;
  }

  .title {
    font-size: ${fontSize}px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.02em;
    line-height: 1.15;
    margin-bottom: 24px;
    max-width: 1000px;
  }

  .description {
    font-size: 20px;
    font-weight: 400;
    color: #94a3b8;
    line-height: 1.6;
    max-width: 860px;
    margin-bottom: 0;
  }

  .footer {
    position: absolute;
    bottom: 40px;
    left: 72px;
    right: 72px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .footer-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: ${accent};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 800;
    color: ${bg};
  }

  .footer-site {
    font-size: 15px;
    font-weight: 600;
    color: #64748b;
  }

  .divider {
    height: 2px;
    width: 60px;
    background: linear-gradient(90deg, ${accent}, transparent);
    border-radius: 1px;
    margin-bottom: 20px;
  }

  .footer-line {
    position: absolute;
    bottom: 80px;
    left: 72px;
    right: 72px;
    height: 1px;
    background: linear-gradient(90deg, ${accent}33, #1e293b, transparent);
  }
</style>
</head>
<body>
  <div class="domain">ark.zainf.dev</div>
  <div class="divider"></div>
  <div class="title">${escapeHtml(title)}</div>
  <div class="description">${escapeHtml(description)}</div>
  <div class="footer-line"></div>
  <div class="footer">
    <div class="footer-left">
      <div class="footer-icon">A</div>
      <div class="footer-site">ark.zainf.dev</div>
    </div>
  </div>
</body>
</html>`;

// ── Write temp HTML & screenshot ────────────────────────────────────────────
const tmpHtml = path.join(os.tmpdir(), `og-image-${Date.now()}.html`);
fs.writeFileSync(tmpHtml, ogHtml, "utf8");

try {
  console.log(`Generating OG image → ${ogImagePath}`);
  execSync(
    `npx playwright screenshot --browser chromium --viewport-size "1200,630" "file://${tmpHtml}" "${ogImagePath}"`,
    { stdio: "inherit" }
  );
  console.log(`OG image saved: ${ogImagePath}`);
} finally {
  fs.unlinkSync(tmpHtml);
}

// ── Inject/update meta tags in HTML ─────────────────────────────────────────
let updatedHtml = htmlContent;

const ogTags = [
  `<meta property="og:type" content="article">`,
  `<meta property="og:title" content="${escapeHtml(title)}">`,
  `<meta property="og:description" content="${escapeHtml(description)}">`,
  `<meta property="og:image" content="${ogImageUrl}">`,
  `<meta property="og:url" content="${siteUrl}">`,
];

const twitterTags = [
  `<meta name="twitter:card" content="summary_large_image">`,
  `<meta name="twitter:title" content="${escapeHtml(title)}">`,
  `<meta name="twitter:description" content="${escapeHtml(description)}">`,
  `<meta name="twitter:image" content="${ogImageUrl}">`,
];

const allMetaTags =
  "\n  <!-- Open Graph -->\n  " +
  ogTags.join("\n  ") +
  "\n\n  <!-- Twitter Card -->\n  " +
  twitterTags.join("\n  ") +
  "\n";

// Remove existing OG/Twitter meta blocks (idempotent)
updatedHtml = updatedHtml.replace(
  /\n\s*<!-- Open Graph -->[\s\S]*?<!-- Twitter Card -->[\s\S]*?<meta name="twitter:image"[^>]*>\n?/,
  ""
);

// Also remove individual stray og/twitter tags that might exist
updatedHtml = updatedHtml.replace(
  /\s*<meta\s+(?:property="og:|name="twitter:)[^>]*>\n?/g,
  ""
);

// Insert after <title>...</title>
updatedHtml = updatedHtml.replace(
  /(<title[^>]*>[^<]*<\/title>)/i,
  `$1\n${allMetaTags}`
);

fs.writeFileSync(absHtmlPath, updatedHtml, "utf8");
console.log(`Meta tags injected into: ${absHtmlPath}`);
