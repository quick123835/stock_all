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

export default presureCalculate