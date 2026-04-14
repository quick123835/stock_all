import styles from './Stock.module.scss'
import { useEffect, useState } from 'react'
import { getStockInfo, getFinancialStatements, getMonthRevenue } from '../../lib/api/stocks.js'
import { useRouter } from 'next/router'
import PresureStick from '../PresureStick/PresureStick'
import { useSelector, useDispatch } from 'react-redux'
import { setFinancialStatements, setMonthRevenue } from '../../lib/redux/actions/actions'
import clsx from 'clsx'

const TABS = ['壓力圖', '基本面', '籌碼面']
const FUNDAMENTAL_SUBTABS = ['EPS', '月營收']

const monthToQ = { '03': 'Q1', '06': 'Q2', '09': 'Q3', '12': 'Q4' }

const EpsTable = ({ financialData, tableStyle }) => {
  const epsData = (financialData || []).filter(d => d.type === 'EPS')
  const currentYear = String(new Date().getFullYear())
  const byYear = { [currentYear]: {} }
  epsData.forEach(({ date, value }) => {
    const [year, month] = date.split('-')
    const q = monthToQ[month] || `M${month}`
    if (!byYear[year]) byYear[year] = {}
    byYear[year][q] = value
  })
  const years = Object.keys(byYear).sort((a, b) => b - a)

  return (
    <table className={tableStyle}>
      <thead>
        <tr>
          <th>年份</th>
          <th>Q1</th>
          <th>Q2</th>
          <th>Q3</th>
          <th>Q4</th>
          <th>全年合計</th>
        </tr>
      </thead>
      <tbody>
        {years.length > 0 ? years.map(year => {
          const row = byYear[year]
          const total = ['Q1', 'Q2', 'Q3', 'Q4'].reduce((sum, q) => sum + (row[q] ?? 0), 0)
          return (
            <tr key={year}>
              <td>{year}</td>
              {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                <td key={q}>{row[q] ?? '-'}</td>
              ))}
              <td>{total.toFixed(2)}</td>
            </tr>
          )
        }) : (
          <tr>
            <td colSpan={6} style={{ textAlign: 'center', color: '#999' }}>載入中...</td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

const RevenueTable = ({ revenueData, tableStyle, wrapperStyle }) => {
  const raw = revenueData || []

  // key: "YYYY-M" → revenue
  const revenueMap = {}
  raw.forEach(({ revenue_year, revenue_month, revenue }) => {
    revenueMap[`${revenue_year}-${revenue_month}`] = revenue
  })

  const calc = (cur, prev) =>
    prev && prev !== 0 ? (((cur - prev) / prev) * 100).toFixed(2) : '-'

  // 由新到舊
  const data = [...raw].reverse().map(item => {
    const { revenue_year, revenue_month, revenue } = item
    const prevMonth = revenue_month === 1
      ? `${revenue_year - 1}-12`
      : `${revenue_year}-${revenue_month - 1}`
    const sameMonthLastYear = `${revenue_year - 1}-${revenue_month}`

    return {
      ...item,
      mom: calc(revenue, revenueMap[prevMonth]),         // 月增率
      yoy: calc(revenue, revenueMap[sameMonthLastYear]), // 年增率
    }
  })

  return (
    <div className={wrapperStyle}>
      <table className={tableStyle}>
        <thead>
          <tr>
            <th style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f5f5f5' }}>年月</th>
            <th style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f5f5f5' }}>月營收</th>
            <th style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f5f5f5' }}>月增率 (%)</th>
            <th style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f5f5f5' }}>年增率 (%)</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? data.map((item, i) => (
            <tr key={i}>
              <td>{`${item.revenue_year}/${String(item.revenue_month).padStart(2, '0')}`}</td>
              <td>{item.revenue?.toLocaleString() ?? '-'}</td>
              <td style={{ color: item.mom === '-' ? '#999' : item.mom >= 0 ? '#d32f2f' : '#388e3c' }}>
                {item.mom === '-' ? '-' : `${item.mom > 0 ? '+' : ''}${item.mom}`}
              </td>
              <td style={{ color: item.yoy === '-' ? '#999' : item.yoy >= 0 ? '#d32f2f' : '#388e3c' }}>
                {item.yoy === '-' ? '-' : `${item.yoy > 0 ? '+' : ''}${item.yoy}`}
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>載入中...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

const Stock = ({ stockId: propStockId, stockName: propStockName }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const id = propStockId || router.query.id
  const { container, tabs, tab, activeTab, tabContent, subTabs, subTab, activeSubTab, table, revenueWrapper } = styles
  const [stockDetail, setStockDetail] = useState([])
  const [currentTab, setCurrentTab] = useState('壓力圖')
  const [fundamentalSubTab, setFundamentalSubTab] = useState('EPS')
  const stockInfo = useSelector(state => state.stockInfoReducer)
  const financialData = useSelector(state => state.getFinancialStatementsReducer)
  const revenueData = useSelector(state => state.getMonthRevenueReducer)

  useEffect(() => {
    if (!id) return
    const fetchAll = async () => {
      try {
        const [stockData, financial, revenue] = await Promise.all([
          getStockInfo(id),
          getFinancialStatements(id),
          getMonthRevenue(id),
        ])
        setStockDetail(stockData)
        dispatch(setFinancialStatements(financial))
        dispatch(setMonthRevenue(revenue))
      } catch (error) {
        console.error(error)
      }
    }
    fetchAll()
  }, [id])

  return (
    <div className={container}>
      <div className={tabs}>
        {TABS.map(t => (
          <button
            key={t}
            className={clsx(tab, currentTab === t && activeTab)}
            onClick={() => setCurrentTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={tabContent}>
        {currentTab === '壓力圖' && (
          <PresureStick
            stockDetail={stockDetail}
            stockId={id}
            stockInfo={stockInfo}
          />
        )}

        {currentTab === '基本面' && (
          <>
            <div className={subTabs}>
              {FUNDAMENTAL_SUBTABS.map(t => (
                <button
                  key={t}
                  className={clsx(subTab, fundamentalSubTab === t && activeSubTab)}
                  onClick={() => setFundamentalSubTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            {fundamentalSubTab === 'EPS' && (
              <EpsTable financialData={financialData} tableStyle={table} />
            )}
            {fundamentalSubTab === '月營收' && (
              <RevenueTable revenueData={revenueData} tableStyle={table} wrapperStyle={revenueWrapper} />
            )}
          </>
        )}

        {currentTab === '籌碼面' && (
          <div style={{ color: '#999', padding: '32px', textAlign: 'center' }}>
            籌碼面資料待開發
          </div>
        )}
      </div>
    </div>
  )
}

export default Stock
