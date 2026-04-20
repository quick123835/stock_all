import { useSelector } from 'react-redux'
import Link from 'next/link'
import styles from './index.module.scss'
import Swal from 'sweetalert2'
import { useState } from 'react'

function Navbar1 ({ onOpenSearchModal }) {
  const [input, setInput] = useState('')
  const allStocks = useSelector(state => state.getTtlStocksReducer)

  const handleChange = e => {
    const value = e.target.value
    if (/^\d*$/.test(value)) {
      setInput(value)
    }
  }

  const handleClick = () => {
    const found = allStocks.find(s => s.stock_id === input)
    if (found) {
      onOpenSearchModal(input, found.stock_name)
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: '查無此股票代號!'
      })
    }
    setInput('')
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter') handleClick()
  }

  const { navbar, logo, searchArea, input: inputClass, searchBtn } = styles

  return (
    <nav className={navbar}>
      <Link href='/'>
        <span className={logo}>買賣力道基地</span>
      </Link>
      <div className={searchArea}>
        <input
          className={inputClass}
          type='search'
          placeholder='股票代號'
          aria-label='Search'
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <button className={searchBtn} onClick={handleClick}>
          Search
        </button>
      </div>
    </nav>
  )
}

export default Navbar1
