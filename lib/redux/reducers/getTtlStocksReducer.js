const getTtlStocksReducer = (state = '', action) => {
  switch (action.type) {
    case 'getTtlStocks':
      return action.payload
    default:
      return state
  }
}

export default getTtlStocksReducer
