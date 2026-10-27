/**
 * finance-app/server/proxy.ts
 *
 * Lightweight Express proxy that wraps yahoo-finance2.
 * Runs on port 3001 (configurable via PORT env var).
 * Vite dev server forwards /api/finance/* here.
 *
 * Routes
 *   GET /api/finance/quote/:symbol
 *   GET /api/finance/history/:symbol?window=day|7d|quarter
 *
 * Usage:
 *   npx ts-node --esm server/proxy.ts
 *   # or via the npm script: npm run proxy
 */

import express from 'express';
import cors from 'cors';
import YahooFinanceClass from 'yahoo-finance2';

// yahoo-finance2 v4 exports the class as the default — instantiate it once.
const yahooFinance = new YahooFinanceClass({
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
});

// ─── Window → date range ─────────────────────────────────────────────────────

type TimeWindow = 'day' | '7d' | 'quarter';

function windowToDates(window: TimeWindow): { period1: Date; period2: Date } {
  const now  = new Date();
  const from = new Date(now);

  if (window === 'day') {
    from.setDate(now.getDate() - 1);
  } else if (window === '7d') {
    from.setDate(now.getDate() - 7);
  } else {
    from.setDate(now.getDate() - 90); // ~one quarter
  }

  return { period1: from, period2: now };
}

// ─── Server ───────────────────────────────────────────────────────────────────

const app  = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

// ── GET /api/finance/quote/:symbol ────────────────────────────────────────────
app.get('/api/finance/quote/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    const result = await yahooFinance.quote(symbol, {
      fields: [
        'shortName',
        'longName',
        'currency',
        'fullExchangeName',
        'regularMarketPrice',
        'regularMarketChange',
        'regularMarketChangePercent',
        'regularMarketVolume',
        'regularMarketOpen',
        'regularMarketDayHigh',
        'regularMarketDayLow',
        'regularMarketPreviousClose',
        'regularMarketTime',
        'averageDailyVolume3Month',
        'marketCap',
        'fiftyTwoWeekHigh',
        'fiftyTwoWeekLow',
      ],
    });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[proxy] quote/${symbol}: ${message}`);
    res.status(502).json({ error: message });
  }
});

// ── GET /api/finance/history/:symbol?window=day|7d|quarter ───────────────────
app.get('/api/finance/history/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const window = (req.query.window as TimeWindow) ?? '7d';

  if (!['day', '7d', 'quarter'].includes(window)) {
    res.status(400).json({ error: `Invalid window: ${window}` });
    return;
  }

  const { period1, period2 } = windowToDates(window);

  try {
    // Use chart() — historical() is deprecated in yahoo-finance2 v4
    const result = await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval: '1d',
    });

    const quotes = result.quotes ?? [];

    // chart() returns timestamps as numbers (Unix seconds); serialise to ISO strings
    const serialised = quotes
      .filter((r: Record<string, unknown>) => r.close != null)
      .map((r: Record<string, unknown>) => ({
        date:    r.date instanceof Date
          ? r.date.toISOString()
          : typeof r.date === 'number'
            ? new Date((r.date as number) * 1000).toISOString()
            : String(r.date),
        open:    r.open,
        high:    r.high,
        low:     r.low,
        close:   r.close,
        adjClose: r.adjclose ?? r.adjClose,
        volume:  r.volume,
      }));

    res.json({ rows: serialised });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[proxy] history/${symbol}: ${message}`);
    res.status(502).json({ error: message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[proxy] Finance proxy listening on http://localhost:${PORT}`);
});

export default app;
