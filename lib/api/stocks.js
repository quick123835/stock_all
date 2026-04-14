const cors = 'https://serene-hollows-91139-6a64bb814871.herokuapp.com/' // use cors-anywhere to fetch api data
// const cors = 'https://cors-anywhere.herokuapp.com/'
const baseURL = 'https://api.finmindtrade.com/api/v4/data'
const token = process.env.NEXT_PUBLIC_FINMIND_TOKEN

const date = new Date()
const year = date.getFullYear() // 取得年份，例如 2023
const month = date.getMonth() + 1 // 取得月份（從0開始，需要加1），例如 6
const day = date.getDate() // 取得日期，例如 23
const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day
  .toString()
  .padStart(2, '0')}` //padStart確保月份和日期為兩位數

const lastYearDate = `${year - 1}-${month.toString().padStart(2, '0')}-${day
  .toString()
  .padStart(2, '0')}`

const last2YearDate = `${year - 2}-${month.toString().padStart(2, '0')}-${day
  .toString()
  .padStart(2, '0')}`

const last3YearDate = `${year - 3}-${month.toString().padStart(2, '0')}-${day
  .toString()
  .padStart(2, '0')}`

export const getStockInfo = async id => {
  try {
    let response = await fetch(
      `${cors}${baseURL}?dataset=TaiwanStockPrice&data_id=${id}&start_date=${lastYearDate}&end_date=${formattedDate}&token=${token}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    let res = await response.json()
    console.log('個股資料取得成功')
    return res.data
  } catch (error) {
    console.error('[getStockInfo failed]', error)
  }
}

export const getFinancialStatements = async (id, start_date = last3YearDate) => {
  try {
    let response = await fetch(
      `${cors}${baseURL}?dataset=TaiwanStockFinancialStatements&data_id=${id}&start_date=${start_date}&token=${token}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    let res = await response.json()
    console.log('財務報表資料取得成功')
    return res.data
  } catch (error) {
    console.error('[getFinancialStatements failed]', error)
  }
}

export const getMonthRevenue = async (id, start_date = last3YearDate) => {
  try {
    let response = await fetch(
      `${cors}${baseURL}?dataset=TaiwanStockMonthRevenue&data_id=${id}&start_date=${start_date}&token=${token}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    let res = await response.json()
    console.log('月營收資料取得成功')
    return res.data
  } catch (error) {
    console.error('[getMonthRevenue failed]', error)
  }
}

export const getMarginShortSale = async (id, start_date = last2YearDate) => {
  try {
    let response = await fetch(
      `${cors}${baseURL}?dataset=TaiwanStockMarginPurchaseShortSale&data_id=${id}&start_date=${start_date}&token=${token}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    let res = await response.json()
    console.log('融資融券資料取得成功')
    return res.data
  } catch (error) {
    console.error('[getMarginShortSale failed]', error)
  }
}

export const getInstitutionalInvestors = async (id, start_date = last2YearDate) => {
  try {
    let response = await fetch(
      `${cors}${baseURL}?dataset=TaiwanStockInstitutionalInvestorsBuySell&data_id=${id}&start_date=${start_date}&token=${token}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    let res = await response.json()
    console.log('三大法人資料取得成功')
    return res.data
  } catch (error) {
    console.error('[getInstitutionalInvestors failed]', error)
  }
}

export const getAllStocks = async () => {
  try {
    // const { data } = await axios.get(`${baseURL}/?dataset=TaiwanStockInfo`)
    let response = await fetch(
      `${cors}${baseURL}/?dataset=TaiwanStockInfo&token=${token}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    let data = await response.json()
    if (data) {
      console.log('全部資料取得成功')
      return data
    }
  } catch (error) {
    console.error('[getAllStocks failed]', error)
  }
}
