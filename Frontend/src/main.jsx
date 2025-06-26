import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import {Provider} from 'react-redux';

import {configureStore} from '@reduxjs/toolkit'
import { rootReducer } from './redux/index.js'
import { Toaster } from 'react-hot-toast'

export const store=configureStore({
    reducer:rootReducer,
})
createRoot(document.getElementById('root')).render(
  <StrictMode>
  <BrowserRouter>
  <Provider store={store}>
    <App />
    <Toaster/>
    </Provider>
    </BrowserRouter>
  </StrictMode>
)
