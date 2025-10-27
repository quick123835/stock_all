import ListItem from "../components/ListItem"
import { useSelector , useDispatch } from "react-redux"
import { useDebugValue, useReducer } from "react"
import { useRouter } from "next/dist/client/router"
import { getStockInfo } from "../lib/api/stocks"
import { StockInfo } from "../lib/redux/actions/actions"
import { useEffect , useState } from "react"
import presureCalculate from "../lib/presureCalculate"
import CategoryStockModal from "../components/CategoryStockModal/CategoryStockModal"


const category = () => {
    const dispatch = useDispatch()
    const currentCategory = useSelector(state => state.clickCategoryReducer)
    const currentCategoryStocks = useSelector(state => state.clickCategoryStocksReducer)
    const ttlList = useSelector(state => state.getStockInfoReducer)
    
    const [loading, setLoading] = useState(true)
    const [renderList , setRenderList] = useState([])
    // const [list , setList] = useState([])
    const [stockDetail , setStockDetail] = useState([])
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedStock, setSelectedStock] = useState({ id: '', name: '' })

    const router = useRouter()

    const getStockInfoAsync = async(stock) => {
        try{
            const res = await getStockInfo(stock.stock_id)
            if(res){
                dispatch(StockInfo(res))
                    const pressure = presureCalculate(res)
                    const ans = renderList.filter(i => i.id === stock.stock_id)
                    if(ans.length == 0){
                        setRenderList(renderList => [
                            ...renderList ,
                            {
                                name: stock.stock_name,
                                id: stock.stock_id,
                                pressure: pressure
                            }
                        ])
                    }
                   
            }
        }catch(error){
            console.log(error)
        }
    }

    const handleStockClick = (id , name) => {
        setSelectedStock({ id, name })
        // 更新 router query 但不跳轉頁面
        router.push({
            pathname: '/category',
            query: { id, name }
        }, undefined, { shallow: true })
        setModalOpen(true)
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        setSelectedStock({ id: '', name: '' })
        // 清除 query 參數
        router.push('/category', undefined, { shallow: true })
    }


    useEffect(() => {
        const stockInfoPromises = currentCategoryStocks.map(stock => getStockInfoAsync(stock));
        Promise.all(stockInfoPromises)
            .then(() => {
                setLoading(false);
            })
            .catch(error => {
                console.error(error);
                setLoading(false);
            });
    }, [currentCategoryStocks])

    return (
    <>
        {loading === true && (
            <div className='position-absolute w-100 h-100 d-flex justify-content-center align-items-center'>
                一鍵力道計算中...
            </div>
        )}

        {loading === false && (
            <div style={{
                marginTop: '65px' ,
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12PX',
                overflowY: 'scroll',
                justifyContent: 'center'
            }}>
            {renderList.map((i , index) => {
                return (
                    <ListItem 
                        item={i}
                        key={index}
                        onStockClick={handleStockClick}
                    />
                )
            })}
            </div>
        )}

        <CategoryStockModal
            isOpen={modalOpen}
            onClose={handleCloseModal}
            stockId={selectedStock.id}
            stockName={selectedStock.name}
        />
    </>
       
    )
}

export default category