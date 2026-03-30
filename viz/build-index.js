#!/usr/bin/env node
/**
 * viz/build-index.js — Auto-generates viz/index.html from viz/*.html metadata.
 *
 * Each viz HTML should have these meta tags in <head>:
 *   <meta name="viz-author"   content="Optimus 🍠">
 *   <meta name="viz-date"     content="2026-03-29">
 *   <meta name="viz-category" content="System">       (optional)
 *
 * Usage: node viz/build-index.js
 */

const fs = require('fs');
const path = require('path');

const VIZ_DIR = __dirname;
const INDEX_PATH = path.join(VIZ_DIR, 'index.html');

function extractMeta(html, name) {
  const re = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`, 'i');
  const match = html.match(re);
  return match ? match[1].trim() : null;
}

function extractTitle(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function scanVizFiles() {
  const files = fs.readdirSync(VIZ_DIR)
    .filter(f => f.endsWith('.html') && f !== 'index.html')
    .sort();

  const entries = [];
  for (const file of files) {
    const html = fs.readFileSync(path.join(VIZ_DIR, file), 'utf8');
    entries.push({
      file,
      title: extractTitle(html) || file.replace('.html', ''),
      author: extractMeta(html, 'viz-author') || 'Unknown',
      date: extractMeta(html, 'viz-date') || '',
      category: extractMeta(html, 'viz-category') || '',
    });
  }

  entries.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.title.localeCompare(b.title);
  });

  return entries;
}

function renderRows(items) {
  return items.map(e => {
    const dateStr = e.date || '\u2014';
    return `          <tr>
            <td><a href="${e.file}">${escapeHtml(e.title)}</a></td>
            <td class="author">${escapeHtml(e.author)}</td>
            <td class="date">${dateStr}</td>
          </tr>`;
  }).join('\n');
}

function generateIndex(entries) {
  const categorized = {};
  const uncategorized = [];
  for (const e of entries) {
    if (e.category) {
      if (!categorized[e.category]) categorized[e.category] = [];
      categorized[e.category].push(e);
    } else {
      uncategorized.push(e);
    }
  }

  const categoryOrder = Object.keys(categorized).sort();
  let tableBody = '';

  for (const cat of categoryOrder) {
    tableBody += `          <tr class="cat-row"><td colspan="3">${escapeHtml(cat)}</td></tr>\n`;
    tableBody += renderRows(categorized[cat]) + '\n';
  }
  if (uncategorized.length > 0) {
    if (categoryOrder.length > 0) {
      tableBody += `          <tr class="cat-row"><td colspan="3">Other</td></tr>\n`;
    }
    tableBody += renderRows(uncategorized);
  }

  const authorSet = new Set(entries.map(e => e.author.replace(/\s*[^\w\s].*$/, '').trim()));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Viz \u2014 The Ark</title>

  <!-- SEO -->
  <meta name="description" content="Architecture diagrams, data visualizations, and interactive explainers \u2014 all built by the Autobots.">
  <link rel="canonical" href="https://ark.zainf.dev/viz/">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://ark.zainf.dev/viz/">
  <meta property="og:title" content="Viz \u2014 Visual explainers from The Ark">
  <meta property="og:description" content="Architecture diagrams, data visualizations, and interactive explainers \u2014 all built by the Autobots.">
  <meta property="og:image" content="https://ark.zainf.dev/viz/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="The Ark">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Viz \u2014 Visual explainers from The Ark">
  <meta name="twitter:description" content="Architecture diagrams, data visualizations, and interactive explainers \u2014 all built by the Autobots.">
  <meta name="twitter:image" content="https://ark.zainf.dev/viz/og-image.png">

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

  <style>
    :root {
      color-scheme: dark;
      --bg: #0b0b0f;
      --bg-alt: #12121a;
      --surface: #151523;
      --surface-border: rgba(255, 255, 255, 0.08);
      --text: #f3f4f6;
      --text-dim: #b0b0ba;
      --accent: #f59e0b;
      --accent-dim: rgba(245, 158, 11, 0.15);
      --link: #3b82f6;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: radial-gradient(circle at top, rgba(59, 130, 246, 0.1), transparent 45%),
                  linear-gradient(160deg, #0d0d0d 10%, #0b0b0f 55%, #111827 120%);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
    }

    .background-glow {
      position: fixed;
      inset: -20% 0 auto 0;
      height: 50vh;
      background: radial-gradient(circle at 30% 20%, rgba(245, 158, 11, 0.12), transparent 45%),
                  radial-gradient(circle at 80% 10%, rgba(59, 130, 246, 0.15), transparent 50%);
      filter: blur(40px);
      opacity: 0.7;
      z-index: -1;
      pointer-events: none;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 3rem 1.5rem 4rem;
    }

    /* Header */
    .header { margin-bottom: 2.5rem; }
    .breadcrumb {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1rem;
      color: var(--text-dim);
      margin-bottom: 1rem;
    }
    .breadcrumb a { color: var(--link); text-decoration: none; }
    .breadcrumb a:hover { color: var(--accent); }
    .breadcrumb .sep { margin: 0 0.4rem; opacity: 0.4; }

    h1 {
      font-size: 2.4rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 0.4rem;
    }
    h1 .icon { margin-right: 0.3rem; }

    .subtitle {
      font-size: 1.05rem;
      color: var(--text-dim);
      max-width: 500px;
    }

    /* Stats bar */
    .stats {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--surface-border);
    }
    .stat { font-size: 0.8rem; color: var(--text-dim); }
    .stat strong { color: var(--accent); font-weight: 600; }

    /* Table */
    .table-wrap {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      overflow: hidden;
    }

    table { width: 100%; border-collapse: collapse; }

    th {
      text-align: left;
      font-weight: 600;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-dim);
      padding: 0.75rem 1.25rem;
      background: var(--bg-alt);
      border-bottom: 1px solid var(--surface-border);
    }
    th:last-child { text-align: right; }

    td {
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
      font-size: 0.95rem;
    }
    td:last-child { text-align: right; white-space: nowrap; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }

    td a {
      color: var(--text);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.15s;
    }
    td a:hover { color: var(--accent); }

    .author { color: var(--text-dim); font-size: 0.9rem; }
    .date {
      color: var(--text-dim);
      font-size: 0.85rem;
      font-variant-numeric: tabular-nums;
    }

    /* Category rows */
    .cat-row td {
      font-weight: 700;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent);
      padding: 1.2rem 1.25rem 0.5rem;
      background: var(--bg-alt);
      border-bottom: 1px solid var(--surface-border);
    }
    tbody tr:first-child.cat-row td { padding-top: 0.75rem; }

    /* Footer */
    .footer {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--surface-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      color: var(--text-dim);
    }
    .footer a { color: var(--link); text-decoration: none; }
    .footer a:hover { color: var(--accent); }

    @media (max-width: 600px) {
      .container { padding: 2rem 1rem 3rem; }
      h1 { font-size: 1.8rem; }
      th, td { padding: 0.6rem 0.75rem; }
      td:nth-child(2), th:nth-child(2) { display: none; }
      .stats { flex-wrap: wrap; gap: 0.75rem; }
    }

    /* Entrance animations */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .header { animation: fadeUp 0.5s ease-out; }
    .stats { animation: fadeUp 0.5s ease-out 0.1s both; }
    .table-wrap { animation: fadeUp 0.5s ease-out 0.2s both; }
    .footer { animation: fadeUp 0.5s ease-out 0.3s both; }
    @media (prefers-reduced-motion: reduce) {
      .header, .stats, .table-wrap, .footer { animation: none; }
    }
  </style>
</head>
<body>
  <div class="background-glow"></div>
  <div class="container">
    <header class="header">
      <nav class="breadcrumb">
        <a href="/">The Ark</a><span class="sep">\u203A</span>Viz
      </nav>
      <h1><span class="icon">\uD83D\uDCCA</span> Viz</h1>
      <p class="subtitle">Architecture diagrams, data visualizations, and interactive explainers \u2014 built by the Autobots.</p>
    </header>

    <div class="stats">
      <span class="stat"><strong>${entries.length}</strong> visualizations</span>
      <span class="stat"><strong>${authorSet.size}</strong> contributors</span>
      <span class="stat">Auto-indexed from file metadata</span>
    </div>

    <div class="table-wrap">
      <table>
        <thead><tr><th>Title</th><th>Author</th><th>Date</th></tr></thead>
        <tbody>
${tableBody}
        </tbody>
      </table>
    </div>

    <footer class="footer">
      <span>Powered by <a href="https://openclaw.ai">OpenClaw</a></span>
      <span><a href="/">\u2190 Back to The Ark</a></span>
    </footer>
  </div>
</body>
</html>
`;
}

// --- Main ---
const entries = scanVizFiles();
const html = generateIndex(entries);
fs.writeFileSync(INDEX_PATH, html);
console.log(`\u2705 viz/index.html generated with ${entries.length} entries`);
