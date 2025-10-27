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

