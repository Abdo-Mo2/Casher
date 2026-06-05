window.FastPOS = window.FastPOS || {}

;(function () {
  const FP = window.FastPOS

  function escapeCsv(val) {
    const s = String(val ?? '')
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  function itemsSummary(items) {
    return items.map((i) => `${i.name}×${i.quantity}`).join(' | ')
  }

  FP.downloadOrdersCSV = async (scope = 'all') => {
    let orders = await FP.getOrders(0)
    if (scope === 'today') {
      orders = await FP.getOrdersForDate(new Date())
    }
    const header = [
      'رقم_الطلب',
      'التاريخ',
      'الكاشير',
      'نوع_الطلب',
      'طريقة_الدفع',
      'رقم_الطاولة',
      'الإجمالي',
      'الأصناف'
    ]
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString('ar-EG'),
      o.cashierName,
      FP.labelOrderType(o.orderType),
      FP.labelPayment(o.paymentType),
      o.tableNumber || '',
      o.total,
      itemsSummary(o.items)
    ])
    const bom = '\uFEFF'
    const csv =
      bom +
      [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    const suffix = scope === 'today' ? `today-${date}` : `all-${date}`
    a.href = URL.createObjectURL(blob)
    a.download = `fastpos-sales-${suffix}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    return orders.length
  }

  FP.buildClosingReportHTML = async () => {
    const closing = await FP.getDailyClosing()
    const settings = await FP.getSettings()
    const dateStr = closing.date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const paymentRows = Object.entries(FP.PAYMENT_TYPES)
      .map(
        ([k, label]) =>
          `<tr><td>${label}</td><td>${closing.byPayment[k] || 0} جنيه</td></tr>`
      )
      .join('')

    const orderTypeRows = Object.entries(FP.ORDER_TYPES)
      .map(
        ([k, label]) =>
          `<tr><td>${label}</td><td>${closing.byOrderType[k] || 0} جنيه</td></tr>`
      )
      .join('')

    const orderList =
      closing.orders.length === 0
        ? '<p>لا توجد طلبات اليوم</p>'
        : `<table class="closing-table">
        <thead><tr>
          <th>#</th><th>الوقت</th><th>النوع</th><th>الدفع</th><th>طاولة</th><th>الإجمالي</th>
        </tr></thead>
        <tbody>${closing.orders
          .map((o) => {
            const t = new Date(o.createdAt).toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit'
            })
            return `<tr>
              <td>${o.orderNumber}</td>
              <td>${t}</td>
              <td>${FP.labelOrderType(o.orderType)}</td>
              <td>${FP.labelPayment(o.paymentType)}</td>
              <td>${o.tableNumber || '—'}</td>
              <td>${o.total} جنيه</td>
            </tr>`
          })
          .join('')}</tbody></table>`

    return `
      <div class="closing-report receipt-print">
        <h2>${settings.shopName}</h2>
        <p class="closing-subtitle">تقرير إغلاق يومي</p>
        <p>${dateStr}</p>
        <hr>
        <div class="closing-summary">
          <p><strong>عدد الطلبات:</strong> ${closing.orderCount}</p>
          <p><strong>إجمالي الإيرادات:</strong> ${closing.totalRevenue} جنيه</p>
        </div>
        <h3>حسب طريقة الدفع</h3>
        <table class="closing-table">${paymentRows}</table>
        <h3>حسب نوع الطلب</h3>
        <table class="closing-table">${orderTypeRows}</table>
        <h3>تفاصيل الطلبات</h3>
        ${orderList}
        <p class="closing-footer">تم الإنشاء: ${new Date().toLocaleString('ar-EG')}</p>
      </div>`
  }

  FP.printDailyClosing = async () => {
    let host = document.getElementById('closing-print-host')
    if (!host) {
      host = document.createElement('div')
      host.id = 'closing-print-host'
      host.className = 'closing-print-host'
      document.body.appendChild(host)
    }
    host.innerHTML = await FP.buildClosingReportHTML()
    host.classList.add('active')
    document.body.classList.add('printing-closing')
    window.print()
    setTimeout(() => {
      document.body.classList.remove('printing-closing')
      host.classList.remove('active')
      host.innerHTML = ''
    }, 500)
  }
})()
