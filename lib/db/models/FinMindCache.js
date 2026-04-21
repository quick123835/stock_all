/**
 * lib/db/models/FinMindCache.js — FinMind API 回應快取 Schema
 *
 * 為什麼需要快取？
 * FinMind 免費帳號有 API 呼叫次數限制（每天約 600 次）。
 * 每次使用者點開股票資訊（財報、月營收、法人買賣）都直接打 FinMind，
 * 很快就會超過限制導致 429 錯誤。
 *
 * 解法：把 FinMind 的回應存進 MongoDB，同樣的查詢在 TTL 過期前直接從 DB 回傳，
 * 不再呼叫 FinMind。
 *
 * Schema 設計說明：
 * - cacheKey：由 dataset + data_id + start_date + end_date 組成的唯一字串，
 *   例如 "TaiwanStockFinancialStatements:2330:2023-01-01"
 * - data：Mixed 型別，可以存任意結構的 JSON（FinMind 各 dataset 格式不同）
 * - createdAt + expires: 86400：TTL index，MongoDB 會在 createdAt 後 86400 秒
 *   （也就是 24 小時）自動刪除這筆快取，確保資料不會永遠過期
 */

import mongoose from 'mongoose'

const FinMindCacheSchema = new mongoose.Schema({
  cacheKey: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 },
})

// mongoose.models.FinMindCache 檢查是為了避免 Next.js hot-reload 重複定義 model 噴錯
export default mongoose.models.FinMindCache ||
  mongoose.model('FinMindCache', FinMindCacheSchema)
