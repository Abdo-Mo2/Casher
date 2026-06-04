const Order = require('../models/Order')

exports.getAll = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 0
    let query = Order.find().sort({ createdAt: -1 })
    if (limit > 0) query = query.limit(limit)
    const orders = await query
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.create = async (req, res) => {
  try {
    const cashierName = req.body.cashierName?.trim()
    if (!cashierName) {
      return res.status(400).json({ message: 'اسم الكاشير مطلوب' })
    }
    const order = await Order.create({ ...req.body, cashierName })
    res.status(201).json(order)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.getStats = async (req, res) => {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [todayStats, totalStats, dailyRaw] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfToday } } },
        {
          $group: {
            _id: null,
            todayCount: { $sum: 1 },
            todayRevenue: { $sum: '$total' }
          }
        }
      ]),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            totalRevenue: { $sum: '$total' }
          }
        }
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$total' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ])

    const today = todayStats[0] || { todayCount: 0, todayRevenue: 0 }
    const total = totalStats[0] || { totalCount: 0, totalRevenue: 0 }

    const dailyMap = {}
    dailyRaw.forEach((d) => {
      dailyMap[d._id] = { count: d.count, revenue: d.revenue }
    })

    const daily = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      daily.push({
        date: key,
        count: dailyMap[key]?.count || 0,
        revenue: dailyMap[key]?.revenue || 0
      })
    }

    res.json({
      todayCount: today.todayCount,
      todayRevenue: today.todayRevenue,
      totalCount: total.totalCount,
      totalRevenue: total.totalRevenue,
      daily
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
