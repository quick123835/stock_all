/**
 * pages/api/stocks.js — 自選股清單 CRUD API
 *
 * 為什麼要把自選股存進 MongoDB？
 * 原本自選股只存在 Redux state，重新整理頁面就不見了。
 * 存進 MongoDB 後，資料持久化在伺服器端，任何裝置都能看到同一份清單。
 *
 * 支援四種操作：
 *
 * GET  /api/stocks
 *   → 取得全部自選股，依照加入時間排序（addedAt: 1 = 最早加入的在最前面）
 *
 * POST /api/stocks  body: { stockId, stockName, category }
 *   → 加入一檔自選股。使用 findOneAndUpdate + upsert 而非單純 create，
 *     確保同一檔股票重複 POST 不會報錯，只會更新資料
 *
 * DELETE /api/stocks  body: { stockId }
 *   → 從自選股清單移除一檔股票
 *
 * PATCH /api/stocks  body: { stockId, category }
 *   → 更新股票的自訂分類（例如把 "2330" 的分類從 "" 改為 "半導體"）
 */

import { connectDB } from '../../lib/db/mongoose'
import StockList from '../../lib/db/models/StockList'

export default async function handler(req, res) {
  await connectDB()

  switch (req.method) {
    case 'GET': {
      const stocks = await StockList.find({}).sort({ addedAt: 1 }).lean()
      return res.status(200).json(stocks)
    }

    case 'POST': {
      const { stockId, stockName, category } = req.body
      if (!stockId) return res.status(400).json({ error: 'stockId is required' })

      // upsert: true → 找不到就新增；setDefaultsOnInsert: true → 新增時套用 Schema 預設值
      const stock = await StockList.findOneAndUpdate(
        { stockId },
        { stockId, stockName, category },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      return res.status(201).json(stock)
    }

    case 'DELETE': {
      const { stockId } = req.body
      if (!stockId) return res.status(400).json({ error: 'stockId is required' })

      await StockList.deleteOne({ stockId })
      return res.status(200).json({ ok: true })
    }

    case 'PATCH': {
      const { stockId, category } = req.body
      if (!stockId) return res.status(400).json({ error: 'stockId is required' })

      const updated = await StockList.findOneAndUpdate(
        { stockId },
        { category },
        { new: true } // new: true → 回傳更新後的文件，而不是更新前的
      )
      if (!updated) return res.status(404).json({ error: 'stock not found' })
      return res.status(200).json(updated)
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PATCH'])
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}
