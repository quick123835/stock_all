import { getAllStocks } from '../lib/api/stocks'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import ListItem from '../components/ListItem'
import CategoryStockModal from '../components/CategoryStockModal/CategoryStockModal'
import { getTotalStocks } from '../lib/redux/actions/actions'
import { useRouter } from 'next/router'

const btnStyle = {
  background: '#0070cc',
  color: '#ffffff',
  border: 'none',
  borderRadius: '999px',
  padding: '14px 40px',
  fontSize: '18px',
  fontWeight: 500,
  letterSpacing: '0.4px',
  cursor: 'pointer',
  transition: 'background 180ms ease, transform 180ms ease, box-shadow 180ms ease',
}

const btnHoverStyle = {
  background: '#1eaedb',
  border: '2px solid #ffffff',
  boxShadow: '0 0 0 2px #0070cc',
  transform: 'scale(1.2)',
}

function HeroButton ({ children, onClick, disabled }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      style={hovered ? { ...btnStyle, ...btnHoverStyle } : btnStyle}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  )
}

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

      const uniqueMap = new Map()
      data.forEach(item => {
        const id = String(item.stock_id || '')
        const type = String(item.type || '').toLowerCase()
        const category = String(item.industry_category || '')

        const isFourDigits = id.length === 4
        const excludeKeywords = ['ETF', 'Index', '指數', '受益證券', '存託憑證', '權證', '基金']
        const isNotExcluded = !excludeKeywords.some(key => category.includes(key))
        const isMainMarket = type === 'twse' || type === 'tpex'

        if (isFourDigits && isNotExcluded && isMainMarket) {
          uniqueMap.set(id, item)
        }
      })

      const uniqueArray = Array.from(uniqueMap.values())
      uniqueArray.sort((a, b) => a.stock_id.localeCompare(b.stock_id))

      dispatch(getTotalStocks(uniqueArray))
      setStocks(uniqueArray)
      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }


  const handleCalculateAll = async () => {
    setCalculating(true)
    setRenderList([])

    try {
      const res = await fetch('/api/pressure')
      const data = await res.json()
      setRenderList(
        data.map(item => ({
          id: item.stock_id,
          name: item.stock_name,
          pressure: [null, item.pressure],
        }))
      )
    } catch (error) {
      console.error('載入壓力資料失敗：', error)
    } finally {
      setCalculating(false)
    }
  }

  const handleStockClick = (id, name) => {
    setSelectedStock({ id, name })
    router.push({ pathname: '/', query: { id, name } }, undefined, { shallow: true })
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

  const showHero = !calculating && renderList.length === 0
  const showCards = !calculating && renderList.length > 0

  return (
    <div>
      {/* Hero Section */}
      {showHero && (
        <section
          style={{
            background: 'linear-gradient(180deg, #121314 0%, #000000 100%)',
            minHeight: 'calc(100vh - 56px)',
            marginTop: '56px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '96px 48px',
            textAlign: 'center',
          }}
        >
          {loading ? (
            <p style={{ color: '#cccccc', fontSize: '18px', fontWeight: 400 }}>
              載入股票清單中...
            </p>
          ) : (
            <>
              <h1
                style={{
                  color: '#ffffff',
                  fontSize: '54px',
                  fontWeight: 300,
                  letterSpacing: '-0.1px',
                  lineHeight: 1.25,
                  margin: '0 0 16px',
                }}
              >
                買賣力道基地
              </h1>
              <p
                style={{
                  color: '#cccccc',
                  fontSize: '18px',
                  fontWeight: 400,
                  letterSpacing: '0.1px',
                  lineHeight: 1.5,
                  margin: '0 0 48px',
                  maxWidth: '480px',
                }}
              >
                台灣股市買賣壓力分析工具．共 {stocks.length} 檔股票
              </p>
              <HeroButton onClick={handleCalculateAll}>
                一鍵計算所有股票力道
              </HeroButton>
            </>
          )}
        </section>
      )}

      {/* Calculating State */}
      {calculating && (
        <section
          style={{
            background: 'linear-gradient(180deg, #121314 0%, #000000 100%)',
            minHeight: 'calc(100vh - 56px)',
            marginTop: '56px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '96px 48px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#cccccc', fontSize: '22px', fontWeight: 300, margin: '0 0 16px' }}>
            載入力道資料中...
          </p>
        </section>
      )}

      {/* Results Grid */}
      {showCards && (
        <section
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f5f7fa 100%)',
            marginTop: '56px',
            padding: '64px 32px 96px',
          }}
        >
          {/* Section header */}
          <div style={{ maxWidth: '1280px', margin: '0 auto 48px' }}>
            <h2
              style={{
                fontSize: '35px',
                fontWeight: 300,
                color: '#000000',
                lineHeight: 1.25,
                margin: '0 0 8px',
              }}
            >
              買賣力道結果
            </h2>
            <p style={{ fontSize: '14px', fontWeight: 400, color: '#6b6b6b', margin: 0 }}>
              顯示力道值 ≤ 0.6 的股票，共 {renderList.filter(i => {
                const v = Number(i.pressure?.[1])
                return !isNaN(v) && v <= 0.6
              }).length} 檔
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '24px',
              justifyContent: 'flex-start',
              maxWidth: '1280px',
              margin: '0 auto',
            }}
          >
            {renderList.map((item, index) => (
              <ListItem key={index} item={item} onStockClick={handleStockClick} />
            ))}
          </div>
        </section>
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
