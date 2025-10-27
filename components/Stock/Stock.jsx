import styles from './Stock.module.scss'
import { useEffect, useState } from 'react'
import { getStockInfo } from '../..//lib/api/stocks.js'
import { useRouter } from "next/router";
import PresureStick from '../PresureStick/PresureStick';
import { useSelector } from 'react-redux';

const Stock = ({ stockId: propStockId, stockName: propStockName }) => {
  const router = useRouter()
  const id = propStockId || router.query.id
  const { candleContainer , container } = styles
  const [stockDetail, setStockDetail] = useState([])
  const stockInfo = useSelector(state => state.stockInfoReducer)

  const getStockInfoAsync = async id => {
    try {
      const data = await getStockInfo(id)
      setStockDetail(data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    getStockInfoAsync(id)
  }, [id])

  return (
    <div className={container}>
      <div className={candleContainer}>
          <PresureStick
            stockDetail={stockDetail}
            stockId={id}
            stockInfo={stockInfo}
          />
      </div>
    </div>
  )
}

export default Stock
