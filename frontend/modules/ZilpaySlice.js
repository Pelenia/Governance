import { createSlice } from '@reduxjs/toolkit'


export const ZilpaySlice = createSlice({
  name: 'Zilpay',
  initialState: {
    base16: '',
    bech32: '',
    contract: null,
    contractState: null,
    version: null,
    myinsignias: {},
    treasury: 'None'
  },
  reducers: {
    setWalletAddress: (state, action) => {
      state.base16 = action.payload.base16
      state.bech32 = action.payload.bech32
    },
    setContract: (state, action) => {
      state.contract = action.payload
    },
    setContractState: (state, action) => {
      state.contractState = action.payload
    },
    setVersion: (state, action) => {
      state.version = action.payload
    },
    setMyInsignias: (state, action) => {
      state.myinsignias = action.payload
    },
    setTreasury: (state, action) => {
      state.treasury = action.payload
    }
  }
})

export const { setWalletAddress, setContract, setContractState, setVersion, setMyInsignias, setTreasury } = ZilpaySlice.actions

export const base16 = state => state.Zilpay.base16
export const bech32 = state => state.Zilpay.bech32
export const contract = state => state.Zilpay.contract
export const contractState = state => state.Zilpay.contractState
export const version = state => state.Zilpay.version
export const myinsignias = state => state.Zilpay.myinsignias
export const treasury = state => state.Zilpay.treasury

export default ZilpaySlice.reducer