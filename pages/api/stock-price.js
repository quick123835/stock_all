/**
 * pages/api/stock-price.js — 股價日K資料 API（DB 快取 + FinMind fallback）
 *
 * 查詢流程：
 * 1. 先查 MongoDB 的 StockPrice collection
 * 2. 如果 DB 裡有足夠資料（>= MIN_ROWS 筆），直接回傳，不打 FinMind
 * 3. 如果 DB 資料不足（首次查詢或資料過舊），去打 FinMind 取得最新資料，
 *    同時把結果 upsert 進 DB 供下次使用
 *
 * 為什麼用 MIN_ROWS = 20 判斷「夠不夠」，而不是判斷日期範圍？
 * 因為新上市股票可能本來就只有幾筆資料，不需要每次都去打 FinMind。
 * 20 筆是做壓力計算的最低門檻（需要一定天數的歷史資料才能算移動平均）。
 *
 * upsert 策略（bulkWrite + updateOne upsert）：
 * - 每筆資料以 { stock_id, date } 作為唯一 key（對應 StockPrice 的 compound index）
 * - 已存在的資料用 $set 更新（確保數值是最新的），不存在的新增
 * - ordered: false → 單筆 upsert 失敗不會中斷整批作業
 */

import { connectDB } from '../../lib/db/mongoose'
import StockPrice from '../../lib/db/models/StockPrice'

const FINMIND_BASE = 'https://api.finmindtrade.com/api/v4/data'

// 至少要有 20 筆 DB 資料才算「有快取」，否則重新去抓
const MIN_ROWS = 20

export default async function handler(req, res) {
  const { id, start_date, end_date } = req.query

  if (!id) {
    return res.status(400).json({ error: 'id is required' })
  }

  // 嘗試從 DB 讀取快取，DB 掛掉時直接 fallback 到 FinMind，不中斷服務
  try {
    await connectDB()

    const query = { stock_id: id }
    if (start_date) query.date = { ...query.date, $gte: start_date }
    if (end_date) query.date = { ...query.date, $lte: end_date }

    const cached = await StockPrice.find(query).sort({ date: 1 }).lean()

    if (cached.length >= MIN_ROWS) {
      return res.status(200).json(cached)
    }
  } catch (dbErr) {
    console.error('[stock-price db error, falling back to FinMind]', dbErr)
  }

  // DB 資料不足或 DB 無法連線，fallback 到 FinMind 即時抓取
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
