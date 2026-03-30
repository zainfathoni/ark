#!/usr/bin/env node
/**
 * viz/build-index.js — Auto-generates viz/index.html from viz/*.html metadata.
 *
 * Each viz HTML should have these meta tags in <head>:
 *   <meta name="viz-author" content="Optimus 🍠">
 *   <meta name="viz-date"   content="2026-03-29">
 *
 * Falls back to:
 *   - title: filename if <title> missing
 *   - author: "Unknown"
 *   - date: file mtime
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

function scanVizFiles() {
  const files = fs.readdirSync(VIZ_DIR)
    .filter(f => f.endsWith('.html') && f !== 'index.html')
    .sort();

  const entries = [];

  for (const file of files) {
    const html = fs.readFileSync(path.join(VIZ_DIR, file), 'utf8');
    const title = extractTitle(html) || file.replace('.html', '');
    const author = extractMeta(html, 'viz-author') || 'Unknown';
    const date = extractMeta(html, 'viz-date') || '';
    const category = extractMeta(html, 'viz-category') || '';

    entries.push({ file, title, author, date, category });
  }

  // Sort by date descending (newest first), then by title
  entries.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.title.localeCompare(b.title);
  });

  return entries;
}

function generateIndex(entries) {
  // Group by category
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

  function renderRows(items) {
    return items.map(e => {
      const dateStr = e.date || '—';
      return `      <tr>
        <td><a href="${e.file}">${escapeHtml(e.title)}</a></td>
        <td>${escapeHtml(e.author)}</td>
        <td>${dateStr}</td>
      </tr>`;
    }).join('\n');
  }

  let tableBody = '';
  const categoryOrder = Object.keys(categorized).sort();

  for (const cat of categoryOrder) {
    tableBody += `      <tr class="cat-row"><td colspan="3">${escapeHtml(cat)}</td></tr>\n`;
    tableBody += renderRows(categorized[cat]) + '\n';
  }

  if (uncategorized.length > 0) {
    if (categoryOrder.length > 0) {
      tableBody += `      <tr class="cat-row"><td colspan="3">Other</td></tr>\n`;
    }
    tableBody += renderRows(uncategorized);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Viz — The Ark</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #faf7f5; --surface: #ffffff; --border: rgba(0,0,0,0.08);
      --text: #1a1a2e; --text-dim: #6b7280; --accent: #c2410c;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0d1117; --surface: #161b22; --border: rgba(255,255,255,0.06);
        --text: #e6edf3; --text-dim: #8b949e; --accent: #fb923c;
      }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'DM Sans', system-ui, sans-serif;
      background: var(--bg); color: var(--text);
      max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem;
    }
    h1 { font-size: 1.8rem; margin-bottom: 0.3rem; }
    .subtitle { color: var(--text-dim); margin-bottom: 2rem; font-size: 0.95rem; }
    .subtitle a { color: var(--accent); text-decoration: none; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-weight: 500; color: var(--text-dim);
         font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;
         padding: 0.5rem 0; border-bottom: 2px solid var(--border); }
    td { padding: 0.75rem 0; border-bottom: 1px solid var(--border); }
    td a { color: var(--accent); text-decoration: none; font-weight: 500; }
    td a:hover { text-decoration: underline; }
    .empty { color: var(--text-dim); padding: 3rem 0; text-align: center; }
    .count { color: var(--text-dim); font-size: 0.85rem; margin-top: 1.5rem; }
    .cat-row td {
      font-weight: 700; font-size: 0.75rem; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--accent); padding-top: 1.5rem;
      border-bottom: 2px solid var(--border);
    }
    .cat-row:first-child td { padding-top: 0; }
    @media (max-width: 600px) {
      td:nth-child(2), th:nth-child(2) { display: none; }
    }
  </style>
</head>
<body>
  <h1>📊 Viz</h1>
  <p class="subtitle">Visual explainers from <a href="/">The Ark</a></p>
  <table>
    <thead><tr><th>Title</th><th>Author</th><th>Date</th></tr></thead>
    <tbody>
${tableBody}
    </tbody>
  </table>
  <p class="count">${entries.length} visualizations · auto-generated by build-index.js</p>
</body>
</html>
`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- Main ---
const entries = scanVizFiles();
const html = generateIndex(entries);
fs.writeFileSync(INDEX_PATH, html);
console.log(`✅ viz/index.html generated with ${entries.length} entries`);
