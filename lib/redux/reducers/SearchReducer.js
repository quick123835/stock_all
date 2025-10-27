function SearchReducer (state = '', action) {
  switch (action.type) {
    case 'inputChange':
      return action.payload
    default:
      return state
  }
}

export default SearchReducer
