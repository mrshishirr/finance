# Finance Dashboard

A static finance dashboard hosted on GitHub Pages showing:

- **Top 20 Undervalued Stocks** — screened by low P/E (<15), positive earnings, large cap
- **Upcoming IPOs** — companies going public in the next 60 days
- **Upcoming Earnings** — notable companies reporting in the next 60 days
- **Top 10 Dividend Stocks** — consistent high-yield payers over the last 3 years

## Live Demo

`https://<your-username>.github.io/<repo-name>/`

## Setup

### 1. Enable GitHub Pages

1. Go to **Settings → Pages**
2. Set **Source** to `GitHub Actions`
3. Push to `main` — the workflow deploys automatically

### 2. (Optional) Add a Free API Key for Live Data

The site works out of the box with curated static data. For live data:

1. Get a free key at [financialmodelingprep.com](https://financialmodelingprep.com/register) (250 req/day free)
2. Open `app.js` and replace:
   ```js
   const FMP_KEY = 'demo';
   ```
   with:
   ```js
   const FMP_KEY = 'your_key_here';
   ```

## Files

```
index.html   — page structure
style.css    — dark theme styling
app.js       — data fetching + fallback static data
.github/workflows/deploy.yml — GitHub Actions deployment
```

## Disclaimer

Data is for informational purposes only. Not financial advice.
