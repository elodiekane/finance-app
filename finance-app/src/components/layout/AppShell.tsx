import type { ReactNode } from 'react';

interface AppShellProps {
  header: ReactNode;
  children: ReactNode;
}

export function AppShell({ header, children }: AppShellProps) {
  return (
    <div style={styles.shell}>
      <header style={styles.header}>{header}</header>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f4f4f4',
    fontFamily: '-apple-system, "Segoe UI", system-ui, sans-serif',
  },
  header: {
    backgroundColor: '#161616',
    color: '#ffffff',
    padding: '0 24px',
  },
  main: {
    flex: 1,
    padding: '24px',
    maxWidth: '1280px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
};
