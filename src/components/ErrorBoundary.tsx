import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg px-4">
          <div className="flex flex-col items-center animate-fade-in max-w-md text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-critical/10 text-critical">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-[24px] font-medium text-text-primary">Something went wrong</h2>
            <p className="mt-3 text-[14px] text-text-secondary leading-relaxed">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-surface-2 px-6 text-[14px] font-medium text-text-primary transition-colors hover:bg-surface-3"
            >
              <RotateCcw size={16} />
              Start Over
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
