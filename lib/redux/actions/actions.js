export const getTotalStocks = (stocks) => {
    return {
        type: 'getTtlStocks',
        payload: stocks
    }
}

export const getTtlCategories = (categories) => {
    return {
        type: 'getTtlCategories',
        payload: categories
    }
}

export const StockInfo = (stockInfo) => {
    return {
        type: 'StockInfo',
        payload: stockInfo
    }
}

export const clickCategory = (category) => {
    return {
        type: 'categoryClick',
        payload: category
    }
}
export const clickCategoryStocks = (stocks) => {
    return {
        type: 'clickCategoryStocks',
        payload: stocks
    }
}

export const setFinancialStatements = (data) => ({
    type: 'FinancialStatements',
    payload: data
})

export const setMonthRevenue = (data) => ({
    type: 'MonthRevenue',
    payload: data
})

export const setMarginShortSale = (data) => ({
    type: 'MarginShortSale',
    payload: data
})

export const setInstitutionalInvestors = (data) => ({
    type: 'InstitutionalInvestors',
    payload: data
})

