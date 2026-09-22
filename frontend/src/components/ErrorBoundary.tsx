import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  resetKey?: string;
}

interface State {
  hasError: boolean;
  lastResetKey?: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, lastResetKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.lastResetKey) {
      return { hasError: false, lastResetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-sand-50">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl mb-3">This page didn't load</h1>
          <p className="text-charcoal-700/70 mb-8">
            Something broke while rendering. Reloading usually fixes it. If it keeps
            happening, let us know what you were doing.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => window.location.reload()} className="btn-primary">
              Reload the page
            </button>
            <a href="/" className="btn-secondary">
              Go to home
            </a>
          </div>
        </div>
      </div>
    );
  }
}