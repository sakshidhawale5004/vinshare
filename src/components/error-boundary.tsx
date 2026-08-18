import React from "react";

export class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: '#fee', borderRadius: 8, fontSize: 12, overflow: 'auto', maxWidth: '100%', maxHeight: '100%' }}>
          <strong>3D Scene crashed:</strong><br />
          {this.state.error?.message}<br />
          {this.state.error?.stack}
        </div>
      );
    }
    return this.props.children;
  }
}
