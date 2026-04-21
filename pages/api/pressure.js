import { connectDB } from '../../lib/db/mongoose'
import StockPressure from '../../lib/db/models/StockPressure'

export default async function handler(req, res) {
  await connectDB()

  const results = await StockPressure.find({
    pressure: { $ne: null },
  })
    .sort({ pressure: 1 })
    .lean()

  return res.status(200).json(results)
}
