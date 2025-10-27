const initialState=[]

const getStockInfoReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'StockInfo':
      return [
        ...state,
        action.payload
      ]
    default:
      return state
  }
}

export default getStockInfoReducer
