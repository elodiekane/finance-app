export function Header() {
  return (
    <div style={styles.inner}>
      <span style={styles.logo}>IBM</span>
      <h1 style={styles.title}>Market Dashboard</h1>
      <span style={styles.subtitle}>Finance Analytics Lab</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  inner: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    height: '48px',
  },
  logo: {
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: '#78a9ff',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#ffffff',
  },
  subtitle: {
    fontSize: '13px',
    color: '#8d8d8d',
    marginLeft: '4px',
  },
};
