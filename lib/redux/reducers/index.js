import { combineReducers } from 'redux'
import getTtlStocksReducer from './getTtlStocksReducer'
import getTtlCategoriesReducer from './getTtlCategoriesReducer'
import getStockInfoReducer from './getStockInfoReducer'
import clickCategoryReducer from './clickCategoryReducer'
import clickCategoryStocksReducer from './clickCategoryStocksReducer'
import getFinancialStatementsReducer from './getFinancialStatementsReducer'
import getMonthRevenueReducer from './getMonthRevenueReducer'

const allReducers = combineReducers({
    getTtlStocksReducer ,
    getTtlCategoriesReducer ,
    getStockInfoReducer ,
    clickCategoryReducer ,
    clickCategoryStocksReducer ,
    getFinancialStatementsReducer ,
    getMonthRevenueReducer ,
})

export default allReducers
