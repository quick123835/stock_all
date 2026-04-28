const presureCalculate = (res) => {
    for (let i = 1; i < res.length; i++) {
        const nowClose = res[i].close
        const preClose = res[i - 1].close
        const def = nowClose - preClose
        res[i].def = def
      }
    
      const vol = []
      const date = []
      const buyPlate1 = []
      const buyPlate2 = []
      const salePlate1 = []
      const salePlate2 = []
      //買盤 & 賣盤
      for (let i = 1; i < res.length; i++) {
        if (res[i].def > 0) {
          vol.push(res[i].Trading_Volume)
          date.push(res[i].date)
          // 買盤1
          buyPlate1.push(Math.abs(res[i].open - res[i - 1].close))
          // 買盤2
          buyPlate2.push(Math.abs(res[i].max - res[i].min))
          // 賣盤1
          salePlate1.push(Math.abs(res[i].open - res[i].min))
          // 賣盤2
          salePlate2.push(Math.abs(res[i].max - res[i].close))
        } else {
          date.push(res[i].date)
          vol.push(res[i].Trading_Volume)
    
          buyPlate1.push(Math.abs(res[i].max - res[i].open))
    
          buyPlate2.push(Math.abs(res[i].close - res[i].min))
    
          salePlate1.push(Math.abs(res[i - 1].close - res[i].open))
    
          salePlate2.push(Math.abs(res[i].max - res[i].min))
        }
      }
      //   console.log(date)
      // ttl 買盤 & 賣盤
      const ttlBuyPlate = []
      const ttlSalePlate = []
      for (let i = 0; i < buyPlate1.length; i++) {
        ttlBuyPlate.push(buyPlate1[i] + buyPlate2[i])
        ttlSalePlate.push(salePlate1[i] + salePlate2[i])
      }
    
      // 買盤力道 & 賣盤力道
      const buyPresure = []
      const salePresure = []
      for (let i = 0; i < ttlBuyPlate.length; i++) {
        buyPresure.push(
          Math.floor(vol[i] * (ttlBuyPlate[i] / (ttlBuyPlate[i] + ttlSalePlate[i])))
        )
        salePresure.push(
          Math.floor(
            vol[i] * (ttlSalePlate[i] / (ttlBuyPlate[i] + ttlSalePlate[i]))
          )
        )
      }
    
      //   // 20d 總買盤 & 總賣盤
      const date20d = date.slice(20)
      const buyPresure20d = []
      const salePresure20d = []
      for (let i = 0; i < buyPresure.length - 20; i++) {
        let buy20d = 0
        let sale20d = 0
        for (let j = i; j < i + 20; j++) {
          buy20d += buyPresure[j]
          sale20d += salePresure[j]
        }
        buyPresure20d.push(buy20d)
        salePresure20d.push(sale20d)
      }
    
      // 買賣壓力
      const ttlPresure = []
      for (let i = 0; i < buyPresure20d.length; i++) {
        ttlPresure.push([
          new Date(date20d[i]).getTime(),
          salePresure20d[i] / buyPresure20d[i]
        ])
        // ttlPresure.push(salePresure20d[i] / buyPresure20d[i])
      }
      const lastEle = ttlPresure[ttlPresure.length-1]
      return lastEle
}

/**
 * presureCalculateFull — 與 presureCalculate 計算邏輯完全相同，
 * 差別在於回傳「完整的 ttlPresure 陣列」而非只取最後一筆。
 *
 * 用途：pressure-first-cross API 需要掃描整段時序，
 * 判斷近 30 個交易日內哪一天是「第一次下穿 0.6」的交叉點。
 * sync.js 用的 presureCalculate 只需要最新值，維持不動以免影響批次同步邏輯。
 *
 * @param {Array} res - 日K資料陣列（已按日期升序排列），每筆需含 open/max/min/close/Trading_Volume/date
 * @returns {Array<[timestamp, value]>} 每一天的 [unix ms, 賣壓/買壓 比值]
 */
export function presureCalculateFull(res) {
    // 計算每日收盤價差，標記漲跌方向
    for (let i = 1; i < res.length; i++) {
        const nowClose = res[i].close
        const preClose = res[i - 1].close
        res[i].def = nowClose - preClose
    }

    const vol = []
    const date = []
    const buyPlate1 = []
    const buyPlate2 = []
    const salePlate1 = []
    const salePlate2 = []

    // 依漲跌方向拆解買盤 / 賣盤組成區間
    // 上漲日：缺口偏買方；下跌日：缺口偏賣方
    for (let i = 1; i < res.length; i++) {
        if (res[i].def > 0) {
            vol.push(res[i].Trading_Volume)
            date.push(res[i].date)
            buyPlate1.push(Math.abs(res[i].open - res[i - 1].close))  // 向上跳空區間
            buyPlate2.push(Math.abs(res[i].max - res[i].min))         // 當日振幅
            salePlate1.push(Math.abs(res[i].open - res[i].min))       // 開盤到最低
            salePlate2.push(Math.abs(res[i].max - res[i].close))      // 最高到收盤
        } else {
            date.push(res[i].date)
            vol.push(res[i].Trading_Volume)
            buyPlate1.push(Math.abs(res[i].max - res[i].open))        // 最高到開盤
            buyPlate2.push(Math.abs(res[i].close - res[i].min))       // 收盤到最低
            salePlate1.push(Math.abs(res[i - 1].close - res[i].open)) // 向下跳空區間
            salePlate2.push(Math.abs(res[i].max - res[i].min))        // 當日振幅
        }
    }

    // 合計每日買盤 / 賣盤總量（兩個分量相加）
    const ttlBuyPlate = []
    const ttlSalePlate = []
    for (let i = 0; i < buyPlate1.length; i++) {
        ttlBuyPlate.push(buyPlate1[i] + buyPlate2[i])
        ttlSalePlate.push(salePlate1[i] + salePlate2[i])
    }

    // 以成交量按買賣比例分配，得出每日買力 / 賣力（張數）
    const buyPresure = []
    const salePresure = []
    for (let i = 0; i < ttlBuyPlate.length; i++) {
        buyPresure.push(Math.floor(vol[i] * (ttlBuyPlate[i] / (ttlBuyPlate[i] + ttlSalePlate[i]))))
        salePresure.push(Math.floor(vol[i] * (ttlSalePlate[i] / (ttlBuyPlate[i] + ttlSalePlate[i]))))
    }

    // 以 20 日滾動窗口累加買力 / 賣力，平滑短期波動
    // date20d 對應到第 21 天起，因為前 20 天都是窗口的起始資料
    const date20d = date.slice(20)
    const buyPresure20d = []
    const salePresure20d = []
    for (let i = 0; i < buyPresure.length - 20; i++) {
        let buy20d = 0
        let sale20d = 0
        for (let j = i; j < i + 20; j++) {
            buy20d += buyPresure[j]
            sale20d += salePresure[j]
        }
        buyPresure20d.push(buy20d)
        salePresure20d.push(sale20d)
    }

    // 最終壓力值 = 20日累計賣力 / 20日累計買力
    // > 1 代表賣壓大，< 1 代表買壓大，< 0.6 為強買訊號
    // 回傳完整序列（每筆為 [unix timestamp ms, 壓力值]），供呼叫端自行切片分析
    const ttlPresure = []
    for (let i = 0; i < buyPresure20d.length; i++) {
        ttlPresure.push([new Date(date20d[i]).getTime(), salePresure20d[i] / buyPresure20d[i]])
    }

    return ttlPresure
}

export default presureCalculate
