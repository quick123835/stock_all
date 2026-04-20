import { useState } from 'react'
import Navbar1 from '../Nav'
import SearchStockModal from '../SearchStockModal/SearchStockModal'

function Footer () {
  return (
    <footer style={{
      background: '#0070cc',
      color: '#ffffff',
      padding: '48px 64px',
      textAlign: 'center',
      marginTop: 'auto',
    }}>
      <p style={{
        fontSize: '22px',
        fontWeight: 300,
        letterSpacing: '0.1px',
        margin: '0 0 12px',
      }}>
        買賣力道基地
      </p>
      <p style={{
        fontSize: '14px',
        fontWeight: 400,
        color: 'rgba(255,255,255,0.7)',
        margin: 0,
      }}>
        © {new Date().getFullYear()} 買賣力道基地．台灣股市買賣壓力分析工具
      </p>
    </footer>
  )
}

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar1 onOpenSearchModal={handleOpenSearchModal} />

      <main style={{ flex: 1 }}>{children}</main>

      <Footer />

      <SearchStockModal
        isOpen={searchModalOpen}
        onClose={handleCloseSearchModal}
        stockId={searchStock.id}
        stockName={searchStock.name}
      />
    </div>
  )
}
