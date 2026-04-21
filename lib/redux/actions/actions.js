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

export const setWatchedStocks = (stocks) => ({
    type: 'setWatchedStocks',
    payload: stocks,
})

export const addWatchedStock = (stock) => ({
    type: 'addWatchedStock',
    payload: stock,
})

export const removeWatchedStock = (stockId) => ({
    type: 'removeWatchedStock',
    payload: stockId,
})

export const updateWatchedStockCategory = (stockId, category) => ({
    type: 'updateWatchedStockCategory',
    payload: { stockId, category },
})

// async helpers — call these from components
export const fetchWatchedStocks = () => async (dispatch) => {
    const res = await fetch('/api/stocks')
    const data = await res.json()
    dispatch(setWatchedStocks(data))
}

export const watchStock = (stockId, stockName, category = '') => async (dispatch) => {
    const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockId, stockName, category }),
    })
    const data = await res.json()
    dispatch(addWatchedStock(data))
}

export const unwatchStock = (stockId) => async (dispatch) => {
    await fetch('/api/stocks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockId }),
    })
    dispatch(removeWatchedStock(stockId))
}

export const changeWatchedStockCategory = (stockId, category) => async (dispatch) => {
    await fetch('/api/stocks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockId, category }),
    })
    dispatch(updateWatchedStockCategory(stockId, category))
}

