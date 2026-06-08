import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Zema] Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', background: '#111',
          color: '#fff', padding: '24px', textAlign: 'center', gap: '16px'
        }}>
          <span className="material-symbols-rounded" style={{ fontSize: '3rem', color: '#ff5500' }}>
            error
          </span>
          <h2 style={{ margin: 0 }}>Something went wrong</h2>
          <p style={{ color: '#999', fontSize: '0.9rem', maxWidth: '300px' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{
              background: '#ff5500', border: 'none', color: '#fff',
              padding: '12px 24px', borderRadius: '8px', fontWeight: 700,
              fontSize: '1rem', cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
