import { TIME_WINDOWS } from '../../constants';
import type { TimeWindow } from '../../types/finance';

interface TimeWindowTabsProps {
  active:   TimeWindow;
  onChange: (w: TimeWindow) => void;
}

export function TimeWindowTabs({ active, onChange }: TimeWindowTabsProps) {
  return (
    <div style={styles.bar} role="tablist" aria-label="Time window">
      {TIME_WINDOWS.map(({ label, value }) => (
        <button
          key={value}
          role="tab"
          aria-selected={active === value}
          onClick={() => onChange(value)}
          style={{
            ...styles.tab,
            ...(active === value ? styles.activeTab : {}),
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: '0',
  },
  tab: {
    padding: '8px 20px',
    border: 'none',
    borderBottom: '3px solid transparent',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: '#525252',
    fontFamily: 'inherit',
    transition: 'color 0.15s',
    marginBottom: '-1px',
  },
  activeTab: {
    color: '#0f62fe',
    borderBottomColor: '#0f62fe',
    fontWeight: 600,
  },
};
