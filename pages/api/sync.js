import { connectDB } from '../../lib/db/mongoose'
import StockPrice from '../../lib/db/models/StockPrice'

const FINMIND_BASE = 'https://api.finmindtrade.com/api/v4/data'
const BATCH_SIZE = 5
const BATCH_DELAY_MS = 200

const delay = ms => new Promise(r => setTimeout(r, ms))

function getDateRange() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const end = fmt(now)
  const start = new Date(now)
  start.setFullYear(start.getFullYear() - 1)
  return { start_date: fmt(start), end_date: end }
}

async function fetchFinMind(params, token) {
  const urlParams = new URLSearchParams(params)
  if (token) urlParams.set('token', token)
  const res = await fetch(`${FINMIND_BASE}?${urlParams}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return res.json()
}

async function fetchAllStocks(token) {
  const json = await fetchFinMind({ dataset: 'TaiwanStockInfo' }, token)
  const excludeKeywords = ['ETF', 'Index', '指數', '受益證券', '存託憑證', '權證', '基金']
  const uniqueMap = new Map()
  ;(json.data || []).forEach(item => {
    const id = String(item.stock_id || '')
    const type = String(item.type || '').toLowerCase()
    const category = String(item.industry_category || '')
    if (
      id.length === 4 &&
      (type === 'twse' || type === 'tpex') &&
      !excludeKeywords.some(k => category.includes(k))
    ) {
      uniqueMap.set(id, item)
    }
  })
  return Array.from(uniqueMap.values())
}

async function syncStock(stock, dateRange, token) {
  const json = await fetchFinMind(
    { dataset: 'TaiwanStockPrice', data_id: stock.stock_id, ...dateRange },
    token
  )
  const rows = json.data || []
  if (rows.length === 0) return 0

  const ops = rows.map(row => ({
    updateOne: {
      filter: { stock_id: row.stock_id, date: row.date },
      update: { $set: row },
      upsert: true,
    },
  }))

  await StockPrice.bulkWrite(ops, { ordered: false })
  return rows.length
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const secret = process.env.SYNC_SECRET
  if (secret && req.headers['x-sync-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  await connectDB()

  const token = process.env.FINMIND_TOKEN
  const dateRange = getDateRange()
  const failed = []
  let synced = 0

  let stocks
  try {
    stocks = await fetchAllStocks(token)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch stock list', detail: err.message })
  }

  for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
    const batch = stocks.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(async stock => {
        try {
          const count = await syncStock(stock, dateRange, token)
          synced += count
        } catch (err) {
          console.error(`[sync] ${stock.stock_id} failed:`, err.message)
          failed.push({ stock_id: stock.stock_id, error: err.message })
        }
      })
    )
    await delay(BATCH_DELAY_MS)
  }

  return res.status(200).json({
    ok: true,
    total_stocks: stocks.length,
    synced_rows: synced,
    failed_count: failed.length,
    failed,
  })
}

export const config = {
  api: {
    responseLimit: false,
  },
}
