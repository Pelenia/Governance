import React from 'react';

import { Navbar } from '../modules/Navbar';
import { Snipping } from '../modules/Snipping';

import { useSelector, useDispatch } from 'react-redux';
import { setTreasury } from "./../modules/ZilpaySlice";
import { bech32, base16, contract, contractState, version, myinsignias, treasury } from './../modules/ZilpaySlice';

const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { MessageType } = require('@zilliqa-js/subscriptions');
const { toBech32Address, fromBech32Address } = require('@zilliqa-js/crypto')

import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const { BN, Long, bytes, units } = require('@zilliqa-js/util');

export default function Home() {
  const dispatch = useDispatch();

  const rdxcontract = useSelector(contract);
  const rdxbech32 = useSelector(bech32);
  const rdxbase16 = useSelector(base16);
  const rdxversion = useSelector(version);
  const rdxcontractState = useSelector(contractState);
  const rdxmyinsignias = useSelector(myinsignias);
  const rdxtreasury = useSelector(treasury);

  const [openRegTreasury, setOpenRegTreasury] = React.useState(false);
  const [treasuryAddress, setTreasuryAddress] = React.useState('');
  const [openDeposit, setOpenDeposit] = React.useState(false);
  const [depositAmount, setDepositAmount] = React.useState('');
  const [openSubmit, setOpenSubmit] = React.useState(false);
  const [submitAddress, setSubmitAddress] = React.useState('');
  const [submitAmount, setSubmitAmount] = React.useState('');
  const [submitTag, setSubmitTag] = React.useState('');

  const [treasuryBalance, setTreasuryBalance] = React.useState(0);

  const [holders, setHolders] = React.useState([]);
  const [transactions, setTransactions] = React.useState([]);
  const [treasuryAccess, setTreasuryAccess] = React.useState(false);
  const [treasuryTemplate, setTreasuryTemplate] = React.useState(0);
  const [treasuryInsignia, setTreasuryInsignia] = React.useState(0);

  const [msgOpen, setMsgOpen] = React.useState(false);
  const [msgText, setMsgText] = React.useState('');
  const [isLoding, setIsLoding] = React.useState(false);

  const getTreasuryState = async () => {
    var rpc = process.env.NEXT_PUBLIC_RPC_MAIN;
    var contract_address = rdxtreasury
    if (process.env.NEXT_PUBLIC_NETWORK_TYPE == 'test') {
      rpc = process.env.NEXT_PUBLIC_RPC_TEST;
    }
    var zilliqa = new Zilliqa(rpc);
    if (window.zilPay) {
      const zilPay = window.zilPay;
      const result = await zilPay.wallet.connect();
      if (result) {
        zilliqa = zilPay;
      }
    }
    const contract = zilliqa.contracts.at(contract_address);
    const state = await contract.getState();
    var txs = state.transactions;
    var data = [];
    for (var x in txs) {
      data.push({
        id: x,
        receiver: toBech32Address(txs[x].arguments[0]),
        amount: covertDecimal(txs[x].arguments[1], 'toZil'),
        tag: txs[x].arguments[2]
      });
    }
    setTransactions(data);
    setTreasuryBalance(covertDecimal(state._balance, 'toZil'));
  }

  const regTreasury = async(address) => {
    if (rdxbech32 != "") {
      var base16_address = fromBech32Address(address);

      const myGasPrice = units.toQa('2000', units.Units.Li);
      const contract = window.zilPay.contracts.at(rdxcontract);
      var res = await contract.call(
        'SetTreasuryAddress',
        [
          {
            vname: 'wallet_address',
            type: 'ByStr20',
            value: base16_address.toString(),
          }
        ],
        {
          version: rdxversion,
          amount: new BN(0),
          gasPrice: myGasPrice,
          gasLimit: Long.fromNumber(10000),
        }
      )
      setIsLoding(true);
      setTimeout(() => {
        dispatch(setTreasury(base16_address));
        setIsLoding(false);
        setOpenRegTreasury(false);
        getTreasuryState();
      }, 30000);
    }
    else {
      setMsgText('Please connect Zilpay');
      setMsgOpen(true);
    }
  }

  const covertDecimal = (amount, dir) => {
    var strAmount = amount.toString();
    if (dir == 'toBN') {
      var arr = strAmount.split(".");
      if (arr[1] && arr[1] != '') {
        if (arr[1].length >= 12) {
          return arr[0] + arr[1].substr(0, 12);
        }
        else {
          var len = 12 - arr[1].length;
          var decimal = '';
          while(len > 0) {
            decimal = decimal + '0';
            len --;
          }
          return arr[0] + arr[1] + decimal;
        }
      }
      else {
        return strAmount + "000000000000";
      }
    }
    else {
      if (strAmount.length > 12) {
        var top = strAmount.substr(0, strAmount.length - 12);
        var low = strAmount.substr(strAmount.length - 12, 2);
        return top+"."+low;
      }
      else {
        var len = 12 - strAmount.length;
        var dec = '';
        while (len > 0) {
          dec = dec + '0';
          len --;
        }
        return '0.'+ dec + strAmount.substr(0, 2);
      }
    }
  }

  const depositZil = async(amount, tid, iid) => {
    if (rdxbech32 != "") {
      const myGasPrice = units.toQa('2000', units.Units.Li);
      const contract = window.zilPay.contracts.at(rdxcontract);
      var res = await contract.call(
        'AddFundsToTreasuryWallet',
        [
          {
            vname: 'template_id',
            type: 'Uint32',
            value: tid.toString(),
          },
          {
            vname: 'insignia_id',
            type: 'Uint128',
            value: iid.toString(),
          }
        ],
        {
          version: rdxversion,
          amount: new BN(covertDecimal(amount, 'toBN')),
          gasPrice: myGasPrice,
          gasLimit: Long.fromNumber(10000),
        }
      )
      setIsLoding(true);
      setTimeout(() => {
        setIsLoding(false);
        setOpenDeposit(false);
        getTreasuryState();
      }, 30000);
    }
    else {
      setMsgText('Please connect Zilpay');
      setMsgOpen(true);
    }
  }

  const submitTransaction = async (address, amount, tag, tid, iid) => {
    if (rdxbech32 != "") {
      var base16_address = fromBech32Address(address);
      const myGasPrice = units.toQa('2000', units.Units.Li);
      const contract = window.zilPay.contracts.at(rdxcontract);
      var res = await contract.call(
        'SubmitTransactionToTreasuryWallet',
        [
          {
            vname: 'template_id',
            type: 'Uint32',
            value: tid.toString(),
          },
          {
            vname: 'insignia_id',
            type: 'Uint128',
            value: iid.toString(),
          },
          {
            vname: 'recipient',
            type: 'ByStr20',
            value: base16_address.toString(),
          },
          {
            vname: 'amount',
            type: 'Uint128',
            value: new BN(covertDecimal(amount, 'toBN')).toString(),
          },
          {
            vname: 'tag',
            type: 'String',
            value: tag,
          }
        ],
        {
          version: rdxversion,
          amount: new BN(0),
          gasPrice: myGasPrice,
          gasLimit: Long.fromNumber(10000),
        }
      )
      setIsLoding(true);
      setTimeout(() => {
        setIsLoding(false);
        setOpenSubmit(false);
        getTreasuryState();
      }, 30000);
    }
    else {
      setMsgText('Please connect Zilpay');
      setMsgOpen(true);
    }
  }

  const sendMsg = async (actionname, txid, tid, iid) => {
    if (rdxbech32 != "") {
      const myGasPrice = units.toQa('2000', units.Units.Li);
      const contract = window.zilPay.contracts.at(rdxcontract);
      var res = await contract.call(
        'SendMessageToTreasuryWallet',
        [
          {
            vname: 'template_id',
            type: 'Uint32',
            value: tid.toString(),
          },
          {
            vname: 'insignia_id',
            type: 'Uint128',
            value: iid.toString(),
          },
          {
            vname: 'action_name',
            type: 'String',
            value: actionname,
          },
          {
            vname: 'transaction_id',
            type: 'Uint32',
            value: txid.toString(),
          }
        ],
        {
          version: rdxversion,
          amount: new BN(0),
          gasPrice: myGasPrice,
          gasLimit: Long.fromNumber(10000),
        }
      )
      setIsLoding(true);
      setTimeout(() => {
        setIsLoding(false);
      }, 30000);
    }
    else {
      setMsgText('Please connect Zilpay');
      setMsgOpen(true);
    }
  }

  React.useEffect(() => {
    setTreasuryAccess(false);
    for (var iid in rdxmyinsignias) {
      if (rdxmyinsignias[iid] && rdxmyinsignias[iid].length > 0) {
        if (rdxcontractState.treasury_access[iid] && rdxcontractState.treasury_access[iid].constructor == 'True') {
          setTreasuryTemplate(rdxmyinsignias[iid][0]);
          setTreasuryInsignia(iid);
          setTreasuryAccess(true);
        }
      }
    }
    if (rdxcontractState && rdxcontractState.contract_owner && rdxcontractState.contract_owner.toUpperCase() == rdxbase16.toUpperCase()) {
      setTreasuryAccess(true);
    }
  }, [rdxmyinsignias, rdxcontractState]);

  React.useEffect(() => {
    if (rdxcontractState != null & rdxtreasury != 'None') {
      getTreasuryState();
    }
  }, [rdxcontractState, rdxtreasury])

  return (
    <div className='w-full h-screen bg-color overflow-y-auto'>
      <Navbar></Navbar>

      {isLoding && 
        <Snipping></Snipping>
      }
      
      <div className='pt-24 pb-2 p-10 flex items-center'>
        <div className='text-white'><AccountBalanceWalletIcon></AccountBalanceWalletIcon></div>
        <div className='ml-4 text-lg text-white'>
          <div>Address: {rdxtreasury.startsWith('0x')?toBech32Address(rdxtreasury):rdxtreasury}</div>
          <div>Balance: {treasuryBalance} ZIL</div>
        </div>
        <div className='grow '></div>
        {treasuryAccess?
          <>
            <div className='w-40 border rounded-full m-3 p-3 text-white text-center cursor-pointer hover:text-rose-100' onClick={() => setOpenRegTreasury(true)}>Change wallet</div>
            <div className='w-40 border rounded-full m-3 p-3 text-white text-center cursor-pointer hover:text-rose-100' onClick={() => setOpenDeposit(true)}>Add fund</div>
            <div className='w-48 border rounded-full m-3 p-3 text-white text-center cursor-pointer hover:text-rose-100' onClick={() => setOpenSubmit(true)}>Submit Transaction</div>
          </>
        :
          <>
            <div className='w-40 border border-slate-500 rounded-full m-3 p-3 text-slate-400 text-center'>Change wallet</div>
            <div className='w-40 border border-slate-500 rounded-full m-3 p-3 text-slate-400 text-center'>Add fund</div>
            <div className='w-48 border border-slate-500 rounded-full m-3 p-3 text-slate-400 text-center'>Submit Transaction</div>
          </>
        }
      </div>

      <div className='flex lg:flex-nowrap flex-wrap container mx-auto'>
        <div className='w-full m-2 p-6 pb-0 bg-cyan-200/90 rounded-3xl'>
          <div className='flex m-2 p-1 justify-between'>
            <div className='grow'>Receiver Address</div>
            <div className='w-28 text-center'>Amount</div>
            <div className='w-40 text-center'>Tag</div>
            {/* <div className='w-20 text-center'>Sign</div>
            <div className='w-28 text-center'>Revoke</div> */}
            <div className='w-28 text-center'>Execute</div>
            <div className='w-28 text-center'>Delete</div>
          </div>
          {transactions.map((item) => 
            <div key={item.id} className='flex m-2 p-1 justify-between'>
              <div className='grow'>{item.receiver}</div>
              <div className='w-28 text-center'>{item.amount}</div>
              <div className='w-40 text-center'>{item.tag}</div>
              {/* {treasuryAccess?
                <>
                  <div className='w-20 text-center'><Button variant="outlined" onClick={() => sendMsg('SignTransaction', item.id, treasuryTemplate, treasuryInsignia)}>Sign</Button></div>
                  <div className='w-28 text-center'><Button variant="outlined" onClick={() => sendMsg('RevokeSignature', item.id, treasuryTemplate, treasuryInsignia)}>Revoke</Button></div>
                </>
              :
                <>
                  <div className='w-20 text-center'><Button variant="outlined" disabled>Sign</Button></div>
                  <div className='w-28 text-center'><Button variant="outlined" disabled>Revoke</Button></div>
                </>
              } */}
              {
                (treasuryAccess || item.receiver == rdxbech32)?
                  <div className='w-28 text-center'><Button variant="outlined" onClick={() => sendMsg('ExecuteTransaction', item.id, treasuryTemplate, treasuryInsignia)}>Execute</Button></div>
                :
                  <div className='w-28 text-center'><Button variant="outlined" disabled>Execute</Button></div>
              }
              {
                treasuryAccess?
                  <div className='w-28 text-center'><Button variant="outlined" color="error" onClick={() => sendMsg('DeleteTransaction', item.id, treasuryTemplate, treasuryInsignia)}>Delete</Button></div>
                :
                  <div className='w-28 text-center'><Button variant="outlined" color="error" disabled>Delete</Button></div>
              }
            </div>
          )}
        </div>
      </div>

      <Dialog open={openRegTreasury} onClose={() => setOpenRegTreasury(false)}>
        <DialogTitle>Treasury wallet address</DialogTitle>
        <DialogContent className='w-96'>
          <TextField onChange={(e) => setTreasuryAddress(e.target.value)} className='w-full' label="Address" variant="standard" />
        </DialogContent>
        <DialogActions>
          <div className='m-2 p-2 border rounded-lg cursor-pointer hover:font-medium' onClick={() => regTreasury(treasuryAddress)}>Change</div>
          <div className='m-2 p-2 border rounded-lg cursor-pointer hover:font-medium' onClick={() => setOpenRegTreasury(false)}>Cancel</div>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeposit} onClose={() => setOpenDeposit(false)}>
        <DialogTitle>Deposit ZIL to treasury wallet</DialogTitle>
        <DialogContent className='w-96'>
          <TextField onChange={(e) => setDepositAmount(e.target.value)} className='w-full' label="Amount" variant="standard" />
        </DialogContent>
        <DialogActions>
          <div className='m-2 p-2 border rounded-lg cursor-pointer hover:font-medium' onClick={() => depositZil(depositAmount, treasuryTemplate, treasuryInsignia)}>Deposit</div>
          <div className='m-2 p-2 border rounded-lg cursor-pointer hover:font-medium' onClick={() => setOpenDeposit(false)}>Cancel</div>
        </DialogActions>
      </Dialog>

      <Dialog open={openSubmit} onClose={() => setOpenSubmit(false)}>
        <DialogTitle>Submit transaction</DialogTitle>
        <DialogContent className='w-96'>
          <TextField onChange={(e) => setSubmitAddress(e.target.value)} className='w-full' label="Address" variant="standard" />
          <TextField onChange={(e) => setSubmitAmount(e.target.value)} className='w-full mt-2' label="Amount" variant="standard" />
          <TextField onChange={(e) => setSubmitTag(e.target.value)} className='w-full mt-2' label="Tag" variant="standard" />
        </DialogContent>
        <DialogActions>
          <div className='m-2 p-2 border rounded-lg cursor-pointer hover:font-medium' onClick={() => submitTransaction(submitAddress, submitAmount, submitTag, treasuryTemplate, treasuryInsignia)}>Submit</div>
          <div className='m-2 p-2 border rounded-lg cursor-pointer hover:font-medium' onClick={() => setOpenSubmit(false)}>Cancel</div>
        </DialogActions>
      </Dialog>

      <Snackbar
        anchorOrigin={{ vertical:'bottom', horizontal:'right' }}
        open={msgOpen}
        autoHideDuration={6000}
        onClose={() => { setMsgOpen(false) }}
      >
        <Alert onClose={() => { setMsgOpen(false) }} severity="error" sx={{ width: '100%' }}>{msgText}</Alert>
      </Snackbar>
    </div>
  )
}
