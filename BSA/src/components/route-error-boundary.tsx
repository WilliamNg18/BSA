import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export class RouteErrorBoundary extends Component<
  { children: ReactNode; pathname: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[View Error] ${this.props.pathname}`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section role="alert" className="mx-auto max-w-3xl space-y-3 rounded-lg border p-6">
          <h1 className="text-xl font-semibold">This view could not be loaded</h1>
          <p>Your session is still available. Return to the queue to choose a case.</p>
          <Button asChild variant="outline"><Link to="/queue">Go to the queue</Link></Button>
        </section>
      );
    }
    return this.props.children;
  }
}