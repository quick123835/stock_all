import { combineReducers } from 'redux'
import getTtlStocksReducer from './getTtlStocksReducer'
import getTtlCategoriesReducer from './getTtlCategoriesReducer'
import getStockInfoReducer from './getStockInfoReducer'
import clickCategoryReducer from './clickCategoryReducer'
import clickCategoryStocksReducer from './clickCategoryStocksReducer'

const allReducers = combineReducers({
    getTtlStocksReducer ,
    getTtlCategoriesReducer ,
    getStockInfoReducer ,
    clickCategoryReducer ,
    clickCategoryStocksReducer
})

export default allReducers
