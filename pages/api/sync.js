/**
 * pages/api/sync.js — 批次同步所有股票日K資料到 MongoDB
 *
 * 這支 API 的目的是「主動把資料預先存進 DB」，而不是被動等使用者查詢時才抓。
 * 適合設定 cron job（例如每天收盤後呼叫一次），讓 DB 的資料保持最新。
 *
 * 為什麼需要批次同步？
 * /api/stock-price 是「有人查才去抓」，但 2000+ 檔股票不可能全部都有人查過。
 * 批次同步讓未被查過的股票也能預先有資料，「一鍵計算所有股票力道」才能
 * 全部都從 DB 讀取，不會因為沒快取而大量打 FinMind 導致超過 quota。
 *
 * 安全性：
 * 請求 header 需帶 x-sync-secret，值必須等於環境變數 SYNC_SECRET，
 * 避免任何人都能觸發批次同步（會消耗大量 FinMind API quota）。
 *
 * 批次控制策略（BATCH_SIZE + BATCH_DELAY_MS）：
 * 同時發送 5 個請求，每批之間等 200ms。
 * 如果全部同時打，FinMind 可能因為太密集而 rate limit，
 * 分批可以讓請求均勻分散，降低被限速的機率。
 *
 * upsert 策略（同 stock-price.js）：
 * 每天的資料以 { stock_id, date } 為 key upsert，
 * 重複執行不會產生重複資料，只會更新已存在的那筆。
 */

import { connectDB } from '../../lib/db/mongoose'
import StockPrice from '../../lib/db/models/StockPrice'
import StockPressure from '../../lib/db/models/StockPressure'
import presureCalculate from '../../lib/presureCalculate'

const FINMIND_BASE = 'https://api.finmindtrade.com/api/v4/data'
const BATCH_SIZE = 5       // 每批同時處理幾檔股票
const BATCH_DELAY_MS = 200 // 每批之間等多少毫秒

const delay = ms => new Promise(r => setTimeout(r, ms))

// 計算「今天」和「一年前」的日期字串，作為同步的日期範圍
function getDateRange() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const end = fmt(now)
  const start = new Date(now)
  start.setFullYear(start.getFullYear() - 1)
  return { start_date: fmt(start), end_date: end }
}

// 從 FinMind 拿股票清單，並過濾掉 ETF、興櫃等非一般股票
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

// 通用的 FinMind fetch 函式
async function fetchFinMind(params, token) {
  const urlParams = new URLSearchParams(params)
  if (token) urlParams.set('token', token)
  const res = await fetch(`${FINMIND_BASE}?${urlParams}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return res.json()
}

// 同步單一股票的日K資料：抓取後 bulkWrite upsert 進 DB，並計算壓力存入 StockPressure
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

  // 計算壓力值並 upsert 進 StockPressure
  try {
    const pressure = presureCalculate([...rows])
    const pressureValue = pressure?.[1]
    if (pressureValue !== undefined && isFinite(pressureValue) && !isNaN(pressureValue)) {
      await StockPressure.findOneAndUpdate(
        { stock_id: stock.stock_id },
        {
          stock_id: stock.stock_id,
          stock_name: stock.stock_name || '',
          pressure: pressureValue,
          pressure_date: rows[rows.length - 1]?.date || '',
          updated_at: new Date(),
        },
        { upsert: true, new: true }
      )
    }
  } catch (err) {
    console.warn(`[sync] pressure calc failed for ${stock.stock_id}:`, err.message)
  }

  return rows.length
}

export default async function handler(req, res) {
  // 只允許 POST，防止爬蟲意外觸發
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // 驗證 secret header，避免未授權的人觸發批次同步
  const secret = process.env.SYNC_SECRET
  if (secret && req.headers['x-sync-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  /**
   * 為什麼用 streaming response（res.writeHead + res.write + res.end）？
   *
   * Heroku router 有 30 秒 H12 timeout：若 30 秒內沒有收到任何 response byte，
   * 就會強制切斷連線。sync 跑完 1500+ 支股票需要幾分鐘，遠超過 30 秒。
   *
   * 解法：立刻送出 HTTP headers + 第一行文字，讓 router 看到連線是活的；
   * 之後每批跑完再寫一行進度，持續保持連線直到全部完成再 res.end()。
   */
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.write('[sync] Starting...\n')

  await connectDB()

  const token = process.env.FINMIND_TOKEN
  const dateRange = getDateRange()
  const failed = []
  let synced = 0

  let stocks
  try {
    stocks = await fetchAllStocks(token)
    res.write(`[sync] ${stocks.length} stocks found\n`)
  } catch (err) {
    res.write(`[sync] ERROR fetching stock list: ${err.message}\n`)
    res.end()
    return
  }

  const totalBatches = Math.ceil(stocks.length / BATCH_SIZE)

  // 分批處理，每批 BATCH_SIZE 檔，批次間等 BATCH_DELAY_MS ms
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
    // 每批完成後寫一行進度，讓 Heroku router 知道連線仍然活著，不會觸發 H12 timeout
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    res.write(`[sync] batch ${batchNum}/${totalBatches} done, synced=${synced}\n`)
    await delay(BATCH_DELAY_MS)
  }

  // 最後寫入結果摘要後結束串流
  res.end(`[sync] DONE total=${stocks.length} synced=${synced} failed=${failed.length}\n`)
}

// 關閉 Next.js 預設的 4MB response limit，
// 因為同步結果可能包含大量 failed 陣列，超過預設限制
export const config = {
  api: {
    responseLimit: false,
  },
}
