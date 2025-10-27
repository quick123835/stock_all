import { useEffect } from 'react'
import Stock from '../Stock/Stock'
import styles from './CategoryStockModal.module.scss'

const CategoryStockModal = ({ isOpen, onClose, stockId, stockName }) => {
  const { modal, overlay, content, closeButton } = styles

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  useEffect(() => {
    if (isOpen) {
      // 防止背景滾動
      document.body.style.overflow = 'hidden'
    } else {
      // 恢復滾動
      document.body.style.overflow = 'unset'
    }
    
    // 清除時恢復滾動
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className={modal}>
      <div className={overlay} onClick={handleOverlayClick}>
        <div className={content}>
          <button className={closeButton} onClick={onClose}>
            ✕
          </button>
          <Stock stockId={stockId} stockName={stockName} />
        </div>
      </div>
    </div>
  )
}

export default CategoryStockModal
