/**
 * lib/db/models/StockPrice.js — 股票日K資料 Schema
 *
 * 用途：把從 FinMind 抓回來的股價歷史（TaiwanStockPrice dataset）
 * 存進 MongoDB，讓 /api/stock-price 優先從 DB 讀取，
 * 不需要每次都即時呼叫 FinMind API。
 *
 * 欄位對應 FinMind TaiwanStockPrice 的回傳格式：
 * - stock_id：股票代碼
 * - date：交易日期，格式 "YYYY-MM-DD"（字串，保留 FinMind 原格式方便比對）
 * - open / max / min / close：開高低收（點）
 * - Trading_Volume：成交量（股）
 * - Trading_money：成交金額（元）
 * - spread：漲跌點數
 * - Trading_turnover：成交筆數
 *
 * 為什麼用 compound index { stock_id, date }？
 * 查詢時通常是 "某支股票在某段日期範圍的資料"，
 * 複合 index 讓這類查詢直接走 index scan 而不是 collection scan，
 * 速度差距在資料量大時非常明顯。
 * unique: true 同時防止同一天的資料被重複寫入（upsert 時不會產生重複文件）。
 */

import mongoose from 'mongoose'

const StockPriceSchema = new mongoose.Schema({
  stock_id: { type: String, required: true },
  date: { type: String, required: true },
  open: Number,
  max: Number,
  min: Number,
  close: Number,
  Trading_Volume: Number,
  Trading_money: Number,
  spread: Number,
  Trading_turnover: Number,
})

// 複合唯一索引：同一支股票同一天只能有一筆資料
StockPriceSchema.index({ stock_id: 1, date: 1 }, { unique: true })

export default mongoose.models.StockPrice ||
  mongoose.model('StockPrice', StockPriceSchema)
