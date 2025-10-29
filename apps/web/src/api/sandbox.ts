import type { AxiosResponse } from 'axios';

import { httpClient } from './http';

export type SandboxResponse = {
  message: string;
};

export const sandboxSuccess = () =>
  httpClient<SandboxResponse, AxiosResponse<SandboxResponse>>({
    url: '/api/sandbox/success',
    method: 'GET',
  });

export const sandboxFailure = () =>
  httpClient<SandboxResponse, AxiosResponse<SandboxResponse>>({
    url: '/api/sandbox/failure',
    method: 'GET',
  });
