import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Without this, an uncaught render error unmounts the whole React tree and
// leaves a blank white window with no clue why — exactly what happened when
// an old localStorage chat record without a threadName hit a .slice() call.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Kesto crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16, background: '#06060a', color: '#e8e8f0', fontFamily: 'monospace', padding: 40, textAlign: 'center',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Kesto hit an error</div>
          <div style={{ fontSize: 12, color: '#8888a0', maxWidth: 480 }}>{this.state.error.message}</div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 999, fontWeight: 600, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
