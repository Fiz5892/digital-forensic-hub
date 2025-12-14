import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    // Clear any corrupted state
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    
    // Reload the page
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-2xl w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-destructive/10">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Something went wrong</h1>
              <p className="text-muted-foreground">
                The application encountered an unexpected error. Please try refreshing the page.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 rounded-lg bg-muted/50 text-left">
                <p className="text-sm font-mono text-destructive mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">
                      Stack trace (click to expand)
                    </summary>
                    <pre className="mt-2 overflow-auto p-2 bg-background rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>
              <Button
                onClick={this.handleReset}
                className="gap-2"
              >
                Reset & Go Home
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              If this problem persists, please contact support with the error details above.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}