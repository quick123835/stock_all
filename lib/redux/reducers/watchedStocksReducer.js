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
