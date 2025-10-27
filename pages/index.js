import { getAllStocks, getStockInfo } from '../lib/api/stocks'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import ListItem from '../components/ListItem'
import CategoryStockModal from '../components/CategoryStockModal/CategoryStockModal'
import { getTotalStocks, StockInfo } from '../lib/redux/actions/actions'
import presureCalculate from '../lib/presureCalculate'
import { useRouter } from 'next/router'

const Home = () => {
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [stocks, setStocks] = useState([])
  const [renderList, setRenderList] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStock, setSelectedStock] = useState({ id: '', name: '' })
  
  const dispatch = useDispatch()
  const router = useRouter()
  const allStocks = useSelector(state => state.getTtlStocksReducer)

  const getAllStocksAsync = async () => {
    try {
      const { data } = await getAllStocks()

      // 刪除基金及重複的
      const filterData = data.filter(item => 
        item.industry_category !== 'ETF' && 
        item.industry_category !== 'Index' && 
        item.industry_category !== '上櫃指數股票型基金(ETF)' && 
        item.industry_category !== 'ETN' && 
        item.industry_category !== '指數投資證券(ETN)' && 
        item.industry_category !== '受益證券' &&
        item.industry_category !== '大盤'
      )
      let uniqueArray = Array.from(new Map(filterData.map(item => [item.stock_id, item])).values())
      
      dispatch(getTotalStocks(uniqueArray))
      setStocks(uniqueArray)
      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const getStockInfoAsync = async (stock) => {
    try {
      const res = await getStockInfo(stock.stock_id)
      if (res) {
        dispatch(StockInfo(res))
        const pressure = presureCalculate(res)
        const ans = renderList.filter(i => i.id === stock.stock_id)
        if (ans.length === 0) {
          setRenderList(renderList => [
            ...renderList,
            {
              name: stock.stock_name,
              id: stock.stock_id,
              pressure: pressure
            }
          ])
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleCalculateAll = async () => {
    setCalculating(true)
    setRenderList([])
    
    const stockInfoPromises = stocks.map(stock => getStockInfoAsync(stock))
    Promise.all(stockInfoPromises)
      .then(() => {
        setCalculating(false)
      })
      .catch(error => {
        console.error(error)
        setCalculating(false)
      })
  }

  const handleStockClick = (id, name) => {
    setSelectedStock({ id, name })
    router.push({
      pathname: '/',
      query: { id, name }
    }, undefined, { shallow: true })
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedStock({ id: '', name: '' })
    router.push('/', undefined, { shallow: true })
  }

  useEffect(() => {
    if (allStocks) {
      setStocks(allStocks)
      setLoading(false)
    } else {
      getAllStocksAsync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      {loading && (
        <div className='position-absolute w-100 h-100 d-flex justify-content-center align-items-center'>
          載入股票清單中...
        </div>
      )}

      {!loading && renderList.length === 0 && !calculating && (
        <div className='d-flex flex-column align-items-center justify-content-center' style={{ marginTop: '100px' }}>
          <div className='mb-3 text-xl'>共 {stocks.length} 檔股票</div>
          <button 
            className='px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-lg font-semibold'
            onClick={handleCalculateAll}
          >
            一鍵計算所有股票力道
          </button>
        </div>
      )}

      {calculating && (
        <div className='position-absolute w-100 h-100 d-flex justify-content-center align-items-center'>
          一鍵力道計算中...（已完成 {renderList.length}/{stocks.length}）
        </div>
      )}

      {!calculating && renderList.length > 0 && (
        <div style={{
          marginTop: '65px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          overflowY: 'scroll',
          justifyContent: 'center'
        }}>
          {renderList.map((item, index) => (
            <ListItem 
              item={item}
              key={index}
              onStockClick={handleStockClick}
            />
          ))}
        </div>
      )}

      <CategoryStockModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        stockId={selectedStock.id}
        stockName={selectedStock.name}
      />
    </div>
  )
}

export default Home
