export type ErrorType =
  | "loading"
  | "empty"
  | "404"
  | "500"
  | "503"
  | "network"
  | "auth"
  | "permission-denied";

export interface InfoPageProps {
  type: ErrorType;
  title?: string;
  message?: string;
  errorText?: string;
  retryAction?: () => void;
  showBackButton?: boolean;
}

export interface ApiError {
  type: ErrorType;
  message: string;
  status?: number;
}
