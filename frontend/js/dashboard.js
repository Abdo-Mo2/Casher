;(function () {
  const FP = window.FastPOS
  let chartInstance = null

  function formatDateLabel(dateStr) {
    const [, month, day] = dateStr.split('-')
    return `${day}/${month}`
  }

  function renderChart(daily) {
    if (!window.Chart) return
    const ctx = document.getElementById('orders-chart')
    const labels = daily.map((d) => formatDateLabel(d.date))
    const data = daily.map((d) => d.count)

    if (chartInstance) chartInstance.destroy()

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'عدد الطلبات',
          data,
          backgroundColor: '#FF6B35',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    })
  }

  function renderOrders(orders) {
    const tbody = document.getElementById('orders-tbody')
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="6">لا توجد طلبات</td></tr>'
      return
    }
    tbody.innerHTML = orders
      .map((o) => {
        const date = new Date(o.createdAt).toLocaleString('ar-EG')
        return `
      <tr>
        <td>#${o.orderNumber}</td>
        <td>${FP.labelOrderType(o.orderType)}</td>
        <td>${FP.labelPayment(o.paymentType)}</td>
        <td>${o.cashierName || '—'}</td>
        <td>${o.total} جنيه</td>
        <td>${date}</td>
      </tr>`
      })
      .join('')
  }

  function updateBackupInfo(products, orders) {
    const el = document.getElementById('backup-info')
    if (el) el.textContent = `البيانات الحالية: ${products} منتج، ${orders} طلب`
  }

  async function loadClosingPreview() {
    const el = document.getElementById('closing-preview')
    if (!el || !FP.buildClosingReportHTML) return
    const closing = await FP.getDailyClosing()
    el.innerHTML = `
      <p><strong>اليوم:</strong> ${closing.orderCount} طلب — ${closing.totalRevenue} جنيه</p>
      <p class="closing-preview-mini">نقدي: ${closing.byPayment.cash} · بطاقة: ${closing.byPayment.card} · دليفري: ${closing.byPayment.delivery}</p>
    `
  }

  async function loadSettings() {
    const s = await FP.getSettings()
    document.getElementById('shop-name').value = s.shopName === 'FastPOS' ? '' : s.shopName
    document.getElementById('shop-phone').value = s.shopPhone
    document.getElementById('shop-address').value = s.shopAddress
    FP.applyShopBranding?.()
  }

  async function loadDashboard() {
    const [stats, orders, products] = await Promise.all([
      FP.getStats(),
      FP.getOrders(20),
      FP.getProducts()
    ])
    document.getElementById('today-count').textContent = stats.todayCount
    document.getElementById('today-revenue').textContent = stats.todayRevenue
    document.getElementById('total-count').textContent = stats.totalCount
    document.getElementById('total-revenue').textContent = stats.totalRevenue
    renderChart(stats.daily)
    renderOrders(orders)
    updateBackupInfo(products.length, stats.totalCount)
    await loadClosingPreview()
  }

  document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    try {
      await FP.saveSettings({
        shopName: document.getElementById('shop-name').value.trim() || 'FastPOS',
        shopPhone: document.getElementById('shop-phone').value.trim(),
        shopAddress: document.getElementById('shop-address').value.trim()
      })
      FP.toastSuccess('تم حفظ إعدادات المحل')
      FP.applyShopBranding?.()
    } catch (err) {
      FP.toastError(err.message)
    }
  })

  document.getElementById('export-backup-btn')?.addEventListener('click', async () => {
    try {
      const data = await FP.downloadBackup()
      FP.toastSuccess(`تم التصدير (${data.products.length} منتج، ${data.orders.length} طلب)`)
    } catch (err) {
      FP.toastError(err.message)
    }
  })

  document.getElementById('import-backup-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    const ok = await FP.confirmDelete(
      'استعادة النسخة الاحتياطية؟ سيتم استبدال كل المنتجات والطلبات الحالية.'
    )
    if (!ok) return
    try {
      const data = JSON.parse(await file.text())
      const result = await FP.importBackup(data)
      FP.toastSuccess(`تمت الاستعادة (${result.products} منتج، ${result.orders} طلب)`)
      await loadSettings()
      await loadDashboard()
    } catch (err) {
      FP.toastError(err.message || 'فشلت الاستعادة')
    }
  })

  document.getElementById('export-csv-today')?.addEventListener('click', async () => {
    try {
      const n = await FP.downloadOrdersCSV('today')
      FP.toastSuccess(`تم تصدير ${n} طلب (اليوم)`)
    } catch (err) {
      FP.toastError(err.message)
    }
  })

  document.getElementById('export-csv-all')?.addEventListener('click', async () => {
    try {
      const n = await FP.downloadOrdersCSV('all')
      FP.toastSuccess(`تم تصدير ${n} طلب`)
    } catch (err) {
      FP.toastError(err.message)
    }
  })

  document.getElementById('print-closing-btn')?.addEventListener('click', async () => {
    try {
      await FP.printDailyClosing()
    } catch (err) {
      FP.toastError(err.message)
    }
  })

  loadSettings()
  loadDashboard().catch(() => {
    FP.toastError('تعذر تحميل البيانات')
    document.getElementById('orders-tbody').innerHTML =
      '<tr><td colspan="6">تعذر تحميل البيانات</td></tr>'
  })
})()
