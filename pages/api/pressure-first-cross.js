/**
 * GET /api/pressure-first-cross
 *
 * 找出近 30 個交易日內「第一次」ttlPresure 從 >= 0.6 下穿 < 0.6 的股票清單。
 *
 * 為什麼需要這支 API？
 * /api/pressure 只回傳各股票的「最新」壓力值，無法判斷這個低壓力是剛出現的訊號
 * 還是已經持續很久。這支 API 專門找「新鮮的下穿訊號」，讓使用者看到剛進入低壓力區的股票。
 *
 * 計算策略：
 * 1. 撈近 90 曆日的 StockPrice（≈ 63 交易日），對每支股票跑完整的 presureCalculateFull，
 *    得到一段 ttlPresure 時序（每筆 [timestamp, value]）。
 * 2. 取最後 30 筆（約 30 個交易日），掃描是否有「前一筆 >= 0.6、當筆 < 0.6」的交叉點。
 * 3. 有的話就是「第一次下穿」，回傳該日期和壓力值。
 * 4. 所有符合條件的股票依交叉日期從新到舊排列，讓最近發生的訊號排在最前面。
 *
 * 為什麼撈 90 天？
 * ttlPresure 使用 20 日滾動窗口，所以至少要有 21 筆資料才能算出第 1 個壓力值。
 * 要看近 30 個壓力值的交叉，需要 20 + 30 = 50 個交易日的原始資料，
 * 50 交易日 ≈ 70 曆日，取 90 天有充足緩衝。
 */

import { connectDB } from '../../lib/db/mongoose'
import StockPrice from '../../lib/db/models/StockPrice'
import StockPressure from '../../lib/db/models/StockPressure'
import { presureCalculateFull } from '../../lib/presureCalculate'

/** 計算 N 天前的日期字串（YYYY-MM-DD），用於 MongoDB date 欄位過濾 */
function getDateSince(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * 判斷一支股票是否在「最新那一筆」才第一次下穿 0.6。
 *
 * 三個條件必須同時成立：
 * 1. 最新一筆（last）< 0.6          → 今天確實在 0.6 以下
 * 2. 倒數第二筆（last-1）>= 0.6      → 昨天還在 0.6 以上，今天才穿（不是幾天前就穿了）
 * 3. last-1 之前的所有資料沒有 < 0.6  → 在可用資料範圍內這是第一次穿（非二次下穿）
 *
 * @param {Array<[number, number]>} ttlPresure - 完整壓力時序（升序）
 * @returns {{ date: number, value: number } | null}
 */
function findFirstCross(ttlPresure) {
  if (!ttlPresure || ttlPresure.length < 2) return null

  const last = ttlPresure.length - 1
  const lastVal = ttlPresure[last][1]
  const prevVal = ttlPresure[last - 1][1]

  // 條件 1 + 2：今天才剛下穿
  if (!(lastVal < 0.6 && prevVal >= 0.6)) return null

  // 條件 3：更早之前從未低於 0.6，確保是真正的第一次
  for (let i = 0; i < last - 1; i++) {
    if (ttlPresure[i][1] < 0.6) return null
  }

  return { date: ttlPresure[last][0], value: lastVal }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // ids：呼叫端傳入「現在低於 0.6」的股票 ID 陣列，只對這些股票計算，避免掃全量資料
  const { ids } = req.body
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(200).json([])
  }

  await connectDB()

  // 90 曆日 ≈ 63 交易日，扣掉 20 日窗口還剩 ~43 筆 ttlPresure，足夠看近 30 筆
  const since = getDateSince(90)

  // 並行撈 StockPrice（計算用，僅限傳入的 ids）和 StockPressure（取股票名稱用）
  const [allPrices, allPressure] = await Promise.all([
    StockPrice.find({ stock_id: { $in: ids }, date: { $gte: since } }).sort({ stock_id: 1, date: 1 }).lean(),
    StockPressure.find({ stock_id: { $in: ids } }).lean(),
  ])

  // 建立 stock_id → stock_name 的快速查找表
  const nameMap = {}
  for (const p of allPressure) {
    nameMap[p.stock_id] = p.stock_name || ''
  }

  // 將所有日K資料以 stock_id 分組，保持日期升序（已在 DB 查詢時 sort 過）
  const grouped = {}
  for (const row of allPrices) {
    if (!grouped[row.stock_id]) grouped[row.stock_id] = []
    grouped[row.stock_id].push(row)
  }

  const results = []

  for (const [stock_id, rows] of Object.entries(grouped)) {
    // 20日窗口 + 至少 2 筆 ttlPresure 才有意義（一前一後才能判斷交叉）
    if (rows.length < 22) continue

    try {
      // 計算完整 ttlPresure 時序
      const ttlPresure = presureCalculateFull([...rows])
      if (!ttlPresure || ttlPresure.length === 0) continue

      // 判斷最新一筆是否為第一次下穿（今天才剛穿，且之前沒穿過）
      const cross = findFirstCross(ttlPresure)
      if (!cross) continue // 不符合條件（今天沒穿 / 幾天前就穿了 / 歷史上曾穿過）

      results.push({
        stock_id,
        stock_name: nameMap[stock_id] || '',
        cross_date: cross.date,   // 下穿當天的 unix timestamp (ms)
        cross_value: cross.value, // 下穿當天的壓力值
      })
    } catch {
      // 個別股票計算失敗（例如資料異常）不中斷整體，靜默略過
    }
  }

  // 依交叉日期從新到舊排序，讓最近發生的訊號排在最前面
  results.sort((a, b) => b.cross_date - a.cross_date)

  return res.status(200).json(results)
}
