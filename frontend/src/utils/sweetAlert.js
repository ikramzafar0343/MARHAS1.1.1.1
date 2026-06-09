import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const dialogBase = {
  showCancelButton: true,
  cancelButtonText: 'Cancel',
  buttonsStyling: false,
  reverseButtons: true,
  focusCancel: true,
  backdrop: 'rgba(31, 31, 31, 0.45)',
  customClass: {
    popup: 'marhas-swal-popup',
    title: 'marhas-swal-title',
    htmlContainer: 'marhas-swal-text',
    actions: 'marhas-swal-actions',
    cancelButton: 'marhas-swal-btn marhas-swal-btn--cancel'
  }
};

export const confirmDialog = async ({
  title,
  text,
  confirmText = 'Confirm',
  danger = false
}) => {
  const result = await Swal.fire({
    ...dialogBase,
    title,
    text,
    confirmButtonText: confirmText,
    customClass: {
      ...dialogBase.customClass,
      confirmButton: danger
        ? 'marhas-swal-btn marhas-swal-btn--danger'
        : 'marhas-swal-btn marhas-swal-btn--confirm'
    }
  });

  return result.isConfirmed;
};

export const confirmDelete = (title, text) =>
  confirmDialog({
    title,
    text,
    confirmText: 'Delete',
    danger: true
  });
