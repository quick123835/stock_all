const date = new Date()
const year = date.getFullYear()
const month = date.getMonth() + 1
const day = date.getDate()
const pad = n => String(n).padStart(2, '0')

const fmt = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`
const formattedDate = fmt(year, month, day)
const lastYearDate = fmt(year - 1, month, day)
const last2YearDate = fmt(year - 2, month, day)
const last3YearDate = fmt(year - 3, month, day)

const api = async (dataset, data_id, start_date, end_date) => {
  const params = new URLSearchParams({ dataset, data_id })
  if (start_date) params.set('start_date', start_date)
  if (end_date) params.set('end_date', end_date)
  try {
    const res = await fetch(`/api/finmind?${params}`)
    const json = await res.json()
    return json.data
  } catch (error) {
    console.error(`[${dataset} failed]`, error)
  }
}

export const getStockInfo = id =>
  api('TaiwanStockPrice', id, lastYearDate, formattedDate)

export const getFinancialStatements = (id, start_date = last3YearDate) =>
  api('TaiwanStockFinancialStatements', id, start_date)

export const getMonthRevenue = (id, start_date = last3YearDate) =>
  api('TaiwanStockMonthRevenue', id, start_date)

export const getMarginShortSale = (id, start_date = last2YearDate) =>
  api('TaiwanStockMarginPurchaseShortSale', id, start_date)

export const getInstitutionalInvestors = (id, start_date = last2YearDate) =>
  api('TaiwanStockInstitutionalInvestorsBuySell', id, start_date)

export const getAllStocks = async () => {
  try {
    const res = await fetch('/api/finmind?dataset=TaiwanStockInfo')
    const json = await res.json()
    return json
  } catch (error) {
    console.error('[getAllStocks failed]', error)
  }
}
