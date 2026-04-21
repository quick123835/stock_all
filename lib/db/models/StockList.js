import mongoose from 'mongoose'

const StockSchema = new mongoose.Schema({
  stockId: { type: String, required: true, unique: true },
  stockName: { type: String, default: '' },
  category: { type: String, default: '' },
  addedAt: { type: Date, default: Date.now },
})

export default mongoose.models.StockList ||
  mongoose.model('StockList', StockSchema)
