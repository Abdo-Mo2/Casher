window.FastPOS = window.FastPOS || {}

window.FastPOS.PAYMENT_TYPES = {
  cash: 'نقدي',
  card: 'بطاقة',
  delivery: 'دليفري'
}

window.FastPOS.ORDER_TYPES = {
  dinein: 'صالة',
  takeaway: 'تيك أواي',
  delivery: 'دليفري'
}

window.FastPOS.labelPayment = (key) =>
  window.FastPOS.PAYMENT_TYPES[key] || key || '—'

window.FastPOS.labelOrderType = (key) =>
  window.FastPOS.ORDER_TYPES[key] || key || '—'
