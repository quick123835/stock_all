import mongoose from 'mongoose'

const FinMindCacheSchema = new mongoose.Schema({
  cacheKey: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 },
})

export default mongoose.models.FinMindCache ||
  mongoose.model('FinMindCache', FinMindCacheSchema)
