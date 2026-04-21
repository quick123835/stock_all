/**
 * lib/redux/actions/actions.js — Redux Action Creators
 *
 * 分成兩大類：
 *
 * ── 同步 Action（直接 dispatch，立即更新 store）──────────────────────────
 * getTotalStocks / getTtlCategories / StockInfo / clickCategory 等：
 *   原本就有的 action，負責把 API 回傳的資料存進 Redux state。
 *
 * setWatchedStocks / addWatchedStock / removeWatchedStock / updateWatchedStockCategory：
 *   新增的自選股同步 action，對應 watchedStocksReducer 的四種操作。
 *   這些 action 只更新 Redux state（記憶體），不打 API。
 *
 * ── 非同步 Thunk（回傳 function，在裡面打 API + dispatch）────────────────
 * 需要 redux-thunk middleware（store.js 已設定）才能 dispatch function。
 *
 * fetchWatchedStocks()：
 *   GET /api/stocks → 取得持久化的自選股清單，存進 store
 *   通常在 app 初始化（例如 _app.js useEffect）時呼叫一次
 *
 * watchStock(stockId, stockName, category)：
 *   POST /api/stocks → 把股票存進 MongoDB，同時更新 Redux state
 *   使用者點「加入自選股」時呼叫
 *
 * unwatchStock(stockId)：
 *   DELETE /api/stocks → 從 MongoDB 刪除，同時更新 Redux state
 *   使用者點「移除自選股」時呼叫
 *
 * changeWatchedStockCategory(stockId, category)：
 *   PATCH /api/stocks → 更新分類，同時更新 Redux state
 *   使用者修改股票分類時呼叫
 *
 * 為什麼要同時更新 MongoDB 和 Redux state（而不是只打 API 然後重新 fetch）？
 * 「樂觀更新」策略：先更新 UI（dispatch），讓使用者感覺即時反應，
 * 不需要等 API 回應後才重新拉資料，體驗更流暢。
 */

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

// ── 自選股同步 action（只更新 Redux state）──────────────────────────────

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

// ── 非同步 Thunk：打 API + 更新 Redux state ──────────────────────────────

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
