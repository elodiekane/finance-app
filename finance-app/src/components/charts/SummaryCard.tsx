interface SummaryCardProps {
  label: string;
  value: string;
  subValue?: string;
  positive?: boolean;
  negative?: boolean;
}

export function SummaryCard({
  label,
  value,
  subValue,
  positive,
  negative,
}: SummaryCardProps) {
  const valueColor = positive
    ? '#24a148'
    : negative
      ? '#da1e28'
      : '#161616';

  return (
    <div style={styles.card}>
      <span style={styles.label}>{label}</span>
      <span style={{ ...styles.value, color: valueColor }}>{value}</span>
      {subValue && (
        <span style={{ ...styles.subValue, color: valueColor }}>{subValue}</span>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    background: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    padding: '14px 16px',
    minWidth: '120px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: '#6f6f6f',
  },
  value: {
    fontSize: '22px',
    fontWeight: 700,
    lineHeight: 1.1,
  },
  subValue: {
    fontSize: '13px',
    fontWeight: 500,
  },
};
