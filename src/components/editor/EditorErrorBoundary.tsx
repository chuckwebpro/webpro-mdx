import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class EditorErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Editor render failed:', error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.children !== this.props.children && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="editor-error-boundary">
          <h3>Editor failed to load this article</h3>
          <p>{this.state.error.message}</p>
          <p className="editor-error-hint">
            Try reloading the app. If the problem persists, the article body may contain
            invalid MDX.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
