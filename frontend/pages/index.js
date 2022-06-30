import React from 'react';
import { useRouter } from 'next/router';

import { Navbar } from '../modules/Navbar';
import { Snipping } from '../modules/Snipping';

import { useSelector, useDispatch } from 'react-redux';
import { setContractState } from "./../modules/ZilpaySlice";
import { base16, bech32, contract, contractState, version, myinsignias } from './../modules/ZilpaySlice';

const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { MessageType } = require('@zilliqa-js/subscriptions');

import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import TextField from '@mui/material/TextField';
import DeleteIcon from '@mui/icons-material/Delete';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import { green, indigo } from '@mui/material/colors';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const { BN, Long, units } = require('@zilliqa-js/util');

export default function Home() {
  const router = useRouter();
  const dispatch = useDispatch();

  const rdxcontract = useSelector(contract);
  const rdxbase16 = useSelector(base16);
  const rdxbech32 = useSelector(bech32);
  const rdxversion = useSelector(version);
  const rdxcontractState = useSelector(contractState);
  const rdxmyinsignias = useSelector(myinsignias);

  const [openRegInsignia, setOpenRegInsignia] = React.useState(false);
  const [regInsigniaName, setRegInsigniaName] = React.useState('');
  const [regInsigniaURL, setRegInsigniaURL] = React.useState('');
  const [maxInsigniaID, setMaxInsigniaID] = React.useState(1);

  const [insigTemplates, setInsigTemplates] = React.useState([]);
  const [delInsigniaOpen, setDelInsigniaOpen] = React.useState(false);
  const [delInsigniaId, setDelInsigniaId] = React.useState(0);
  const [delInsigniaName, setDelInsigniaName] = React.useState('');

  const [configurable, setConfigurable] = React.useState(false);

  const [msgOpen, setMsgOpen] = React.useState(false);
  const [msgText, setMsgText] = React.useState('');
  const [isLoding, setIsLoding] = React.useState(false);
  
  const registerInsignia = React.useCallback(() => {
    const run = async () => {
      if (rdxbech32 != "") {
        const myGasPrice = units.toQa('2000', units.Units.Li);
        const contract = window.zilPay.contracts.at(rdxcontract);
        var res = await contract.call(
          "CreateInsigniaTemplate",
          [
            {
              vname: 'template_id',
              type: 'Uint32',
              value: maxInsigniaID.toString(),
            },
            {
              vname: 'template_name',
              type: 'String',
              value: regInsigniaName.toString(),
            },
            {
              vname: 'template_url',
              type: 'String',
              value: regInsigniaURL.toString(),
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
      }
      else {
        setMsgText('Please connect Zilpay');
        setMsgOpen(true);
      }
    }

    run();
  }, [maxInsigniaID, regInsigniaName, regInsigniaURL]);

  const openDeleteInsignia = (id, name) => {
    setDelInsigniaId(id);
    setDelInsigniaName(name);
    setDelInsigniaOpen(true);
  }

  const deleteInsignia = async(id) => {
    if (rdxbech32 != "") {
      const myGasPrice = units.toQa('2000', units.Units.Li);
      const contract = window.zilPay.contracts.at(rdxcontract);
      var res = await contract.call(
        "RemoveInsigniaTemplate",
        [
          {
            vname: 'template_id',
            type: 'Uint32',
            value: id.toString(),
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
    }
    else {
      setMsgText('Please connect Zilpay');
      setMsgOpen(true);
    }
  }

  const changeAccess = async(value, id, mode) => {
    if (rdxbech32 != "") {
      const myGasPrice = units.toQa('2000', units.Units.Li);
      const contract = window.zilPay.contracts.at(rdxcontract);
      var res = await contract.call(
        mode,
        [
          {
            vname: 'template_id',
            type: 'Uint32',
            value: id.toString(),
          },
          {
            vname: 'access',
            type: 'Bool',
            value: {
              argtypes: [],
              arguments: [],
              constructor: value?'True':'False',
            },
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
    }
    else {
      setMsgText('Please connect Zilpay');
      setMsgOpen(true);
    }
  }

  React.useEffect(() => {
    if (rdxcontractState != null) {
      var templages = rdxcontractState.insignia_templates;
      var data = [];
      var max = 0;
      for (var x in templages) {
        if (Number(x) > max) { max = Number(x); }
        data.push({
          id: x,
          name: templages[x].arguments[0],
          url: templages[x].arguments[1],
          max_id: templages[x].arguments[2],
          supply: templages[x].arguments[3],
          treasury_access: (rdxcontractState.treasury_access[x] && rdxcontractState.treasury_access[x].constructor=='True')?true:false,
          proposal_access: (rdxcontractState.proposal_access[x] && rdxcontractState.proposal_access[x].constructor=='True')?true:false,
          vote_access: (rdxcontractState.vote_access[x] && rdxcontractState.vote_access[x].constructor=='True')?true:false,
          issue_access: (rdxcontractState.issue_access[x] && rdxcontractState.issue_access[x].constructor=='True')?true:false
        });
      }
      setInsigTemplates(data);
      setMaxInsigniaID(max+1);

      var contract_address_base16 = process.env.NEXT_PUBLIC_NETWORK_TYPE != 'test'?process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE16_MAIN:process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE16_TEST;
      var rpc = process.env.NEXT_PUBLIC_NETWORK_TYPE != 'test'?process.env.NEXT_PUBLIC_RPC_MAIN:process.env.NEXT_PUBLIC_RPC_TEST;
      var wss = process.env.NEXT_PUBLIC_NETWORK_TYPE != 'test'?process.env.NEXT_PUBLIC_WSS_MAIN:process.env.NEXT_PUBLIC_WSS_TEST;
      var zilliqa = new Zilliqa(rpc);
      var subscriber = zilliqa.subscriptionBuilder.buildEventLogSubscriptions(
        wss, { addresses: [ contract_address_base16 ] }
      );
      subscriber.emitter.on(MessageType.EVENT_LOG, (event) => {
        if (event.value) {
          for(var x in event.value) {
            var address = contract_address_base16.replace('0x', '');
            if (event.value[x].address == address) {
              var logs = event.value[x].event_logs;
              for (var y in logs) {
                if (logs[y]._eventname == "CreateInsigniaTemplateSuccess") {
                  setOpenRegInsignia(false);
                  setIsLoding(false);
                  var state = JSON.parse(JSON.stringify(rdxcontractState));
                  state.insignia_templates[logs[y].params[2].value.toString()] = {
                    argtypes: [],
                    arguments: [logs[y].params[3].value.toString(), logs[y].params[4].value.toString(), 0, 0],
                    constructor: "0x12eb8525a3a71090014f0b18ee17174640721339.Template"
                  }
                  dispatch(setContractState(state));
                }
                else if (logs[y]._eventname == "RemoveInsigniaTemplateSuccess") {
                  setDelInsigniaOpen(false);
                  setIsLoding(false);
                  var state = JSON.parse(JSON.stringify(rdxcontractState));
                  delete(state.insignia_templates[logs[y].params[2].value.toString()]);
                  dispatch(setContractState(state));
                }
                else if (logs[y]._eventname == "SetTreasuryAccessSuccess") {
                  setIsLoding(false);
                  var state = JSON.parse(JSON.stringify(rdxcontractState));
                  state.treasury_access[logs[y].params[2].value.toString()] = logs[y].params[3].value;
                  dispatch(setContractState(state));
                }
                else if (logs[y]._eventname == "SetProposalAccessSuccess") {
                  setIsLoding(false);
                  var state = JSON.parse(JSON.stringify(rdxcontractState));
                  state.proposal_access[logs[y].params[2].value.toString()] = logs[y].params[3].value;
                  dispatch(setContractState(state));
                }
                else if (logs[y]._eventname == "SetVoteAccessSuccess") {
                  setIsLoding(false);
                  var state = JSON.parse(JSON.stringify(rdxcontractState));
                  state.vote_access[logs[y].params[2].value.toString()] = logs[y].params[3].value;
                  dispatch(setContractState(state));
                }
                else if (logs[y]._eventname == "SetIssueAccessSuccess") {
                  setIsLoding(false);
                  var state = JSON.parse(JSON.stringify(rdxcontractState));
                  state.issue_access[logs[y].params[2].value.toString()] = logs[y].params[3].value;
                  dispatch(setContractState(state));
                }
              }
            }
          }
        }
      });
      subscriber.start();

      for (var iid in rdxmyinsignias) {
        if (rdxmyinsignias[iid] && rdxmyinsignias[iid].length > 0) {
          if (rdxcontractState.insignia_templates[iid] && rdxcontractState.insignia_templates[iid].arguments[0] == 'Golden') {
            setConfigurable(true);
          }
        }
      }
      if (rdxcontractState && rdxcontractState.contract_owner && rdxcontractState.contract_owner.toUpperCase() == rdxbase16.toUpperCase()) {
        setConfigurable(true);
      }
    }
  }, [rdxmyinsignias, rdxcontractState])

  React.useEffect(() => {
    
  }, []);

  return (
    <div className='w-full h-screen bg-color overflow-y-auto'>
      <Navbar></Navbar>

      {isLoding && 
        <Snipping></Snipping>
      }
      
      <div className='pt-20 flex flex-row-reverse'>
        <div className='w-40 border rounded-full m-3 p-3 text-white text-center cursor-pointer hover:text-rose-100' onClick={() => setOpenRegInsignia(true)}>Register Insignia</div>
      </div>

      <div className='flex flex-wrap justify-center'>
        {insigTemplates.map((item) =>
          <div key={item.id} className={`w-full lg:w-1/5 md:w-1/3 sm:w-1/2 py-4 border-2 rounded-3xl m-10`}>
            <div className={`relative -top-2 right-3 text-right`}>
              <DeleteIcon className='cursor-pointer text-white hover:text-rose-100' onClick={() => openDeleteInsignia(item.id, item.name)}></DeleteIcon>
            </div>
            <div className='w-32 h-32 mx-auto rounded-full' style={{backgroundImage:`url(${item.url})`, backgroundSize:'100% 100%'}}></div>
            <div className='text-center mt-3 text-lg text-white'>Name: {item.name}</div>
            <div className='text-center mt-2 text-lg text-white'>Supply: {item.supply}</div>
            <div className='text-center mt-2 text-lg text-white'>Access treasury:
              {configurable?
                <Checkbox sx={{
                  color: indigo[100],
                  '&.Mui-checked': {
                    color: green[500],
                  },
                  }} checked={item.treasury_access} onChange={(evt) => changeAccess(evt.target.checked, item.id, 'SetTreasuryAccess')}
                ></Checkbox>
              :
                <Checkbox sx={{
                  color: indigo[100],
                  '&.Mui-checked': {
                    color: green[500],
                  },
                  }}
                  checked={item.treasury_access}
                ></Checkbox>
              }
            </div>
            <div className='text-center mt-0 text-lg text-white'>Create proposal:
              {configurable?
                <Checkbox sx={{
                  color: indigo[100],
                  '&.Mui-checked': {
                    color: green[500],
                  },
                }} checked={item.proposal_access} onChange={(evt) => changeAccess(evt.target.checked, item.id, 'SetProposalAccess')}></Checkbox>
              :
                <Checkbox sx={{
                  color: indigo[100],
                  '&.Mui-checked': {
                    color: green[500],
                  },
                }} checked={item.proposal_access}></Checkbox>
              }
            </div>  
            <div className='text-center mt-0 text-lg text-white'>Vote proposal:
              {configurable?
                <Checkbox sx={{
                  color: indigo[100],
                  '&.Mui-checked': {
                    color: green[500],
                  },
                }} checked={item.vote_access} onChange={(evt) => changeAccess(evt.target.checked, item.id, 'SetVoteAccess')}></Checkbox>
              :
                <Checkbox sx={{
                  color: indigo[100],
                  '&.Mui-checked': {
                    color: green[500],
                  },
                }} checked={item.vote_access}></Checkbox>
              }
            </div>
            <div className='text-center mt-0 text-lg text-white'>Issue Insignia:
              {configurable?
                <Checkbox sx={{
                  color: indigo[100],
                  '&.Mui-checked': {
                    color: green[500],
                  },
                }} checked={item.issue_access} onChange={(evt) => changeAccess(evt.target.checked, item.id, 'SetIssueAccess')}></Checkbox>
              :
                <Checkbox sx={{
                  color: indigo[100],
                  '&.Mui-checked': {
                    color: green[500],
                  },
                }} checked={item.issue_access}></Checkbox>
              }
            </div>
            <div onClick={() => { router.push(`/insignia/${item.id}`) }} className='text-center mt-2 text-lg text-white border p-2 rounded-full mx-7 cursor-pointer hover:bg-fuchsia-700'>Explorer</div>
          </div>
        )}
      </div>

      <Dialog open={openRegInsignia} onClose={() => setOpenRegInsignia(false)}>
        <DialogTitle>Register Insignia Template</DialogTitle>
        <DialogContent className='w-96'>
          <TextField onChange={(e) => setRegInsigniaName(e.target.value)} className='w-full' label="Name" variant="standard" />
          <TextField onChange={(e) => setRegInsigniaURL(e.target.value)} className='w-full' label="Image URL" variant="standard" />
        </DialogContent>
        <DialogActions>
          <div className='m-2 p-2 border rounded-lg cursor-pointer hover:font-medium' onClick={() => registerInsignia()}>Register</div>
          <div className='m-2 p-2 border rounded-lg cursor-pointer hover:font-medium' onClick={() => setOpenRegInsignia(false)}>Cancel</div>
        </DialogActions>
      </Dialog>

      <Dialog
        open={delInsigniaOpen}
        onClose={() => { setDelInsigniaOpen(false); }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogContent>
          <DialogContentText>
            Do you want to delete {delInsigniaName} insignia template?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => { deleteInsignia(delInsigniaId); }}>Delete</Button>
          <Button variant="outlined" onClick={() => { setDelInsigniaOpen(false); }}>Cancel</Button>
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
