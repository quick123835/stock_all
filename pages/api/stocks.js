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
        { new: true }
      )
      if (!updated) return res.status(404).json({ error: 'stock not found' })
      return res.status(200).json(updated)
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PATCH'])
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}
