import styles from './index.module.scss'
import ListItem from '../ListItem'

const { listContainer} = styles

const CategoriesList = ({categories , ttlStocks}) => {
    return (
      <div className={listContainer}>
        {categories.map((item, index) => (
            <ListItem 
                item={item}
                key={index}
                stocks={ttlStocks}
            />
        ))}
      </div>
    )
}

export default CategoriesList