interface DataSourceBadgeProps {
  isMock: boolean;
}

export function DataSourceBadge({ isMock }: DataSourceBadgeProps) {
  return (
    <span
      role="status"
      style={{ ...styles.badge, ...(isMock ? styles.mock : styles.live) }}
    >
      {isMock ? 'MOCK DATA' : 'LIVE DATA'}
    </span>
  );
}

const styles: Record<string, React.CSSProperties> = {
  badge: {
    marginLeft: 'auto',
    padding: '2px 10px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  },
  mock: {
    backgroundColor: '#f1c21b',
    color: '#161616',
  },
  live: {
    backgroundColor: '#24a148',
    color: '#ffffff',
  },
};
