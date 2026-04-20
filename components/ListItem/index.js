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

  const { card, highlight, cardName, meta, pressureValue } = styles

  return (
    <div
      className={`${card} ${highlight}`}
      onClick={() => onStockClick?.(item.id, item.name)}
    >
      <div className={cardName}>{item.name}</div>
      <div className={meta}>代碼: {item.id}</div>
      <div className={meta}>時間: {formattedDate}</div>
      <div className={pressureValue}>力道: {roundedNumber}</div>
    </div>
  )
}

export default ListItem
