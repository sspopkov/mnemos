import axios from 'axios';

export interface ApiError {
  message: string;
  code?: string;
}

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError<ApiError>(err)) {
    return (
      err.response?.data?.message ?? err.response?.statusText ?? err.message ?? 'Unexpected error'
    );
  }

  if (err instanceof Error) {
    return err.message;
  }

  return 'Unknown error';
}
