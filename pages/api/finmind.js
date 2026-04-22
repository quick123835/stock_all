/**
 * pages/api/finmind.js — FinMind API Proxy（含 MongoDB 快取）
 *
 * 為什麼需要 proxy？
 * 原本直接從前端呼叫 FinMind API 有兩個問題：
 * 1. CORS：FinMind 不允許瀏覽器直接呼叫（cross-origin blocked）
 * 2. Token 外洩：如果從前端帶 FINMIND_TOKEN，使用者打開 DevTools 就看得到
 *
 * 把呼叫搬到 Next.js API Route（server side），token 只存在環境變數，
 * 前端不需要也看不到 token。
 *
 * 加入 MongoDB 快取的理由：
 * FinMind 免費帳號每天 API 呼叫有上限。
 * 把相同查詢的結果存進 MongoDB（TTL 24 小時），
 * 同一天內的重複查詢直接從 DB 回傳，完全不消耗 FinMind quota。
 *
 * 快取 key 的組成：
 * dataset + data_id + start_date + end_date 用 ":" 串接
 * 例如 "TaiwanStockFinancialStatements:2330:2023-01-01"
 */

import { connectDB } from '../../lib/db/mongoose'
import FinMindCache from '../../lib/db/models/FinMindCache'

const BASE_URL = 'https://api.finmindtrade.com/api/v4/data'

export default async function handler(req, res) {
  const { dataset, data_id, start_date, end_date } = req.query
  const token = process.env.FINMIND_TOKEN

  if (!dataset) {
    return res.status(400).json({ error: 'missing required params' })
  }

  // 組合快取 key，過濾掉空值避免 key 出現多餘的冒號
  const cacheKey = [dataset, data_id, start_date, end_date]
    .filter(Boolean)
    .join(':')

  // 嘗試從 DB 快取讀取，DB 掛掉時直接跳過，fallback 到 FinMind
  let dbAvailable = false
  try {
    await connectDB()
    dbAvailable = true

    const cached = await FinMindCache.findOne({ cacheKey }).lean()
    if (cached) {
      return res.status(200).json(cached.data)
    }
  } catch (dbErr) {
    console.error('[finmind db error, falling back to FinMind]', dbErr)
  }

  // 快取未命中或 DB 無法連線，直接打 FinMind
  try {
    const params = new URLSearchParams({ dataset })
    if (data_id) params.set('data_id', data_id)
    if (start_date) params.set('start_date', start_date)
    if (end_date) params.set('end_date', end_date)
    if (token) params.set('token', token)

    const response = await fetch(`${BASE_URL}?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    const data = await response.json()

    // DB 可用才存快取，避免 DB 已掛掉時再試一次 DB 操作
    if (dbAvailable) {
      FinMindCache.findOneAndUpdate(
        { cacheKey },
        { cacheKey, data },
        { upsert: true, new: true }
      ).catch(err => console.error('[finmind cache write error]', err))
    }

    return res.status(200).json(data)
  } catch (error) {
    console.error('[finmind proxy error]', error)
    return res.status(500).json({ error: 'upstream request failed' })
  }
}
