import { combineReducers } from 'redux'
import getTtlStocksReducer from './getTtlStocksReducer'
import getTtlCategoriesReducer from './getTtlCategoriesReducer'
import getStockInfoReducer from './getStockInfoReducer'
import clickCategoryReducer from './clickCategoryReducer'
import clickCategoryStocksReducer from './clickCategoryStocksReducer'
import getFinancialStatementsReducer from './getFinancialStatementsReducer'
import getMonthRevenueReducer from './getMonthRevenueReducer'
import getMarginShortSaleReducer from './getMarginShortSaleReducer'
import getInstitutionalInvestorsReducer from './getInstitutionalInvestorsReducer'
import watchedStocksReducer from './watchedStocksReducer'

const allReducers = combineReducers({
    getTtlStocksReducer ,
    getTtlCategoriesReducer ,
    getStockInfoReducer ,
    clickCategoryReducer ,
    clickCategoryStocksReducer ,
    getFinancialStatementsReducer ,
    getMonthRevenueReducer ,
    getMarginShortSaleReducer ,
    getInstitutionalInvestorsReducer ,
    watchedStocksReducer ,
})

export default allReducers
