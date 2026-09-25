import React, { Component, ErrorInfo, ReactNode } from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./styles/globals.css"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught TrustLink error:", error, errorInfo)
    this.setState({ error, errorInfo })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-zinc-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-lg">
                ⚠️
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-100">
                  TrustLink Runtime Exception
                </h2>
                <p className="text-xs text-zinc-400">
                  Caught by top-level error boundary
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/60 border border-zinc-800 text-xs font-mono text-rose-300 break-words whitespace-pre-wrap max-h-48 overflow-y-auto">
              {this.state.error?.message || "Unknown error occurred"}
              {this.state.error?.stack && (
                <div className="mt-2 text-[10px] text-zinc-500">
                  {this.state.error.stack}
                </div>
              )}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
