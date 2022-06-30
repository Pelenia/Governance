import React from 'react';
import { useRouter } from 'next/router';

import { Navbar } from '../../modules/Navbar';
import { Snipping } from '../../modules/Snipping';

import { useSelector, useDispatch } from 'react-redux';
import { setContractState, setMyInsignias } from "./../../modules/ZilpaySlice";
import { bech32, base16, contract, contractState, version, myinsignias } from './../../modules/ZilpaySlice';

const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { MessageType } = require('@zilliqa-js/subscriptions');
const { toBech32Address, fromBech32Address } = require('@zilliqa-js/crypto')

import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import hash from 'hash.js';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const { BN, Long, bytes, units } = require('@zilliqa-js/util');

export default function Home() {
  const router = useRouter();
  const { pid } = router.query;
  const dispatch = useDispatch();

  const rdxcontract = useSelector(contract);
  const rdxbech32 = useSelector(bech32);
  const rdxbase16 = useSelector(base16);
  const rdxversion = useSelector(version);
  const rdxcontractState = useSelector(contractState);
  const rdxmyinsignias = useSelector(myinsignias);

  const [openRegInsignia, setOpenRegInsignia] = React.useState(false);
  const [issueTgtAddress, setIssueTgtAddress] = React.useState('');

  const [insigTemplate, setInsigTemplate] = React.useState({name:'', url:'', max_id:0, supply:0});
  const [pendingMaxId, setPendingMaxId] = React.useState(0);
  const [approveLimit, setApproveLimit] = React.useState(0);
  const [holders, setHolders] = React.useState([]);
  const [pendings, setPendings] = React.useState([]);
  const [voteable, setVoteable] = React.useState(false);
  const [voteTemplate, setVoteTemplate] = React.useState(0);
  const [voteInsignia, setVoteInsignia] = React.useState(0);

  const [msgOpen, setMsgOpen] = React.useState(false);
  const [msgText, setMsgText] = React.useState('');
  const [isLoding, setIsLoding] = React.useState(false);

  const issueInsignia = async (funcname, pending_id, tgtaddres, tid, iid) => {
    if (rdxbech32 != "") {
      var base16_address = fromBech32Address(tgtaddres);
      const from_addr = rdxbase16.replace('0x', '');
      const sender_template_id = tid;
      const sender_insignia_id = iid;
      const candidate = base16_address.replace('0x', '');
      const template_id = pid;

      const sender_template_id_bn = new BN(sender_template_id);
      const sender_insignia_id_bn = new BN(sender_insignia_id);
      const template_id_bn = new BN(template_id);
      const pending_id_bn = new BN(pending_id);
      const uint_sti = Uint8Array.from(sender_template_id_bn.toArrayLike(Buffer, undefined, 4));
      const uint_sii = Uint8Array.from(sender_insignia_id_bn.toArrayLike(Buffer, undefined, 16));
      const uint_ti = Uint8Array.from(template_id_bn.toArrayLike(Buffer, undefined, 4));
      const uint_pi = Uint8Array.from(pending_id_bn.toArrayLike(Buffer, undefined, 16));

      const from_hash = hash.sha256().update(bytes.hexToByteArray(from_addr)).digest('hex');
      const sti_hash = hash.sha256().update(uint_sti).digest('hex');
      const sii_hash = hash.sha256().update(uint_sii).digest('hex');
      const candidate_hash = hash.sha256().update(bytes.hexToByteArray(candidate)).digest('hex');
      const ti_hash = hash.sha256().update(uint_ti).digest('hex');
      const pi_hash = hash.sha256().update(uint_pi).digest('hex');
      var msg = from_hash + sti_hash + sii_hash + candidate_hash + ti_hash + pi_hash;

      const { signature, message, publicKey } = await window.zilPay.wallet.sign(msg);

      const myGasPrice = units.toQa('2000', units.Units.Li);
      const contract = window.zilPay.contracts.at(rdxcontract);
      var res = await contract.call(
        funcname,
        [
          {
            vname: 'pubkey',
            type: 'ByStr33',
            value: `0x${publicKey}`,
          },
          {
            vname: 'sender_template_id',
            type: 'Uint32',
            value: tid.toString(),
          },
          {
            vname: 'sender_insignia_id',
            type: 'Uint128',
            value: iid.toString(),
          },
          {
            vname: 'candidate',
            type: 'ByStr20',
            value: `0x${candidate}`,
          },
          {
            vname: 'template_id',
            type: 'Uint32',
            value: pid.toString(),
          },
          {
            vname: 'pending_id',
            type: 'Uint128',
            value: pending_id.toString(),
          },
          {
            vname: 'signature',
            type: 'ByStr64',
            value: `0x${signature}`,
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

  const approveIssue = async (pending_id) => {
    if (rdxbech32 != "") {
      const myGasPrice = units.toQa('2000', units.Units.Li);
      const contract = window.zilPay.contracts.at(rdxcontract);
      var res = await contract.call(
        'ApproveIssue',
        [
          {
            vname: 'template_id',
            type: 'Uint32',
            value: pid.toString(),
          },
          {
            vname: 'pending_id',
            type: 'Uint128',
            value: pending_id.toString(),
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
    setVoteable(false);
    for (var iid in rdxmyinsignias) {
      if (rdxmyinsignias[iid] && rdxmyinsignias[iid].length > 0) {
        if (rdxcontractState.issue_access[iid] && rdxcontractState.issue_access[iid].constructor == 'True') {
          setVoteTemplate(iid);
          setVoteInsignia(rdxmyinsignias[iid][0]);
          setVoteable(true);
        }
      }
    }
    if (rdxcontractState && rdxcontractState.contract_owner && rdxcontractState.contract_owner.toUpperCase() == rdxbase16.toUpperCase()) {
      setVoteable(true);
    }
  }, [rdxmyinsignias, rdxcontractState]);

  React.useEffect(() => {
    if (rdxcontractState != null) {
      setApproveLimit(rdxcontractState.vote_win_rate*rdxcontractState.total_votable/100);
      var templages = rdxcontractState.insignia_templates;
      setInsigTemplate({
        name: templages[pid].arguments[0],
        url: templages[pid].arguments[1],
        max_id: templages[pid].arguments[2],
        supply: templages[pid].arguments[3]
      });
      var tmp_owners = rdxcontractState.insignia_owners[pid];
      var tmp_pendings = rdxcontractState.insignia_pending[pid];
      var data_holders = [];
      if (tmp_owners) {
        for (var x in tmp_owners) {
          data_holders.push({
            id: x,
            address: toBech32Address(tmp_owners[x])
          });
        }
      }
      setHolders(data_holders);
      var max_pending_id = 0;
      var data_pending = [];
      if (tmp_pendings) {
        for (var x in tmp_pendings) {
          data_pending.push({
            id: x,
            address: toBech32Address(tmp_pendings[x].arguments[0]),
            voted: tmp_pendings[x].arguments[1]
          });
          if (x > max_pending_id) {
            max_pending_id = x;
          }
        }
      }
      max_pending_id ++;
      setPendings(data_pending);
      setPendingMaxId(max_pending_id);

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
                const run = async () => {
                  const contract = window.zilPay.contracts.at(rdxcontract);
                  const state = await contract.getState();
                  dispatch(setContractState(state));
                  var myInsignias = {}
                  var holders = state.insignia_owners;
                  for (var tid in holders) {
                    myInsignias[tid] = [];
                    for (var iid in holders[tid]) {
                      if (holders[tid][iid].toUpperCase() == window.zilPay.wallet.defaultAccount.base16.toUpperCase()) {
                        myInsignias[tid].push(iid);
                      }
                    }
                  }
                  dispatch(setMyInsignias(myInsignias))
                  
                  setIsLoding(false);
                  setOpenRegInsignia(false);
                }
                run();
              }
            }
          }
        }
      });
      subscriber.start();
    }
  }, [rdxcontractState])

  return (
    <div className='w-full h-screen bg-color overflow-y-auto'>
      <Navbar></Navbar>

      {isLoding && 
        <Snipping></Snipping>
      }
      
      <div className='pt-24 pb-2 p-10 flex items-center'>
        <div className='w-16 h-16 rounded-full justify-self-start' style={{backgroundImage:`url(${insigTemplate.url})`}}></div>
        <div className='ml-4 text-3xl text-white'>{insigTemplate.name}</div>
        <div className='grow '></div>
        {voteable?
          <div className='w-40 border rounded-full m-3 p-3 text-white text-center cursor-pointer hover:text-rose-100' onClick={() => setOpenRegInsignia(true)}>Issue Insignia</div>
        :
          <div className='w-40 border border-slate-500 rounded-full m-3 p-3 text-slate-400 text-center'>Issue Insignia</div>
        }
        <div className='w-40 border rounded-full m-3 p-3 text-white text-center cursor-pointer hover:text-rose-100' onClick={() => issueInsignia('IssueInsignia', pendingMaxId, rdxbech32, 0, 0)}>Request Insignia</div>
      </div>

      <div className='flex lg:flex-nowrap flex-wrap container mx-auto'>
        <div className='lg:w-2/5 w-full min-w-fit m-2 p-6 pb-0 bg-cyan-200/90 rounded-3xl'>
          <div className='flex m-2 p-1 justify-between'>
            <div className='w-20 text-center'>ID</div>
            <div className='grow'>Holder Address</div>
          </div>
          {holders.map((item) => 
            <div key={item.id} className='flex m-2 p-1 justify-between'>
              <div className='w-20 text-center'>{item.id}</div>
              <div className='grow flex'><div className='elliptxt'>{item.address}</div><div>{item.address.substr(-4)}</div></div>
            </div>
          )}
        </div>
        <div className='lg:w-3/5 w-full min-w-fit m-2 p-1 md:p-6 pb-0 bg-cyan-200/90 rounded-3xl'>
          <div className='flex m-2 p-1 justify-between'>
            <div className='grow'>Candiate Address</div>
            <div className='w-20 text-center'>Voted</div>
            <div className='w-44'></div>
          </div>
          {pendings.map((item) => 
            <div key={item.id} className='flex m-2 p-1 justify-between'>
              <div className='grow flex'><div className='elliptxt'>{item.address}</div><div>{item.address.substr(-4)}</div></div>
              <div className='w-20 text-center'>{item.voted}</div>
              <div className='w-44'>{
                item.address == rdxbech32?
                (item.voted >= approveLimit?
                  <Button variant="outlined" onClick={() => approveIssue(item.id)}>Approve</Button>
                :
                  <Button variant="outlined" disabled>Approve</Button>
                )
                :
                (voteable ?
                  <>
                    <Button variant="outlined" onClick={() => issueInsignia('VoteIssue', item.id, item.address, voteTemplate, voteInsignia)}>Vote</Button>{` `}
                    <Button variant="outlined" onClick={() => issueInsignia('AgainstIssue', item.id, item.address, voteTemplate, voteInsignia)}>Against</Button>
                  </>
                  :
                  <>
                    <Button variant="outlined" disabled>Vote</Button>{` `}
                    <Button variant="outlined" disabled>Against</Button>
                  </>
                )
              }</div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={openRegInsignia} onClose={() => setOpenRegInsignia(false)}>
        <DialogTitle>Issue Insignia</DialogTitle>
        <DialogContent className='w-96'>
          <TextField onChange={(e) => setIssueTgtAddress(e.target.value)} className='w-full' label="Address" variant="standard" />
        </DialogContent>
        <DialogActions>
          <div className='m-2 p-2 border rounded-lg cursor-pointer hover:font-medium' onClick={() => issueInsignia('IssueInsignia', pendingMaxId, issueTgtAddress, voteTemplate, voteInsignia)}>Issue</div>
          <div className='m-2 p-2 border rounded-lg cursor-pointer hover:font-medium' onClick={() => setOpenRegInsignia(false)}>Cancel</div>
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
