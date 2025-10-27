import styles from './PresureStick.module.scss'
import Highcharts from 'highcharts/highstock'
import HighchartsReact from 'highcharts-react-official'
import { useEffect, useState } from 'react'
import { useRouter } from "next/dist/client/router"

const PresureStick = ({ stockDetail, stockName, stockId , stockInfo }) => {
  const router = useRouter()
  const {id , name} = router.query
  const [chartOptions, setChartOptions] = useState({})

  // 收盤價差
  for (let i = 1; i < stockDetail.length; i++) {
    const nowClose = stockDetail[i].close
    const preClose = stockDetail[i - 1].close
    const def = nowClose - preClose
    stockDetail[i].def = def
  }

  const vol = []
  const date = []
  const buyPlate1 = []
  const buyPlate2 = []
  const salePlate1 = []
  const salePlate2 = []
  //買盤 & 賣盤
  for (let i = 1; i < stockDetail.length; i++) {
    if (stockDetail[i].def > 0) {
      vol.push(stockDetail[i].Trading_Volume)
      date.push(stockDetail[i].date)
      // 買盤1
      buyPlate1.push(Math.abs(stockDetail[i].open - stockDetail[i - 1].close))
      // 買盤2
      buyPlate2.push(Math.abs(stockDetail[i].max - stockDetail[i].min))
      // 賣盤1
      salePlate1.push(Math.abs(stockDetail[i].open - stockDetail[i].min))
      // 賣盤2
      salePlate2.push(Math.abs(stockDetail[i].max - stockDetail[i].close))
    } else {
      date.push(stockDetail[i].date)
      vol.push(stockDetail[i].Trading_Volume)

      buyPlate1.push(Math.abs(stockDetail[i].max - stockDetail[i].open))

      buyPlate2.push(Math.abs(stockDetail[i].close - stockDetail[i].min))

      salePlate1.push(Math.abs(stockDetail[i - 1].close - stockDetail[i].open))

      salePlate2.push(Math.abs(stockDetail[i].max - stockDetail[i].min))
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

  // 成交量
  const volumnData = stockDetail.map(stock => {
    return [
      new Date(stock.date).getTime(),
      Math.floor(stock.Trading_Volume / 1000)
    ]
  })

  useEffect(() => {
    const stockKLine = stockDetail.map(stock => {
      return [
        new Date(stock.date).getTime(),
        stock.open,
        stock.max,
        stock.min,
        stock.close
      ]
    })
    // 定义图表的配置选项
    const options = {
      rangeSelector: {
        selected: 2,
        buttons: [
          {
            type: 'month',
            count: 1,
            text: '1月'
          },
          {
            type: 'month',
            count: 3,
            text: '3月'
          },
          {
            type: 'all',
            text: '全部'
          }
        ]
      },
      title: {
        text: `${id} ${name}`
      },
      chart: {
        height: 600, // 设置整个图表的高度
        width: 800
      },
      yAxis: [
        {
          // K线图
          height: '70%', // 设置K线图所占区域的高度
          title: {
            text: '价格'
          }
        },
        {
          // 向量图
          title: {
            text: '買賣力道'
          },
          opposite: false, // 将向量图放置在图表的左侧
          min: 0,
          max: 2,
          tickInterval: 0.2,
          plotLines: [
            {
              value: 0.6, // 红线的位置
              color: 'red', // 红线的颜色
              width: 2, // 线的宽度
              zIndex: 5
            },
            {
              value: 1.4, // 绿线的位置
              color: 'green', // 绿线的颜色
              width: 2,
              zIndex: 5 // 线的宽度
            }
          ]
        },
        {
          // 第二个y轴配置，用于成交量图
          top: '75%', // 设置成交量图的顶部位置
          height: '25%', // 设置成交量图所占区域的高度
          title: {
            text: '成交量'
          },
          offset: 0 // 将成交量图的顶部与K线图的底部对齐
        }
      ],
      series: [
        {
          type: 'candlestick',
          name: '股票价格',
          data: stockKLine, // 这里填入K线图数据
          yAxis: 0 // 使用第一个y轴来显示K线图
        },
        {
          type: 'spline',
          name: '買賣力道',
          data: ttlPresure, // 这里填入5日移动平均线的数据
          yAxis: 1
        },
        {
          type: 'column',
          name: '成交量',
          data: volumnData, // 这里填入成交量数据
          yAxis: 2 // 使用第二个y轴来显示成交量图
        }
      ],
      accessibility: {
        enabled: false // 關閉可訪問性功能
      }
    }
    setChartOptions(options)
  }, [stockDetail, stockName])

  const { pic, category } = styles
  return (
    <>
      {/* <h3 className={category}>{currentStock.category}</h3> */}
      <div className={pic}>
        <HighchartsReact
          highcharts={Highcharts}
          options={chartOptions}
          constructorType={'stockChart'}
        />
      </div>
    </>
  )
}

export default PresureStick
