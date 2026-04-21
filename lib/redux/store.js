import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import allReducers from './reducers'
import { composeWithDevTools } from 'redux-devtools-extension';

const store = createStore(
    allReducers,
    composeWithDevTools(applyMiddleware(thunk))
)

export default store
