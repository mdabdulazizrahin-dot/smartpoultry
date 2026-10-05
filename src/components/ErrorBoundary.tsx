import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crash:', error, info);
  }

  private reset = async () => {
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-sm space-y-3">
          <div className="text-4xl">🐔</div>
          <h1 className="text-lg font-semibold text-foreground">অ্যাপটি চালু হতে সমস্যা হয়েছে</h1>
          <p className="text-sm text-muted-foreground">
            নিচের বোতামে চাপ দিয়ে আবার চেষ্টা করুন। আপনার হিসাব সংরক্ষিত আছে।
          </p>
          <button
            onClick={this.reset}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            আবার চেষ্টা করুন
          </button>
          <p className="text-[11px] text-muted-foreground break-words">{this.state.error.message}</p>
        </div>
      </div>
    );
  }
}
