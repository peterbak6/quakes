'use strict';

const FEED_BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/';

const feedSelect   = document.getElementById('feed-select');
const sortSelect   = document.getElementById('sort-select');
const searchInput  = document.getElementById('search-input');
const refreshBtn   = document.getElementById('refresh-btn');
const quakeList    = document.getElementById('quake-list');
const summaryEl    = document.getElementById('summary');
const statusEl     = document.getElementById('status');

let allFeatures = [];
let lastMeta    = {};

// ── Magnitude helpers ──────────────────────────────────────────────────────

function magClass(mag) {
  if (mag === null || mag === undefined) return 'mag-light';
  if (mag < 2)   return 'mag-minor';
  if (mag < 4)   return 'mag-light';
  if (mag < 5)   return 'mag-moderate';
  if (mag < 7)   return 'mag-strong';
  if (mag < 8)   return 'mag-major';
  return 'mag-great';
}

function formatMag(mag) {
  if (mag === null || mag === undefined) return '?';
  return mag.toFixed(1);
}

// ── Date helper ────────────────────────────────────────────────────────────

function formatTime(epochMs) {
  if (!epochMs) return 'Unknown time';
  const d = new Date(epochMs);
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
  });
}

function timeAgo(epochMs) {
  if (!epochMs) return '';
  const diffMs  = Date.now() - epochMs;
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1)   return 'just now';
  if (diffMin < 60)  return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24)    return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}d ago`;
}

// ── Render ─────────────────────────────────────────────────────────────────

function renderList(features) {
  quakeList.innerHTML = '';

  if (features.length === 0) {
    quakeList.innerHTML = '<p class="status">No earthquakes match your filters.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  features.forEach(f => {
    const p    = f.properties;
    const mag  = p.mag;
    const cls  = magClass(mag);
    const depth = f.geometry && f.geometry.coordinates
      ? f.geometry.coordinates[2]
      : null;

    const card = document.createElement('article');
    card.className = `quake-card ${cls}`;

    card.innerHTML = `
      <div class="mag-badge ${cls}" aria-label="Magnitude ${formatMag(mag)}">
        ${formatMag(mag)}
      </div>
      <div class="quake-info">
        <div class="quake-place" title="${escapeHtml(p.place || 'Unknown location')}">
          ${escapeHtml(p.place || 'Unknown location')}
        </div>
        <div class="quake-meta">
          ${escapeHtml(formatTime(p.time))}
          &nbsp;·&nbsp;
          <em>${escapeHtml(timeAgo(p.time))}</em>
        </div>
      </div>
      <div class="quake-details">
        <div class="quake-depth">Depth: <span>${depth !== null ? depth.toFixed(1) + ' km' : '—'}</span></div>
        ${p.url ? `<a class="quake-link" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">Details ↗</a>` : ''}
      </div>
    `;

    fragment.appendChild(card);
  });

  quakeList.appendChild(fragment);
}

function renderSummary(meta, total, shown) {
  summaryEl.hidden = false;
  summaryEl.innerHTML = `
    Showing <span>${shown}</span> of <span>${total}</span> earthquakes
    &nbsp;·&nbsp;
    Updated: <span>${meta.generated ? formatTime(meta.generated) : 'N/A'}</span>
  `;
}

function showStatus(msg, isError = false) {
  statusEl.hidden  = false;
  statusEl.textContent = msg;
  statusEl.className = isError ? 'status error' : 'status';
}

function hideStatus() {
  statusEl.hidden = true;
}

// ── Escaping ───────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Filter & sort ──────────────────────────────────────────────────────────

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const sort  = sortSelect.value;

  let features = allFeatures.filter(f => {
    if (!query) return true;
    const place = (f.properties.place || '').toLowerCase();
    return place.includes(query);
  });

  features = features.slice().sort((a, b) => {
    if (sort === 'magnitude') {
      return (b.properties.mag || 0) - (a.properties.mag || 0);
    }
    // default: time descending
    return (b.properties.time || 0) - (a.properties.time || 0);
  });

  return features;
}

// ── Fetch ──────────────────────────────────────────────────────────────────

async function fetchEarthquakes() {
  const feedKey = feedSelect.value;                        // e.g. "2.5_day"
  const url     = `${FEED_BASE}${feedKey}.geojson`;

  quakeList.innerHTML = '';
  summaryEl.hidden    = true;
  showStatus('Loading earthquake data…');
  refreshBtn.disabled = true;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();

    allFeatures = data.features || [];
    lastMeta    = data.metadata || {};
    hideStatus();

    const filtered = applyFilters();
    renderSummary(data.metadata || {}, allFeatures.length, filtered.length);
    renderList(filtered);

  } catch (err) {
    showStatus(`Failed to load data: ${err.message}`, true);
    console.error('Fetch error:', err);
  } finally {
    refreshBtn.disabled = false;
  }
}

// ── Event listeners ────────────────────────────────────────────────────────

feedSelect.addEventListener('change', fetchEarthquakes);
sortSelect.addEventListener('change', () => {
  const filtered = applyFilters();
  renderSummary(lastMeta, allFeatures.length, filtered.length);
  renderList(filtered);
});

let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const filtered = applyFilters();
    renderSummary(lastMeta, allFeatures.length, filtered.length);
    renderList(filtered);
  }, 300);
});

refreshBtn.addEventListener('click', fetchEarthquakes);

// ── Initial load ───────────────────────────────────────────────────────────
fetchEarthquakes();
