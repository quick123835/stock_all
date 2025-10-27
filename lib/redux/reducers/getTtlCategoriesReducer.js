const getTtlCategoriesReducer = (state='' , action) => {
    switch(action.type){
        case 'getTtlCategories' :
            return action.payload
        default :
            return state
    }
}

export default getTtlCategoriesReducer