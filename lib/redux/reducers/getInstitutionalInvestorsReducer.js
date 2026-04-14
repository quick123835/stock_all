const getInstitutionalInvestorsReducer = (state = [], action) => {
  switch (action.type) {
    case 'InstitutionalInvestors':
      return action.payload
    default:
      return state
  }
}

export default getInstitutionalInvestorsReducer
