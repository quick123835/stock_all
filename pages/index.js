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
      const { data } = await getAllStocks();
  
      // 1. 建立 Map 進行去重 (以 stock_id 為 Key)
      const uniqueMap = new Map();
  
      data.forEach(item => {
        const id = String(item.stock_id || '');
        const type = String(item.type || '').toLowerCase(); // 統一轉小寫
        const category = String(item.industry_category || '');
  
        // 過濾邏輯：
        // A. 必須是 4 碼 (濾掉權證、受益證券)
        const isFourDigits = id.length === 4;
  
        // B. 產業別不含排除字眼 (濾掉 ETF、指數)
        const excludeKeywords = ['ETF', 'Index', '指數', '受益證券', '存託憑證', '權證', '基金'];
        const isNotExcluded = !excludeKeywords.some(key => category.includes(key));
  
        // C. 市場別鎖定 (這是關鍵！濾掉 ESB 興櫃)
        // 如果數字還是太多，代表裡面有 'esb'，我們只留 'twse' 和 'tpex'
        const isMainMarket = (type === 'twse' || type === 'tpex');
  
        if (isFourDigits && isNotExcluded && isMainMarket) {
          // 如果重複出現，Map 會自動覆蓋，確保 unique
          uniqueMap.set(id, item);
        }
      });
  
      // 轉回陣列並排序
      const uniqueArray = Array.from(uniqueMap.values());
      uniqueArray.sort((a, b) => a.stock_id.localeCompare(b.stock_id));
  
      console.log("最終精確家數：", uniqueArray.length);
      console.log(uniqueArray.filter(s => s.type === 'esb'))
      console.log(new Set(uniqueArray.map(s => s.stock_id)).size === uniqueArray.length)
  
      dispatch(getTotalStocks(uniqueArray));
      setStocks(uniqueArray);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const getStockInfoAsync = async (stock) => {
    try {
      const res = await getStockInfo(stock.stock_id)
      if (res) {
        dispatch(StockInfo(res))
        const pressure = presureCalculate(res)
        
        setRenderList(prevList => {
          // 在函數式更新內部檢查，避免 race condition
          const exists = prevList.some(i => i.id === stock.stock_id)
          if (exists) return prevList
          
          return [
            ...prevList,
            {
              name: stock.stock_name,
              id: stock.stock_id,
              pressure: pressure
            }
          ]
        })
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleCalculateAll = async () => {
    setCalculating(true)
    setRenderList([])
  
    const batchSize = 10 // 每次同時發送 10 個請求，可依電腦效能調整
    const delay = (ms) => new Promise(r => setTimeout(r, ms))
  
    try {
      for (let i = 0; i < stocks.length; i += batchSize) {
        const batch = stocks.slice(i, i + batchSize)
        await Promise.all(batch.map(stock => getStockInfoAsync(stock)))
  
        // 可選：給伺服器或瀏覽器一點喘息時間（避免網路壓力過大）
        await delay(100)
  
        console.log(`✅ 已完成第 ${(i / batchSize) + 1} 批 (${i + batch.length}/${stocks.length})`)
      }
    } catch (error) {
      console.error('批次執行錯誤：', error)
    } finally {
      setCalculating(false)
    }
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
