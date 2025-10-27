import { useSelector, useDispatch } from 'react-redux'
import { getStockInfo } from '../../lib/api/stocks'
import { useRouter } from 'next/router'
import Link from 'next/link'
import styles from './index.module.scss'
import Swal from 'sweetalert2'
import { useEffect, useState } from 'react'

function Navbar1 ({ onOpenSearchModal }) {
  const [input , setInput] = useState('')

  const inputValue = useSelector(state => state.SearchReducer)
  const allStocks = useSelector(state => state.getTtlStocksReducer)
  const dispatch = useDispatch()
  const router = useRouter()


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

  useEffect(() => {
    console.log(allStocks)
  },[allStocks])

  const { navbar } = styles

  return (
    <nav
      className={`${navbar} navbar navbar-expand-lg bg-body-tertiary position-fixed top-0 border-bottom w-100`}
    >
      <div className='container-fluid '>
        <Link href='/'>
          <span className='navbar-brand w-25' style={{ cursor: 'pointer' }}>
            買賣力道基地
          </span>
        </Link>
        <div className='d-flex w-50 '>
          <input
            className='form-control me-1'
            type='search'
            placeholder='股票代號'
            aria-label='Search'
            value={input}
            onChange={handleChange}
          />
          <button
            className='btn btn-outline-success w-50'
            onClick={handleClick}
          >
            Search
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar1
