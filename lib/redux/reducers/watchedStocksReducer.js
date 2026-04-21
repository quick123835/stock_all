/**
 * lib/redux/reducers/watchedStocksReducer.js — 自選股清單 Reducer
 *
 * 管理使用者的自選股陣列（state = []）。
 * 這個 reducer 只處理 Redux 記憶體狀態，持久化到 MongoDB 是 actions.js 裡的 thunk 負責。
 *
 * 四種操作：
 *
 * setWatchedStocks：
 *   用 API 回傳的完整清單取代整個 state。
 *   通常在 app 初始化時呼叫（fetchWatchedStocks thunk）。
 *
 * addWatchedStock：
 *   把一筆新股票加進 state 陣列尾端。
 *   收到的 payload 是 API POST 回傳的 MongoDB document（含 _id）。
 *
 * removeWatchedStock：
 *   用 stockId 過濾掉被移除的那筆。
 *   filter 不改變原陣列，回傳新陣列（Redux 要求 immutable update）。
 *
 * updateWatchedStockCategory：
 *   找到 stockId 相符的那筆，用 spread 建立新物件更新 category，
 *   其他筆原封不動。同樣是 immutable update。
 */

const watchedStocksReducer = (state = [], action) => {
  switch (action.type) {
    case 'setWatchedStocks':
      return action.payload

    case 'addWatchedStock':
      return [...state, action.payload]

    case 'removeWatchedStock':
      return state.filter(s => s.stockId !== action.payload)

    case 'updateWatchedStockCategory':
      return state.map(s =>
        s.stockId === action.payload.stockId
          ? { ...s, category: action.payload.category }
          : s
      )

    default:
      return state
  }
}

export default watchedStocksReducer
