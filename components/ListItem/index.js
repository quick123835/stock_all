import styles from './index.module.scss'
const { card, cardName , counts , red } = styles
import { useRouter } from 'next/dist/client/router'
import Link from 'next/dist/client/link'
import { useDispatch , useSelector } from 'react-redux'
import { clickCategory , clickCategoryStocks} from '../../lib/redux/actions/actions'

const ListItem = ({item , stocks , onStockClick }) => {
    const router = useRouter()
    const pathname = router.pathname
    const dispatch = useDispatch()

    const handleCategoryClick = (item , categoryStocks) => {
        dispatch(clickCategory(item))
        dispatch(clickCategoryStocks(categoryStocks))
        router.push('/category')
        
    }



    if(pathname === '/'){
        const categoryStocks = stocks.filter(stock => stock.industry_category === item)
    return (
            <div className='w-[180px] h-[100px] border-2 rounded-md flex flex-col justify-center items-center hover:bg-gray-200 cursor-pointer' onClick={() => {handleCategoryClick(item , categoryStocks)}}>
                <div className='text-[20px] mb-1'>{item}</div>
                <div className='text-xs'>{categoryStocks.length}檔股票</div>
            </div>
            )
    }else if(pathname === '/category'){
        if(item.pressure && item.pressure.length > 0 ){
            const date = new Date(item.pressure[0])
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月份从0开始，所以+1，并转换为两位字符串
            const day = date.getDate().toString().padStart(2, '0')
            const formattedDate = `${year}/${month}/${day}`
            const roundedNumber = Number(item.pressure[1]).toFixed(4)
            return (
                <div className={`${card} ${ roundedNumber <= 0.6 && red} `} onClick={() => {onStockClick?.(item.id , item.name)}}>
                    <div className={cardName}>{item.name}</div>
                    <div>代碼: {item.id}</div>
                    <div>時間: {formattedDate}</div>
                    <div>力道: {roundedNumber}</div>
                </div>
            )
        }
      
    }
}

export default ListItem