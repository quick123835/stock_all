const cors = 'https://serene-hollows-91139-6a64bb814871.herokuapp.com/' // use cors-anywhere to fetch api data
// const cors = 'https://cors-anywhere.herokuapp.com/'
const baseURL = 'https://api.finmindtrade.com/api/v4/data'

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

export const getStockInfo = async id => {
  try {
    let response = await fetch(
      `${cors}${baseURL}?dataset=TaiwanStockPrice&data_id=${id}&start_date=${lastYearDate}&end_date=${formattedDate}`
    )
    let res = await response.json()
    console.log('個股資料取得成功')
    return res.data
  } catch (error) {
    console.error('[getStockInfo failed]', error)
  }
}

export const getAllStocks = async () => {
  try {
    // const { data } = await axios.get(`${baseURL}/?dataset=TaiwanStockInfo`)
    let response = await fetch(`${cors}${baseURL}/?dataset=TaiwanStockInfo`)
    let data = await response.json()
    if (data) {
      console.log('全部資料取得成功')
      return data
    }
  } catch (error) {
    console.error('[getAllStocks failed]', error)
  }
}
