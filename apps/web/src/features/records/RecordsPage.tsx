import { useEffect, useMemo, useState } from 'react';
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
  deleteApiRecordsId,
  getApiRecords,
  postApiRecords,
  putApiRecordsId,
  type RecordItem as ApiRecordItem,
} from '../../api/generated';

type RecordItem = ApiRecordItem;

type EditFormData = { title: string; content: string };

// единый тип состояния
type EditState =
  | { mode: 'create'; data: EditFormData }
  | { mode: 'edit'; id: string; data: EditFormData }
  | null;

export default function RecordsPage() {
  const [rows, setRows] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [edit, setEdit] = useState<EditState>(null);
  const isOpen = Boolean(edit);

  const title = useMemo(() => {
    if (!edit) return '';
    return edit.mode === 'create' ? 'Новая запись' : 'Редактирование';
  }, [edit]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await getApiRecords();
      setRows(data);
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function openCreate() {
    setEdit({ mode: 'create', data: { title: '', content: '' } });
  }

  function openEdit(r: RecordItem) {
    setEdit({ mode: 'edit', id: r.id, data: { title: r.title, content: r.content ?? '' } });
  }

  async function onSubmit() {
    if (!edit) return;
    try {
      setLoading(true);
      if (edit.mode === 'create') {
        await postApiRecords(edit.data);
      } else {
        await putApiRecordsId(edit.id, edit.data);
      }
      setEdit(null);
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Удалить запись?')) return;
    try {
      setLoading(true);
      await deleteApiRecordsId(id);
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? 'Ошибка удаления');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Записи
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Добавить
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Box sx={{ color: 'error.main', mb: 2 }}>{error}</Box>}

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
                  <IconButton size="small" onClick={() => openEdit(r)} aria-label="Редактировать">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => onDelete(r.id)}
                    aria-label="Удалить"
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
            />
            <TextField
              label="Контент"
              value={edit?.data.content ?? ''}
              onChange={(e) =>
                edit && setEdit({ ...edit, data: { ...edit.data, content: e.target.value } })
              }
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEdit(null)}>Отмена</Button>
          <Button variant="contained" onClick={onSubmit} disabled={!edit?.data.title?.trim()}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
