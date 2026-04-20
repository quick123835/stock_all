import styles from './index.module.scss'

const ListItem = ({ item, onStockClick }) => {
  if (!item.pressure || item.pressure.length === 0) return null

  const date = new Date(item.pressure[0])
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const formattedDate = `${year}/${month}/${day}`
  const roundedNumber = Number(item.pressure[1]).toFixed(4)

  if (isNaN(roundedNumber) || roundedNumber > 0.6) return null

  const { card, cardName, meta, divider, pressureRow, pressureLabel, pressureValue } = styles

  return (
    <div className={card} onClick={() => onStockClick?.(item.id, item.name)}>
      <div className={cardName}>{item.name}</div>
      <div className={meta}>代碼：{item.id}</div>
      <div className={meta}>{formattedDate}</div>
      <div className={divider} />
      <div className={pressureRow}>
        <span className={pressureLabel}>買賣力道</span>
        <span className={pressureValue}>{roundedNumber}</span>
      </div>
    </div>
  )
}

export default ListItem
