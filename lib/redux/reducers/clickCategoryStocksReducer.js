const clickCategoryStocksReducer = (state=[],action) => {
    switch(action.type){
        case 'clickCategoryStocks':
            return action.payload
        default:
            return state
    }
}

export default clickCategoryStocksReducer