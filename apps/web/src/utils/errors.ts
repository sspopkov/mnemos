import axios from 'axios';
import type { ApiError } from '../api';

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
