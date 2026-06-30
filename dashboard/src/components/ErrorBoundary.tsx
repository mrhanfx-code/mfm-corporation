import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#0a0f1e',
          color: '#f3f4f6',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h2>
          <p style={{ marginBottom: '1.5rem', color: '#9ca3af' }}>
            The dashboard encountered an error. Please try refreshing the page.
          </p>
          {this.state.error && (
            <details style={{ 
              marginBottom: '1.5rem', 
              textAlign: 'left',
              background: '#111827',
              padding: '1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              maxWidth: '600px'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Error details</summary>
              <pre style={{ margin: 0, overflow: 'auto', color: '#ef4444' }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleRetry}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
