import mongoose from 'mongoose'

const StockPressureSchema = new mongoose.Schema({
  stock_id: { type: String, required: true, unique: true },
  stock_name: { type: String, default: '' },
  pressure: { type: Number, default: null },
  pressure_date: { type: String, default: '' },
  updated_at: { type: Date, default: Date.now },
})

export default mongoose.models.StockPressure ||
  mongoose.model('StockPressure', StockPressureSchema)
