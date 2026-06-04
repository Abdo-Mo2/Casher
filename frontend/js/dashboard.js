import { getStats, getOrders } from './api.js'
import { toastError } from './alerts.js'

let chartInstance = null

function formatDateLabel(dateStr) {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

function renderChart(daily) {
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
    tbody.innerHTML = '<tr><td colspan="5">لا توجد طلبات</td></tr>'
    return
  }
  tbody.innerHTML = orders
    .map((o) => {
      const itemCount = o.items.reduce((s, i) => s + i.quantity, 0)
      const date = new Date(o.createdAt).toLocaleString('ar-EG')
      return `
      <tr>
        <td>#${o.orderNumber}</td>
        <td>${o.cashierName || '—'}</td>
        <td>${itemCount}</td>
        <td>${o.total} جنيه</td>
        <td>${date}</td>
      </tr>`
    })
    .join('')
}

async function init() {
  try {
    const [stats, orders] = await Promise.all([getStats(), getOrders(20)])
    document.getElementById('today-count').textContent = stats.todayCount
    document.getElementById('today-revenue').textContent = stats.todayRevenue
    document.getElementById('total-count').textContent = stats.totalCount
    document.getElementById('total-revenue').textContent = stats.totalRevenue
    renderChart(stats.daily)
    renderOrders(orders)
  } catch {
    toastError('تعذر تحميل البيانات')
    document.getElementById('orders-tbody').innerHTML =
      '<tr><td colspan="5">تعذر تحميل البيانات</td></tr>'
  }
}

init()
