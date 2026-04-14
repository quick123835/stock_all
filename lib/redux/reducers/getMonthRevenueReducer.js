const getMonthRevenueReducer = (state = [], action) => {
  switch (action.type) {
    case 'MonthRevenue':
      return action.payload
    default:
      return state
  }
}

export default getMonthRevenueReducer
