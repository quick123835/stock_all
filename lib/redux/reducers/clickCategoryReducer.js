const clickCategoryReducer = (state='' , action) => {
    switch (action.type){
        case 'categoryClick' :
            return action.payload
        default:
            return state
    }
}

export default clickCategoryReducer