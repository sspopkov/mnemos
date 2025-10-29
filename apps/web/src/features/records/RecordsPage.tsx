import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import {
  useGetRecords,
  useCreateRecord,
  useUpdateRecord,
  useDeleteRecord,
  getGetRecordsQueryKey,
  type GetRecords200Item as ApiRecord,
  type Def0 as ApiError,
} from '../../api';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

import { getErrorMessage } from '../../utils/errors';
import { AlertDialog } from '../../components/AlertDialog';

type EditFormData = { title: string; content: string };

type EditState =
  | { mode: 'create'; data: EditFormData }
  | { mode: 'edit'; id: string; data: EditFormData }
  | null;

const RecordsPage = () => {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    data: rows = [],
    isLoading,
    isFetching,
    error,
  } = useGetRecords<ApiRecord[], ApiError>({
    query: {
      queryKey: getGetRecordsQueryKey(),
      select: (res) => res.data,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: false,
    },
  });

  const createMut = useCreateRecord({
    mutation: {
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: getGetRecordsQueryKey() });
        enqueueSnackbar('Запись создана', { variant: 'success' });
      },
      onError: (err) => {
        enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
      },
    },
  });

  const updateMut = useUpdateRecord({
    mutation: {
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: getGetRecordsQueryKey() });
        enqueueSnackbar('Запись обновлена', { variant: 'success' });
      },
      onError: (err) => {
        enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
      },
    },
  });

  const deleteMut = useDeleteRecord({
    mutation: {
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: getGetRecordsQueryKey() });
        enqueueSnackbar('Запись удалена', { variant: 'success' });
      },
      onError: (err) => {
        enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
      },
    },
  });

  const [edit, setEdit] = useState<EditState>(null);
  const isOpen = edit !== null;
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const title = useMemo(
    () => (!edit ? '' : edit.mode === 'create' ? 'Новая запись' : 'Редактирование'),
    [edit],
  );

  const loading =
    isLoading || isFetching || createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const errorText = error ? getErrorMessage(error) : null;

  const openCreate = () => setEdit({ mode: 'create', data: { title: '', content: '' } });

  const openEdit = (r: ApiRecord) =>
    setEdit({ mode: 'edit', id: r.id, data: { title: r.title, content: r.content ?? '' } });

  const onSubmit = async () => {
    if (!edit) return;
    try {
      if (edit.mode === 'create') {
        await createMut.mutateAsync({ data: edit.data });
      } else {
        await updateMut.mutateAsync({ id: edit.id, data: edit.data });
      }
      setEdit(null);
    } catch {
      // уведомление показывается в обработчике onError мутации
    }
  };

  const onDelete = (id: string) => {
    setDeleteId(id);
  };

  const closeDeleteDialog = () => setDeleteId(null);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync({ id: deleteId });
      setDeleteId(null);
    } catch {
      // уведомление показывается в обработчике onError мутации
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Записи
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={loading}>
          Добавить
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {errorText && <Box sx={{ color: 'error.main', mb: 2 }}>{errorText}</Box>}

      <Box
        sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Заголовок</TableCell>
              <TableCell>Контент</TableCell>
              <TableCell sx={{ width: 140 }} align="right">
                Действия
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell
                  sx={{
                    maxWidth: 280,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {r.title}
                </TableCell>
                <TableCell
                  sx={{
                    maxWidth: 420,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {r.content ?? '—'}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => openEdit(r)}
                    aria-label="Редактировать"
                    disabled={loading}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => onDelete(r.id)}
                    aria-label="Удалить"
                    disabled={deleteMut.isPending}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Пусто… Нажми «Добавить», чтобы создать первую запись.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <AlertDialog
        open={Boolean(deleteId)}
        title="Удалить запись?"
        description="Это действие нельзя будет отменить."
        confirmText="Удалить"
        confirmButtonColor="error"
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
        disableConfirm={deleteMut.isPending}
        disableCancel={deleteMut.isPending}
      />

      <Dialog open={isOpen} onClose={() => setEdit(null)} fullWidth maxWidth="sm">
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Заголовок"
              value={edit?.data.title ?? ''}
              onChange={(e) =>
                setEdit((prev) =>
                  prev ? { ...prev, data: { ...prev.data, title: e.target.value } } : prev,
                )
              }
              autoFocus
              required
              disabled={createMut.isPending || updateMut.isPending}
            />
            <TextField
              label="Контент"
              value={edit?.data.content ?? ''}
              onChange={(e) =>
                edit && setEdit({ ...edit, data: { ...edit.data, content: e.target.value } })
              }
              multiline
              minRows={3}
              disabled={createMut.isPending || updateMut.isPending}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEdit(null)}
            disabled={createMut.isPending || updateMut.isPending}
          >
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={!edit?.data.title?.trim() || createMut.isPending || updateMut.isPending}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RecordsPage;
