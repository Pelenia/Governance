import { configureStore } from '@reduxjs/toolkit'

import ZilpaySlice from './ZilpaySlice'

export default configureStore({
  reducer: {
    Zilpay: ZilpaySlice
  }
})