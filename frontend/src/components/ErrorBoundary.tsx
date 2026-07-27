import { Component, type ErrorInfo, type ReactNode } from 'react';
import '../stylesheets/ErrorBoundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback UI to render instead of the default. */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Reusable error boundary. Catches render/lifecycle errors in its subtree and
 * shows a friendly fallback instead of letting the whole app crash.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // No backend/logging service; surface to the console for debugging.
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary" role="alert">
          <h1 className="error-boundary-title">Something went wrong</h1>
          <p className="error-boundary-text">
            Sorry, an unexpected error occurred. Try reloading the page, or head back to the home
            page.
          </p>
          <div className="error-boundary-actions">
            <button type="button" className="button" onClick={this.handleReload}>
              Reload page
            </button>
            <a className="button" href="/">
              Go home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
