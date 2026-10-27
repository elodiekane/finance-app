import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message:  string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message:  error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.wrapper} role="alert">
          <h2 style={styles.title}>Something went wrong</h2>
          <p style={styles.message}>{this.state.message}</p>
          <button
            style={styles.button}
            onClick={() => this.setState({ hasError: false, message: '' })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: '#fff1f1',
    border: '1px solid #ffb3b3',
    borderRadius: '8px',
    padding: '32px',
    textAlign: 'center',
    margin: '40px auto',
    maxWidth: '480px',
  },
  title: {
    color: '#da1e28',
    margin: '0 0 8px',
    fontSize: '18px',
  },
  message: {
    color: '#525252',
    fontSize: '14px',
    marginBottom: '20px',
  },
  button: {
    padding: '8px 20px',
    background: '#0f62fe',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
