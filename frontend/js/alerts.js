import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11.14.5/+esm'

const swalBase = {
  confirmButtonColor: '#FF6B35',
  cancelButtonColor: '#E0E0E0',
  customClass: { confirmButton: 'btn', cancelButton: 'btn btn-secondary' }
}

export function toastSuccess(title) {
  return Swal.fire({
    ...swalBase,
    icon: 'success',
    title,
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true
  })
}

export function toastError(title) {
  return Swal.fire({
    ...swalBase,
    icon: 'error',
    title,
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 3000
  })
}

export function showError(title, text = '') {
  return Swal.fire({ ...swalBase, icon: 'error', title, text })
}

export function showSuccess(title, text = '') {
  return Swal.fire({ ...swalBase, icon: 'success', title, text })
}

export async function confirmDelete(title = 'هل تريد الحذف؟') {
  const result = await Swal.fire({
    ...swalBase,
    title,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'نعم، احذف',
    cancelButtonText: 'إلغاء'
  })
  return result.isConfirmed
}
