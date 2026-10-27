import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import type { HistoryPoint } from '../../types/finance';
import { TICKER_COLORS } from '../../constants';

interface PriceLineChartProps {
  /** All history points for all tickers, merged into a flat array */
  data:    HistoryPoint[];
  /** List of symbol strings to render as separate lines */
  symbols: string[];
  /** Use area fill instead of plain line (better for quarter view) */
  area?:   boolean;
  height?: number;
}

// Index signature so Recharts can access dynamic symbol keys
interface ChartRow {
  date: string;
  [symbol: string]: number | string;
}

function mergeToRows(data: HistoryPoint[], symbols: string[]): ChartRow[] {
  const byDate = new Map<string, ChartRow>();

  for (const point of data) {
    if (!symbols.includes(point.symbol)) continue;
    const existing: ChartRow = byDate.get(point.date) ?? { date: point.date };
    existing[point.symbol] = point.close;
    byDate.set(point.date, existing);
  }

  return Array.from(byDate.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  );
}

function formatDate(dateStr: string): string {
  // Use date-only string to avoid timezone shifting
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function PriceLineChart({
  data,
  symbols,
  area = false,
  height = 260,
}: PriceLineChartProps) {
  const rows = mergeToRows(data, symbols);

  if (rows.length === 0) {
    return (
      <div style={styles.empty}>No data available</div>
    );
  }

  const ChartComponent = area ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: unknown) => formatDate(String(v))}
          tick={{ fontSize: 11, fill: '#6f6f6f' }}
          minTickGap={30}
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: 11, fill: '#6f6f6f' }}
          tickFormatter={(v: unknown) => `$${Number(v).toFixed(0)}`}
          width={55}
        />
        <Tooltip
          formatter={(value: unknown, name: unknown) => [
            `$${Number(value).toFixed(2)}`,
            String(name),
          ]}
          labelFormatter={(label: unknown) => formatDate(String(label))}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />

        {symbols.map(sym => {
          const color = TICKER_COLORS[sym] ?? '#8884d8';
          if (area) {
            return (
              <Area
                key={sym}
                type="monotone"
                dataKey={sym}
                stroke={color}
                fill={color}
                fillOpacity={0.08}
                dot={false}
                strokeWidth={2}
                connectNulls
              />
            );
          }
          return (
            <Line
              key={sym}
              type="monotone"
              dataKey={sym}
              stroke={color}
              dot={false}
              strokeWidth={2}
              connectNulls
            />
          );
        })}
      </ChartComponent>
    </ResponsiveContainer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100px',
    color: '#6f6f6f',
    fontSize: '13px',
  },
};
