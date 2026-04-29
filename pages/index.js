import { getAllStocks } from '../lib/api/stocks'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import ListItem from '../components/ListItem'
import CategoryStockModal from '../components/CategoryStockModal/CategoryStockModal'
import { getTotalStocks } from '../lib/redux/actions/actions'
import { useRouter } from 'next/router'
import homeStyles from '../styles/Home.module.scss'

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
  // activeTab: 目前顯示哪個 tab（'current' = 現在低於 0.6 | 'first-cross' = 第一次低於 0.6）
  const [activeTab, setActiveTab] = useState('current')
  // firstCrossList: 「第一次低於 0.6」tab 的股票清單，格式同 renderList
  const [firstCrossList, setFirstCrossList] = useState([])
  // firstCrossLoading: 「第一次低於 0.6」資料載入中的狀態，防止重複打 API
  const [firstCrossLoading, setFirstCrossLoading] = useState(false)
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
          pressure: [new Date(item.pressure_date).getTime(), item.pressure],
        }))
      )
    } catch (error) {
      console.error('載入壓力資料失敗：', error)
    } finally {
      setCalculating(false)
    }
  }

  /**
   * 切換 tab 時呼叫。
   * 切到「第一次低於 0.6」時才 lazy load /api/pressure-first-cross，
   * 已載入過（firstCrossList 非空）就不重複打 API。
   * 只把「現在低於 0.6」的股票 ID 傳給 API，縮小計算範圍、加快回應速度。
   * pressure 欄位故意對齊 ListItem 的 [timestamp, value] 格式，讓卡片元件可以直接複用。
   */
  const handleTabChange = async (tab) => {
    setActiveTab(tab)
    if (tab === 'first-cross' && firstCrossList.length === 0 && !firstCrossLoading) {
      setFirstCrossLoading(true)
      try {
        // 從現有結果撈出目前壓力值 <= 0.6 的股票 ID，只對這些股票做首次下穿計算
        const belowIds = renderList
          .filter(i => {
            const v = Number(i.pressure?.[1])
            return !isNaN(v) && v <= 0.6
          })
          .map(i => i.id)

        const res = await fetch('/api/pressure-first-cross', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: belowIds }),
        })
        const data = await res.json()
        setFirstCrossList(
          data.map(item => ({
            id: item.stock_id,
            name: item.stock_name,
            // cross_date 是 unix ms，cross_value 是壓力值，對齊 ListItem 的 pressure prop 格式
            pressure: [item.cross_date, item.cross_value],
          }))
        )
      } catch (error) {
        console.error('載入首次下穿資料失敗：', error)
      } finally {
        setFirstCrossLoading(false)
      }
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
          className={homeStyles.heroSection}
          style={{
            background: 'linear-gradient(180deg, #121314 0%, #000000 100%)',
            minHeight: 'calc(100vh - 56px)',
            marginTop: '56px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          {loading ? (
            <p style={{ color: '#cccccc', fontSize: '18px', fontWeight: 400 }}>
              載入股票清單中...
            </p>
          ) : (
            <>
              <h1 className={homeStyles.heroTitle}>
                買賣力道基地
              </h1>
              <p className={homeStyles.heroSubtitle}>
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
          className={homeStyles.heroSection}
          style={{
            background: 'linear-gradient(180deg, #121314 0%, #000000 100%)',
            minHeight: 'calc(100vh - 56px)',
            marginTop: '56px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
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
          className={homeStyles.resultsSection}
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f5f7fa 100%)',
            marginTop: '56px',
          }}
        >
          {/* Section header */}
          <div style={{ maxWidth: '1280px', margin: '0 auto 32px' }}>
            <h2 className={homeStyles.resultsTitle}>
              買賣力道結果
            </h2>

            {/* Tabs */}
            <div className={homeStyles.tabBar}>
              {[
                { key: 'current', label: '現在低於 0.6' },
                { key: 'first-cross', label: '第一次低於 0.6' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`${homeStyles.tabBtn} ${activeTab === tab.key ? homeStyles.tabBtnActive : homeStyles.tabBtnInactive}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab: 現在低於 0.6 */}
          {activeTab === 'current' && (
            <>
              <div style={{ maxWidth: '1280px', margin: '0 auto 24px' }}>
                <p style={{ fontSize: '14px', fontWeight: 400, color: '#6b6b6b', margin: 0 }}>
                  顯示最新力道值 ≤ 0.6 的股票，共 {renderList.filter(i => {
                    const v = Number(i.pressure?.[1])
                    return !isNaN(v) && v <= 0.6
                  }).length} 檔
                </p>
              </div>
              <div className={homeStyles.cardsGrid}>
                {renderList.map((item, index) => (
                  <ListItem key={index} item={item} onStockClick={handleStockClick} />
                ))}
              </div>
            </>
          )}

          {/* Tab: 第一次低於 0.6 */}
          {activeTab === 'first-cross' && (
            <>
              <div style={{ maxWidth: '1280px', margin: '0 auto 24px' }}>
                <p style={{ fontSize: '14px', fontWeight: 400, color: '#6b6b6b', margin: 0 }}>
                  {firstCrossLoading
                    ? '計算中...'
                    : `近 30 個交易日內首次下穿 0.6 的股票，共 ${firstCrossList.length} 檔`}
                </p>
              </div>
              {firstCrossLoading ? (
                <div style={{ maxWidth: '1280px', margin: '0 auto', color: '#6b6b6b', fontSize: '18px', fontWeight: 300 }}>
                  計算首次下穿資料中...
                </div>
              ) : (
                <div className={homeStyles.cardsGrid}>
                  {firstCrossList.map((item, index) => (
                    <ListItem key={index} item={item} onStockClick={handleStockClick} />
                  ))}
                </div>
              )}
            </>
          )}
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
