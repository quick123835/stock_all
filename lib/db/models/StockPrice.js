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

StockPriceSchema.index({ stock_id: 1, date: 1 }, { unique: true })

export default mongoose.models.StockPrice ||
  mongoose.model('StockPrice', StockPriceSchema)
