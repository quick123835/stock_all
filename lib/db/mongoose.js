/**
 * lib/db/mongoose.js — MongoDB 連線管理
 *
 * 為什麼需要這個檔案？
 * Next.js 的 API Route 在 dev 模式下每次 hot-reload 都會重新執行模組，
 * 在 production 模式下 serverless function 每次冷啟動也會重新建立連線。
 * 如果每次 API 被呼叫都直接 mongoose.connect()，會造成大量閒置連線，
 * 最終 MongoDB Atlas 的 connection limit 會被打爆。
 *
 * 解法：把連線存在 global 物件上（global.mongoose），這樣同一個 Node.js
 * 進程內不管有幾個 API Route 被呼叫，都只會建立一條連線並重複使用。
 */

import mongoose from 'mongoose'

if (!process.env.MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local')
}

// global.mongoose 作為跨模組的連線快取容器
// { conn: 已建立的連線物件, promise: 建立中的 Promise }
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  // 若連線已存在，直接回傳，不重新連
  if (cached.conn) return cached.conn

  // 若尚未開始連線，建立 Promise（只建立一次）
  // bufferCommands: false → 連線前如果有 query 進來，直接噴錯而非排隊等待
  // 這樣可以快速發現「在連線建立前就呼叫 DB」的 bug
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
