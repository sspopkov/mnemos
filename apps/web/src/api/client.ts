import {
  AxiosError,
  type ErrorResponse,
  type RecordCreateInput,
  type RecordDto,
  type RecordUpdateInput,
  MnemosApiClient,
} from '@mnemos/types';

const apiClient = MnemosApiClient.create();

export type RecordItem = RecordDto;

export const RecordsApi = {
  list: () => apiClient.listRecords(),
  create: (data: RecordCreateInput) => apiClient.createRecord(data),
  update: (id: string, data: RecordUpdateInput) => apiClient.updateRecord(id, data),
  remove: (id: string) => apiClient.deleteRecord(id),
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ErrorResponse | undefined;
    return data?.error ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Неизвестная ошибка';
}
