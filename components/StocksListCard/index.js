import styles from './index.module.scss'
import { useState } from 'react'

const StocksListCard = ({ stocksList, cardOnClick, onStockClick }) => {
  // const { listContainer, card, cardInfo, cardName, stockId, paginator } = styles
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 24

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPageData =
    stocksList.length > 25 ? stocksList.slice(startIndex, endIndex) : stocksList

  const totalPages = Math.ceil(stocksList.length / itemsPerPage)

  return (
    <>
      <div className=''>
        {currentPageData.map((item, index) => (
          <div 
            key={index}
            className='' 
            onClick={() => {
              cardOnClick?.(item)
              onStockClick?.(item.stock_id, item.stock_name)
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className=''>{item.stock_name}</div>
            <div className=''>
              <span className=''>代號: {item.stock_id}</span>
            </div>
          </div>
        ))}
      </div>
      <div className=''>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Previous
        </button>
        <span>
          {currentPage} / {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </>
  )
}

export default StocksListCard
