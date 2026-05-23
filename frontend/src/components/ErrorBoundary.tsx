import React from 'react';

interface ErrorBoundaryState {
  error: Error | null;
  componentStack: string;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    error: null,
    componentStack: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      error,
      componentStack: '',
    };
  }

  public componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Frontend render crashed', error, info);
    this.setState({
      error,
      componentStack: info.componentStack,
    });
  }

  public render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'sans-serif', color: '#111827' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Frontend render failed</h1>
          <p style={{ marginBottom: 12 }}>{this.state.error.message}</p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f3f4f6', padding: 12, borderRadius: 8 }}>
            {this.state.componentStack || 'No component stack available'}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
