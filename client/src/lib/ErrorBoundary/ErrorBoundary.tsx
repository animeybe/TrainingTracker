import type { ErrorType } from "@/shared/ui/components/ErrorUI/model/types";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "../utils/logger";
import { InfoPage } from "@/shared/ui/components/ErrorUI/ui/InfoPage";

interface ErrorState {
  hasError: boolean;
  errorType: ErrorType;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorType: "500" };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorState> {
    // Классифицируем React ошибки
    if (error.message.includes("Cannot read properties of undefined")) {
      return { hasError: true, errorType: "500" };
    }
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return { hasError: true, errorType: "network" };
    }
    return { hasError: true, errorType: "500" };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("React ErrorBoundary", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, errorType: "500", error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <InfoPage
          type={this.state.errorType}
          errorText={this.state.error?.message}
          retryAction={this.resetError}
          showBackButton
        />
      );
    }

    return this.props.children;
  }
}
