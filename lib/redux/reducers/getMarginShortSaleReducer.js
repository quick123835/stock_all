const getMarginShortSaleReducer = (state = [], action) => {
  switch (action.type) {
    case 'MarginShortSale':
      return action.payload
    default:
      return state
  }
}

export default getMarginShortSaleReducer
