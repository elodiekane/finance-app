import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { HistoryPoint } from '../../types/finance';
import { TICKER_COLORS } from '../../constants';
import { toNormalisedRows } from '../../utils/chartMath';

interface NormalisedLineChartProps {
  /** Flat array of all HistoryPoints for every ticker to display */
  data:    HistoryPoint[];
  symbols: string[];
  height?: number;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NormalisedLineChart({
  data,
  symbols,
  height = 280,
}: NormalisedLineChartProps) {
  const rows = toNormalisedRows(data, symbols);

  if (rows.length === 0) {
    return (
      <div style={styles.empty}>No data available</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <ReferenceLine y={0} stroke="#8d8d8d" strokeDasharray="4 4" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: unknown) => formatDate(String(v))}
          tick={{ fontSize: 11, fill: '#6f6f6f' }}
          minTickGap={28}
        />
        <YAxis
          tickFormatter={(v: unknown) => `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(1)}%`}
          tick={{ fontSize: 11, fill: '#6f6f6f' }}
          width={58}
        />
        <Tooltip
          formatter={(value: unknown, name: unknown) => {
            const n = Number(value);
            return [`${n >= 0 ? '+' : ''}${n.toFixed(2)}%`, String(name)];
          }}
          labelFormatter={(label: unknown) => formatDate(String(label))}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        {symbols.map(sym => (
          <Line
            key={sym}
            type="monotone"
            dataKey={sym}
            stroke={TICKER_COLORS[sym] ?? '#8884d8'}
            dot={false}
            strokeWidth={2}
            connectNulls
          />
        ))}
      </LineChart>
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
