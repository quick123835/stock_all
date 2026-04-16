import styles from './Stock.module.scss'
import { useEffect, useState } from 'react'
import {
  getStockInfo, getFinancialStatements, getMonthRevenue,
  getMarginShortSale, getInstitutionalInvestors
} from '../../lib/api/stocks.js'
import { useRouter } from 'next/router'
import PresureStick from '../PresureStick/PresureStick'
import { useSelector } from 'react-redux'
import clsx from 'clsx'

const TABS = ['壓力圖', '基本面', '籌碼面']
const FUNDAMENTAL_SUBTABS = ['EPS', '月營收']
const CHIPS_SUBTABS = ['融資融券', '三大法人']

const monthToQ = { '03': 'Q1', '06': 'Q2', '09': 'Q3', '12': 'Q4' }

const stickyTh = { position: 'sticky', top: 0, zIndex: 1, background: '#f5f5f5' }

/* ── EPS 表 ── */
const EpsTable = ({ financialData, tableStyle }) => {
  const epsData = (financialData || []).filter(d => d.type === 'EPS')
  console.log('[EpsTable] financialData length:', financialData?.length, 'epsData:', epsData)
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
          <th>年份</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>全年合計</th>
        </tr>
      </thead>
      <tbody>
        {years.map(year => {
          const row = byYear[year]
          const total = ['Q1','Q2','Q3','Q4'].reduce((s, q) => s + (row[q] ?? 0), 0)
          return (
            <tr key={year}>
              <td>{year}</td>
              {['Q1','Q2','Q3','Q4'].map(q => <td key={q}>{row[q] ?? '-'}</td>)}
              <td>{total.toFixed(2)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/* ── 月營收表 ── */
const RevenueTable = ({ revenueData, tableStyle, wrapperStyle }) => {
  const raw = revenueData || []
  const revenueMap = {}
  raw.forEach(({ revenue_year, revenue_month, revenue }) => {
    revenueMap[`${revenue_year}-${revenue_month}`] = revenue
  })
  const calc = (cur, prev) =>
    prev && prev !== 0 ? (((cur - prev) / prev) * 100).toFixed(2) : '-'
  const data = [...raw].reverse().map(item => {
    const { revenue_year, revenue_month, revenue } = item
    const prevMonth = revenue_month === 1 ? `${revenue_year - 1}-12` : `${revenue_year}-${revenue_month - 1}`
    return {
      ...item,
      mom: calc(revenue, revenueMap[prevMonth]),
      yoy: calc(revenue, revenueMap[`${revenue_year - 1}-${revenue_month}`]),
    }
  })
  const colorCell = val => ({ color: val === '-' ? '#999' : val >= 0 ? '#d32f2f' : '#388e3c' })
  const fmt = val => val === '-' ? '-' : `${val > 0 ? '+' : ''}${val}`
  return (
    <div className={wrapperStyle}>
      <table className={tableStyle}>
        <thead>
          <tr>
            <th style={stickyTh}>年月</th>
            <th style={stickyTh}>月營收</th>
            <th style={stickyTh}>月增率 (%)</th>
            <th style={stickyTh}>年增率 (%)</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? data.map((item, i) => (
            <tr key={i}>
              <td>{`${item.revenue_year}/${String(item.revenue_month).padStart(2, '0')}`}</td>
              <td>{item.revenue?.toLocaleString() ?? '-'}</td>
              <td style={colorCell(item.mom)}>{fmt(item.mom)}</td>
              <td style={colorCell(item.yoy)}>{fmt(item.yoy)}</td>
            </tr>
          )) : (
            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>載入中...</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/* ── 融資融券表 ── */
const MarginTable = ({ data, tableStyle, wrapperStyle }) => {
  const rows = [...(data || [])].reverse()
  return (
    <div className={wrapperStyle}>
      <table className={tableStyle}>
        <thead>
          <tr>
            <th style={stickyTh}>日期</th>
            <th style={stickyTh}>融資買進</th>
            <th style={stickyTh}>融資賣出</th>
            <th style={stickyTh}>融資餘額</th>
            <th style={stickyTh}>融券買進</th>
            <th style={stickyTh}>融券賣出</th>
            <th style={stickyTh}>融券餘額</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows.map((item, i) => (
            <tr key={i}>
              <td>{item.date}</td>
              <td>{item.MarginPurchaseBuy?.toLocaleString() ?? '-'}</td>
              <td>{item.MarginPurchaseSell?.toLocaleString() ?? '-'}</td>
              <td>{item.MarginPurchaseTodayBalance?.toLocaleString() ?? '-'}</td>
              <td>{item.ShortSaleBuy?.toLocaleString() ?? '-'}</td>
              <td>{item.ShortSaleSell?.toLocaleString() ?? '-'}</td>
              <td>{item.ShortSaleTodayBalance?.toLocaleString() ?? '-'}</td>
            </tr>
          )) : (
            <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999' }}>載入中...</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/* ── 三大法人表 ── */
const NAME_MAP = {
  Foreign_Investor: '外資',
  Foreign_Dealer_Self: '外資自營',
  Investment_Trust: '投信',
  Dealer_self: '自營(自行)',
  Dealer_Hedging: '自營(避險)',
}

const InstitutionalTable = ({ data, tableStyle, wrapperStyle }) => {
  // 樞紐：每天各 name 的 buy-sell
  const byDate = {}
  ;(data || []).forEach(({ date, name, buy, sell }) => {
    if (!byDate[date]) byDate[date] = {}
    byDate[date][name] = (buy - sell) / 1000 // 換算張
  })

  const rows = Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0]))
  const cols = ['Foreign_Investor', 'Investment_Trust', 'Dealer_self', 'Dealer_Hedging']
  const color = v => ({ color: v > 0 ? '#d32f2f' : v < 0 ? '#388e3c' : '#999' })
  const fmt = v => v !== undefined ? Math.round(v).toLocaleString() : '-'

  return (
    <div className={wrapperStyle}>
      <table className={tableStyle}>
        <thead>
          <tr>
            <th style={stickyTh}>日期</th>
            {cols.map(k => <th key={k} style={stickyTh}>{NAME_MAP[k]}</th>)}
            <th style={stickyTh}>三大合計</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows.map(([date, vals]) => {
            const total = cols.reduce((s, k) => s + (vals[k] ?? 0), 0)
            return (
              <tr key={date}>
                <td>{date}</td>
                {cols.map(k => (
                  <td key={k} style={color(vals[k] ?? 0)}>{fmt(vals[k])}</td>
                ))}
                <td style={color(total)}>{Math.round(total).toLocaleString()}</td>
              </tr>
            )
          }) : (
            <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999' }}>載入中...</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/* ── 主元件 ── */
const Stock = ({ stockId: propStockId }) => {
  const router = useRouter()
  const id = propStockId || router.query.id
  const { container, tabs, tab, activeTab, tabContent, subTabs, subTab, activeSubTab, table, revenueWrapper } = styles
  const [stockDetail, setStockDetail] = useState([])
  const [financialData, setFinancialData] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [marginData, setMarginData] = useState([])
  const [institutionalData, setInstitutionalData] = useState([])
  const [currentTab, setCurrentTab] = useState('壓力圖')
  const [fundamentalSubTab, setFundamentalSubTab] = useState('EPS')
  const [chipsSubTab, setChipsSubTab] = useState('融資融券')
  const [loading, setLoading] = useState(false)

  const stockInfo = useSelector(state => state.stockInfoReducer)

  useEffect(() => {
    if (!id) return
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [stockData, financial, revenue, margin, institutional] = await Promise.all([
          getStockInfo(id),
          getFinancialStatements(id),
          getMonthRevenue(id),
          getMarginShortSale(id),
          getInstitutionalInvestors(id),
        ])
        console.log('[fetchAll] financial raw:', financial)
        setStockDetail(stockData || [])
        setFinancialData(financial || [])
        setRevenueData(revenue || [])
        setMarginData(margin || [])
        setInstitutionalData(institutional || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [id])

  const SubTabs = ({ tabs: subTabList, active, onChange }) => (
    <div className={subTabs}>
      {subTabList.map(t => (
        <button
          key={t}
          className={clsx(subTab, active === t && activeSubTab)}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </div>
  )

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, color: '#888', fontSize: 16 }}>
      載入中...
    </div>
  )

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
          <PresureStick stockDetail={stockDetail} stockId={id} stockInfo={stockInfo} />
        )}

        {currentTab === '基本面' && (
          <>
            <SubTabs tabs={FUNDAMENTAL_SUBTABS} active={fundamentalSubTab} onChange={setFundamentalSubTab} />
            {fundamentalSubTab === 'EPS' && <EpsTable financialData={financialData} tableStyle={table} />}
            {fundamentalSubTab === '月營收' && <RevenueTable revenueData={revenueData} tableStyle={table} wrapperStyle={revenueWrapper} />}
          </>
        )}

        {currentTab === '籌碼面' && (
          <>
            <SubTabs tabs={CHIPS_SUBTABS} active={chipsSubTab} onChange={setChipsSubTab} />
            {chipsSubTab === '融資融券' && <MarginTable data={marginData} tableStyle={table} wrapperStyle={revenueWrapper} />}
            {chipsSubTab === '三大法人' && <InstitutionalTable data={institutionalData} tableStyle={table} wrapperStyle={revenueWrapper} />}
          </>
        )}
      </div>
    </div>
  )
}

export default Stock
