import { connectDB } from '../../lib/db/mongoose'
import StockPrice from '../../lib/db/models/StockPrice'

const FINMIND_BASE = 'https://api.finmindtrade.com/api/v4/data'
const MIN_ROWS = 20

export default async function handler(req, res) {
  const { id, start_date, end_date } = req.query

  if (!id) {
    return res.status(400).json({ error: 'id is required' })
  }

  await connectDB()

  const query = { stock_id: id }
  if (start_date) query.date = { ...query.date, $gte: start_date }
  if (end_date) query.date = { ...query.date, $lte: end_date }

  const cached = await StockPrice.find(query).sort({ date: 1 }).lean()

  if (cached.length >= MIN_ROWS) {
    return res.status(200).json(cached)
  }

  // fallback: fetch from FinMind and upsert
  const token = process.env.FINMIND_TOKEN
  const params = new URLSearchParams({ dataset: 'TaiwanStockPrice', data_id: id })
  if (start_date) params.set('start_date', start_date)
  if (end_date) params.set('end_date', end_date)
  if (token) params.set('token', token)

  try {
    const response = await fetch(`${FINMIND_BASE}?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    const json = await response.json()
    const rows = json.data || []

    if (rows.length > 0) {
      const ops = rows.map(row => ({
        updateOne: {
          filter: { stock_id: row.stock_id, date: row.date },
          update: { $set: row },
          upsert: true,
        },
      }))
      await StockPrice.bulkWrite(ops, { ordered: false })
    }

    return res.status(200).json(rows)
  } catch (err) {
    console.error('[stock-price fallback error]', err)
    return res.status(500).json({ error: 'upstream request failed' })
  }
}
