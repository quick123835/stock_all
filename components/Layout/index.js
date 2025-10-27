import { useState } from 'react'
import Navbar1 from '../Nav'
import SearchStockModal from '../SearchStockModal/SearchStockModal'

export default function Layout ({ children }) {
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [searchStock, setSearchStock] = useState({ id: '', name: '' })

  const handleOpenSearchModal = (stockId, stockName) => {
    setSearchStock({ id: stockId, name: stockName })
    setSearchModalOpen(true)
  }

  const handleCloseSearchModal = () => {
    setSearchModalOpen(false)
    setSearchStock({ id: '', name: '' })
  }

  return (
    <div>
      <Navbar1 onOpenSearchModal={handleOpenSearchModal} />

      <main>{children}</main>
      
      <SearchStockModal
        isOpen={searchModalOpen}
        onClose={handleCloseSearchModal}
        stockId={searchStock.id}
        stockName={searchStock.name}
      />
    </div>
  )
}
