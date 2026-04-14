const getFinancialStatementsReducer = (state = [], action) => {
  switch (action.type) {
    case 'FinancialStatements':
      return action.payload
    default:
      return state
  }
}

export default getFinancialStatementsReducer
