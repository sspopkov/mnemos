import { type ReactNode } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, type ButtonProps } from '@mui/material';

export type AlertDialogProps = {
  open: boolean;
  title?: ReactNode;
  description?: ReactNode;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  confirmButtonColor?: ButtonProps['color'];
  confirmButtonVariant?: ButtonProps['variant'];
  onConfirm?: () => void;
  onCancel?: () => void;
  disableConfirm?: boolean;
  disableCancel?: boolean;
};

export const AlertDialog = ({
  open,
  title,
  description,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  confirmButtonColor = 'primary',
  confirmButtonVariant = 'contained',
  onConfirm,
  onCancel,
  disableConfirm,
  disableCancel,
}: AlertDialogProps) => (
  <Dialog open={open} onClose={onCancel} aria-labelledby="alert-dialog-title">
    {title && <DialogTitle id="alert-dialog-title">{title}</DialogTitle>}
    {description && <DialogContent>{description}</DialogContent>}
    <DialogActions>
      <Button onClick={onCancel} disabled={disableCancel} color="inherit">
        {cancelText}
      </Button>
      <Button
        onClick={onConfirm}
        color={confirmButtonColor}
        variant={confirmButtonVariant}
        disabled={disableConfirm}
      >
        {confirmText}
      </Button>
    </DialogActions>
  </Dialog>
);

export default AlertDialog;
