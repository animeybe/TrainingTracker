import { Component } from 'react';
import type { ErrorBoundaryProps, ErrorBoundaryState, ErrorInfo as ErrorInfoType } from '@/types';
import { InfoPage } from '@/pages/InfoPage';

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfoType) {
    console.error('🚨 ErrorBoundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <InfoPage type="error" />
      );
    }

    return this.props.children;
  }
}
