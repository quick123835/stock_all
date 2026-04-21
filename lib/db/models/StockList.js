/**
 * lib/db/models/StockList.js — 使用者自選股清單 Schema
 *
 * 用途：儲存使用者加入觀察清單的股票。
 * 這樣使用者下次回來，不需要重新從 2000+ 檔股票裡手動找，
 * 自選股資料會持久化在 MongoDB 而不只是存在 Redux（重新整理就不見）。
 *
 * 欄位說明：
 * - stockId：股票代碼（例如 "2330"），unique 確保同一檔不會重複加入
 * - stockName：股票名稱（例如 "台積電"），方便顯示不需要每次再查
 * - category：使用者自訂分類（例如 "半導體"、"長期持有"），預設空字串
 * - addedAt：加入時間，sort({ addedAt: 1 }) 讓清單照加入順序顯示
 */

import mongoose from 'mongoose'

const StockSchema = new mongoose.Schema({
  stockId: { type: String, required: true, unique: true },
  stockName: { type: String, default: '' },
  category: { type: String, default: '' },
  addedAt: { type: Date, default: Date.now },
})

export default mongoose.models.StockList ||
  mongoose.model('StockList', StockSchema)
