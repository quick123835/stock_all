import styles from './index.module.scss'
const { card, cardName , counts , red } = styles

const ListItem = ({item , onStockClick }) => {
    // 只顯示計算結果的卡片
    if(item.pressure && item.pressure.length > 0 ){
        const date = new Date(item.pressure[0])
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0')
        const formattedDate = `${year}/${month}/${day}`
        const roundedNumber = Number(item.pressure[1]).toFixed(4)
        
        // 只顯示力道 <= 0.6 的
        if (roundedNumber > 0.6) return null
        
        return (
            <div className={`${card} ${ roundedNumber <= 0.6 && red} `} onClick={() => {onStockClick?.(item.id , item.name)}}>
                <div className={cardName}>{item.name}</div>
                <div>代碼: {item.id}</div>
                <div>時間: {formattedDate}</div>
                <div>力道: {roundedNumber}</div>
            </div>
        )
    }
    
    return null
}

export default ListItem