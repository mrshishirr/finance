// ─── Config ───────────────────────────────────────────────────────────────────
const FMP_KEY = 'demo'; // https://financialmodelingprep.com/register
const FMP = 'https://financialmodelingprep.com/api/v3';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n, dec = 2) => n != null && !isNaN(n) ? Number(n).toFixed(dec) : '—';
const fmtCurrency = n => n != null && !isNaN(n) ? '$' + Number(n).toFixed(2) : '—';
const fmtPct = n => n != null && !isNaN(n) ? Number(n).toFixed(2) + '%' : '—';
const fmtB = n => n != null && !isNaN(n) ? '$' + (Number(n) / 1e9).toFixed(1) + 'B' : '—';

function setRows(tableId, html) {
  document.querySelector(`#${tableId} tbody`).innerHTML = html;
}

function isoDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

async function apiFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Cache ────────────────────────────────────────────────────────────────────
function cacheGet(key) {
  try {
    const item = JSON.parse(localStorage.getItem(key));
    if (item && Date.now() - item.ts < CACHE_TTL) return item;
  } catch {}
  return null;
}

function cacheSet(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

function cacheClear() {
  ['undervalued', 'ipos', 'earnings', 'dividends'].forEach(k => localStorage.removeItem(k));
}

function updateTimestamp(ts) {
  const el = document.getElementById('last-updated');
  el.textContent = ts
    ? `Last refreshed: ${new Date(ts).toLocaleString()}`
    : 'Last refreshed: just now';
}

// ─── Source label ─────────────────────────────────────────────────────────────
function getSource() {
  return document.getElementById('source-select').value;
}

function sourceLabel() {
  const labels = { yahoo: 'Yahoo Finance', fmp: 'Financial Modeling Prep', alphavantage: 'Alpha Vantage' };
  return labels[getSource()] || getSource();
}

function fallbackNote(cols) {
  return `<tr><td colspan="${cols}" style="color:var(--muted);font-size:0.75rem;text-align:center">
    ⚠ Live data from <strong>${sourceLabel()}</strong> unavailable — showing curated snapshot.
  </td></tr>`;
}

// ─── Section 1: Undervalued Stocks ───────────────────────────────────────────
async function loadUndervalued() {
  setRows('undervalued-table', '<tr><td colspan="7" class="loading">Loading…</td></tr>');
  const cached = cacheGet('undervalued');
  if (cached) { setRows('undervalued-table', cached.data); return; }

  try {
    const data = await apiFetch(
      `${FMP}/stock-screener?marketCapMoreThan=1000000000&peRatioLowerThan=15&peRatioMoreThan=1&betaLowerThan=2&volumeMoreThan=100000&limit=20&apikey=${FMP_KEY}`
    );
    if (!data?.length) throw new Error('No data');
    const rows = data.slice(0, 20).map(s => `
      <tr>
        <td><span class="sym">${s.symbol}</span></td>
        <td>${s.companyName || '—'}</td>
        <td>${fmtCurrency(s.price)}</td>
        <td>${fmt(s.pe)}</td>
        <td>${fmt(s.priceToBook)}</td>
        <td>${fmtCurrency(s.yearLow)}</td>
        <td>${fmtCurrency(s.yearHigh)}</td>
      </tr>`).join('');
    cacheSet('undervalued', rows);
    setRows('undervalued-table', rows);
  } catch {
    const fallback = [
      { sym: 'BRK.B', name: 'Berkshire Hathaway',    price: 452.10, pe: 9.2,  pb: 1.5, low: 380.00, high: 480.00 },
      { sym: 'INTC',  name: 'Intel Corp',             price: 21.50,  pe: 8.1,  pb: 0.9, low: 18.51,  high: 35.00  },
      { sym: 'CVS',   name: 'CVS Health',             price: 58.20,  pe: 7.4,  pb: 1.1, low: 52.00,  high: 82.00  },
      { sym: 'WBA',   name: 'Walgreens Boots',        price: 10.80,  pe: 4.2,  pb: 0.6, low: 8.00,   high: 22.00  },
      { sym: 'T',     name: 'AT&T',                   price: 19.50,  pe: 9.8,  pb: 1.2, low: 15.00,  high: 22.00  },
      { sym: 'VZ',    name: 'Verizon',                price: 41.20,  pe: 9.1,  pb: 1.8, low: 38.00,  high: 46.00  },
      { sym: 'MO',    name: 'Altria Group',           price: 52.30,  pe: 9.5,  pb: 0.0, low: 40.00,  high: 57.00  },
      { sym: 'PFE',   name: 'Pfizer',                 price: 26.80,  pe: 11.2, pb: 1.4, low: 24.00,  high: 32.00  },
      { sym: 'KHC',   name: 'Kraft Heinz',            price: 30.10,  pe: 10.5, pb: 0.8, low: 28.00,  high: 38.00  },
      { sym: 'F',     name: 'Ford Motor',             price: 10.90,  pe: 6.3,  pb: 0.9, low: 9.00,   high: 14.00  },
      { sym: 'GM',    name: 'General Motors',         price: 47.50,  pe: 5.8,  pb: 0.8, low: 40.00,  high: 58.00  },
      { sym: 'BAC',   name: 'Bank of America',        price: 43.20,  pe: 12.1, pb: 1.2, low: 36.00,  high: 47.00  },
      { sym: 'C',     name: 'Citigroup',              price: 68.40,  pe: 10.3, pb: 0.7, low: 55.00,  high: 75.00  },
      { sym: 'WFC',   name: 'Wells Fargo',            price: 74.10,  pe: 12.8, pb: 1.4, low: 50.00,  high: 78.00  },
      { sym: 'USB',   name: 'US Bancorp',             price: 44.20,  pe: 11.5, pb: 1.3, low: 38.00,  high: 50.00  },
      { sym: 'HPQ',   name: 'HP Inc',                 price: 30.50,  pe: 8.9,  pb: 0.0, low: 28.00,  high: 38.00  },
      { sym: 'PARA',  name: 'Paramount Global',       price: 11.20,  pe: 7.1,  pb: 0.5, low: 9.00,   high: 16.00  },
      { sym: 'OXY',   name: 'Occidental Petroleum',   price: 48.30,  pe: 11.4, pb: 1.6, low: 44.00,  high: 68.00  },
      { sym: 'DVN',   name: 'Devon Energy',           price: 35.10,  pe: 8.7,  pb: 1.9, low: 30.00,  high: 50.00  },
      { sym: 'MPC',   name: 'Marathon Petroleum',     price: 155.00, pe: 9.3,  pb: 2.8, low: 140.00, high: 215.00 },
    ];
    const rows = fallback.map(s => `
      <tr>
        <td><span class="sym">${s.sym}</span></td>
        <td>${s.name}</td>
        <td>${fmtCurrency(s.price)}</td>
        <td>${fmt(s.pe)}</td>
        <td>${fmt(s.pb)}</td>
        <td>${fmtCurrency(s.low)}</td>
        <td>${fmtCurrency(s.high)}</td>
      </tr>`).join('');
    setRows('undervalued-table', rows + fallbackNote(7));
  }
}

// ─── Section 2: Upcoming IPOs ─────────────────────────────────────────────────
async function loadIPOs() {
  setRows('ipo-table', '<tr><td colspan="5" class="loading">Loading…</td></tr>');
  const cached = cacheGet('ipos');
  if (cached) { setRows('ipo-table', cached.data); return; }

  try {
    const data = await apiFetch(`${FMP}/ipo_calendar?from=${isoDate(0)}&to=${isoDate(60)}&apikey=${FMP_KEY}`);
    if (!data?.length) throw new Error('No IPOs');
    const rows = data.map(ipo => `
      <tr>
        <td>${ipo.company || '—'}</td>
        <td><span class="sym">${ipo.symbol || '—'}</span></td>
        <td>${ipo.exchange || '—'}</td>
        <td>${ipo.date || '—'}</td>
        <td>${ipo.priceRange || '—'}</td>
      </tr>`).join('');
    cacheSet('ipos', rows);
    setRows('ipo-table', rows);
  } catch {
    const fallback = [
      { company: 'Klarna',           symbol: 'KLAR', exchange: 'NYSE',   date: '2026-06-10', range: '$55–$60' },
      { company: 'Chime Financial',  symbol: 'CHYM', exchange: 'NASDAQ', date: '2026-06-18', range: '$28–$32' },
      { company: 'Cerebras Systems', symbol: 'CBRS', exchange: 'NASDAQ', date: '2026-07-02', range: '$40–$45' },
      { company: 'Medline Ind.',     symbol: 'MDLN', exchange: 'NYSE',   date: '2026-07-08', range: '$22–$26' },
      { company: 'Panera Brands',    symbol: 'PNRA', exchange: 'NASDAQ', date: '2026-07-15', range: '$18–$22' },
    ];
    const rows = fallback.map(i => `
      <tr>
        <td>${i.company}</td>
        <td><span class="sym">${i.symbol}</span></td>
        <td>${i.exchange}</td>
        <td>${i.date}</td>
        <td>${i.range}</td>
      </tr>`).join('');
    setRows('ipo-table', rows + fallbackNote(5));
  }
}

// ─── Section 3: Upcoming Earnings ────────────────────────────────────────────
async function loadEarnings() {
  setRows('earnings-table', '<tr><td colspan="5" class="loading">Loading…</td></tr>');
  const cached = cacheGet('earnings');
  if (cached) { setRows('earnings-table', cached.data); return; }

  try {
    const data = await apiFetch(`${FMP}/earning_calendar?from=${isoDate(0)}&to=${isoDate(60)}&apikey=${FMP_KEY}`);
    if (!data?.length) throw new Error('No earnings');
    const sorted = data
      .filter(e => e.revenueEstimated)
      .sort((a, b) => (b.revenueEstimated || 0) - (a.revenueEstimated || 0))
      .slice(0, 30);
    const rows = sorted.map(e => `
      <tr>
        <td><span class="sym">${e.symbol}</span></td>
        <td>${e.company || '—'}</td>
        <td>${e.date || '—'}</td>
        <td>${e.epsEstimated != null ? fmtCurrency(e.epsEstimated) : '—'}</td>
        <td>${e.revenueEstimated != null ? fmtB(e.revenueEstimated) : '—'}</td>
      </tr>`).join('');
    cacheSet('earnings', rows);
    setRows('earnings-table', rows);
  } catch {
    const fallback = [
      { sym: 'AAPL',  name: 'Apple Inc',          date: '2026-07-31', eps: '1.42', rev: '$94.2B'  },
      { sym: 'MSFT',  name: 'Microsoft',           date: '2026-07-23', eps: '3.10', rev: '$68.1B'  },
      { sym: 'GOOGL', name: 'Alphabet',            date: '2026-07-29', eps: '2.05', rev: '$89.5B'  },
      { sym: 'AMZN',  name: 'Amazon',              date: '2026-08-01', eps: '1.38', rev: '$158.0B' },
      { sym: 'META',  name: 'Meta Platforms',      date: '2026-07-30', eps: '5.20', rev: '$42.3B'  },
      { sym: 'NVDA',  name: 'NVIDIA',              date: '2026-08-20', eps: '0.68', rev: '$28.0B'  },
      { sym: 'TSLA',  name: 'Tesla',               date: '2026-07-22', eps: '0.52', rev: '$25.1B'  },
      { sym: 'JPM',   name: 'JPMorgan Chase',      date: '2026-07-14', eps: '4.80', rev: '$43.5B'  },
      { sym: 'V',     name: 'Visa',                date: '2026-07-22', eps: '2.55', rev: '$9.8B'   },
      { sym: 'JNJ',   name: 'Johnson & Johnson',   date: '2026-07-15', eps: '2.62', rev: '$22.4B'  },
      { sym: 'WMT',   name: 'Walmart',             date: '2026-08-19', eps: '0.72', rev: '$172.0B' },
      { sym: 'BAC',   name: 'Bank of America',     date: '2026-07-15', eps: '0.88', rev: '$25.2B'  },
      { sym: 'XOM',   name: 'ExxonMobil',          date: '2026-08-01', eps: '2.10', rev: '$88.0B'  },
      { sym: 'UNH',   name: 'UnitedHealth',        date: '2026-07-15', eps: '7.20', rev: '$98.5B'  },
      { sym: 'HD',    name: 'Home Depot',          date: '2026-08-12', eps: '4.55', rev: '$39.8B'  },
    ];
    const rows = fallback.map(e => `
      <tr>
        <td><span class="sym">${e.sym}</span></td>
        <td>${e.name}</td>
        <td>${e.date}</td>
        <td>$${e.eps}</td>
        <td>${e.rev}</td>
      </tr>`).join('');
    setRows('earnings-table', rows + fallbackNote(5));
  }
}

// ─── Section 4: Dividend Stocks ───────────────────────────────────────────────
async function loadDividends() {
  setRows('dividend-table', '<tr><td colspan="6" class="loading">Loading…</td></tr>');
  const cached = cacheGet('dividends');
  if (cached) { setRows('dividend-table', cached.data); return; }

  try {
    const data = await apiFetch(
      `${FMP}/stock-screener?dividendMoreThan=1&marketCapMoreThan=5000000000&limit=10&apikey=${FMP_KEY}`
    );
    if (!data?.length) throw new Error('No data');
    const rows = data.slice(0, 10).map(s => `
      <tr>
        <td><span class="sym">${s.symbol}</span></td>
        <td>${s.companyName || '—'}</td>
        <td>${fmtCurrency(s.price)}</td>
        <td class="up">${fmtPct(s.dividendYield * 100)}</td>
        <td>${fmtCurrency(s.lastAnnualDividend)}</td>
        <td>${s.payoutRatio != null ? fmtPct(s.payoutRatio * 100) : '—'}</td>
      </tr>`).join('');
    cacheSet('dividends', rows);
    setRows('dividend-table', rows);
  } catch {
    const fallback = [
      { sym: 'T',    name: 'AT&T',              price: 19.50,  yield: '6.15%', div: '$1.11', payout: '62%' },
      { sym: 'VZ',   name: 'Verizon',           price: 41.20,  yield: '6.40%', div: '$2.66', payout: '58%' },
      { sym: 'MO',   name: 'Altria Group',      price: 52.30,  yield: '8.20%', div: '$3.92', payout: '78%' },
      { sym: 'O',    name: 'Realty Income',     price: 55.80,  yield: '5.80%', div: '$3.07', payout: '75%' },
      { sym: 'KO',   name: 'Coca-Cola',         price: 68.40,  yield: '3.10%', div: '$1.94', payout: '72%' },
      { sym: 'PEP',  name: 'PepsiCo',           price: 148.20, yield: '3.50%', div: '$5.06', payout: '68%' },
      { sym: 'JNJ',  name: 'Johnson & Johnson', price: 155.00, yield: '3.20%', div: '$4.76', payout: '44%' },
      { sym: 'PFE',  name: 'Pfizer',            price: 26.80,  yield: '6.70%', div: '$1.68', payout: '45%' },
      { sym: 'IBM',  name: 'IBM',               price: 230.00, yield: '2.90%', div: '$6.68', payout: '65%' },
      { sym: 'ABBV', name: 'AbbVie',            price: 185.00, yield: '3.60%', div: '$6.20', payout: '52%' },
    ];
    const rows = fallback.map(s => `
      <tr>
        <td><span class="sym">${s.sym}</span></td>
        <td>${s.name}</td>
        <td>${fmtCurrency(s.price)}</td>
        <td class="up">${s.yield}</td>
        <td>${s.div}</td>
        <td>${s.payout}</td>
      </tr>`).join('');
    setRows('dividend-table', rows + fallbackNote(6));
  }
}

// ─── Column sorting ───────────────────────────────────────────────────────────
function makeSortable(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  table.querySelectorAll('th').forEach((th, col) => {
    th.addEventListener('click', () => {
      const asc = th.getAttribute('aria-sort') !== 'ascending';
      // Reset all headers
      table.querySelectorAll('th').forEach(h => h.removeAttribute('aria-sort'));
      th.setAttribute('aria-sort', asc ? 'ascending' : 'descending');

      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      // Skip single-cell utility rows (fallback note / loading)
      const dataRows = rows.filter(r => r.cells.length > 1);
      const noteRows = rows.filter(r => r.cells.length === 1);

      const parse = text => {
        const n = parseFloat(text.replace(/[$,%B]/g, ''));
        return isNaN(n) ? text.trim().toLowerCase() : n;
      };

      dataRows.sort((a, b) => {
        const va = parse(a.cells[col]?.textContent ?? '');
        const vb = parse(b.cells[col]?.textContent ?? '');
        if (va < vb) return asc ? -1 : 1;
        if (va > vb) return asc ? 1 : -1;
        return 0;
      });

      tbody.append(...dataRows, ...noteRows);
    });
  });
}

// ─── Load all + timestamp ─────────────────────────────────────────────────────
async function loadAll(force = false) {
  const btn = document.getElementById('refresh-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Refreshing…';

  if (force) cacheClear();

  // Show cached timestamp if available, otherwise "just now"
  const anyCache = cacheGet('undervalued') || cacheGet('ipos') || cacheGet('earnings') || cacheGet('dividends');
  updateTimestamp(anyCache?.ts ?? null);

  await Promise.all([loadUndervalued(), loadIPOs(), loadEarnings(), loadDividends()]);

  ['undervalued-table', 'ipo-table', 'earnings-table', 'dividend-table'].forEach(makeSortable);

  // After load, update timestamp to now (in case it was a fresh fetch)
  const freshCache = cacheGet('undervalued');
  updateTimestamp(freshCache?.ts ?? Date.now());

  btn.disabled = false;
  btn.textContent = '🔄 Refresh';
}

// ─── Source change clears cache and reloads ───────────────────────────────────
document.getElementById('source-select').addEventListener('change', () => loadAll(true));
document.getElementById('refresh-btn').addEventListener('click', () => loadAll(true));

loadAll();
