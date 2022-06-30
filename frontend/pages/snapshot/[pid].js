import React from 'react';
import { useRouter } from 'next/router';
const axios = require('axios');

import { Navbar } from '../../modules/Navbar';
import { Snipping } from '../../modules/Snipping';

import { useSelector, useDispatch } from 'react-redux';
import { setContractState, setMyInsignias } from "./../../modules/ZilpaySlice";
import { bech32, base16, contract, contractState, version, myinsignias } from './../../modules/ZilpaySlice';

const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { MessageType } = require('@zilliqa-js/subscriptions');
const { toBech32Address, fromBech32Address } = require('@zilliqa-js/crypto')
import hash from 'hash.js';

import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PropTypes from 'prop-types';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function LinearProgressWithLabel(props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
}

function NewlineText(props) {
  const text = props.text;
  var i=0;
  return text.split('\n').map(str => <p key={i++}>{str}</p>);
}


const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const { BN, Long, bytes, units } = require('@zilliqa-js/util');

export default function Sanpshot() {
  const router = useRouter();
  const { pid } = router.query;
  const dispatch = useDispatch();

  const rdxcontract = useSelector(contract);
  const rdxbech32 = useSelector(bech32);
  const rdxbase16 = useSelector(base16);
  const rdxversion = useSelector(version);
  const rdxcontractState = useSelector(contractState);
  const rdxmyinsignias = useSelector(myinsignias);

  const [proposal, setProposal] = React.useState('');
  const [deadline, setDeadline] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [amount, setAmount] = React.useState(0);
  const [proposalState, setProposalState] = React.useState('');
  const [voteStep, setVoteStep] = React.useState(0);
  const [peleVoter, setPeleVoter] = React.useState(0);
  const [peleHolder, setPeleHolder] = React.useState(0);
  const [peleRate, setPeleRate] = React.useState(0);
  const [insigniaVoter, setInsigniaVoter] = React.useState(0);
  const [insigniaHolder, setInsigniaHolder] = React.useState(0);
  const [insigniaRate, setInsigniaRate] = React.useState(0);
  const [votablePele, setVotablePele] = React.useState(false);
  const [votableInsignia, setVotableInsignia] = React.useState(false);
  const [cancelProposal, setCancelProposal] = React.useState(false);
  const [myPeleVoteSate, setMyPeleVoteSate] = React.useState(-1);
  const [myInsigniaVoteSate, setMyInsigniaVoteSate] = React.useState(-1);
  
  const [openDelete, setOpenDelete] = React.useState(false);

  const [msgOpen, setMsgOpen] = React.useState(false);
  const [msgType, setMsgType] = React.useState('error');
  const [msgText, setMsgText] = React.useState('');
  const [isLoding, setIsLoding] = React.useState(false);

  const getPeleState = async() => {
    var rpc = process.env.NEXT_PUBLIC_RPC_MAIN;
    var contract_address = process.env.NEXT_PUBLIC_PELE_ADDRESS_MAIN;
    if (process.env.NEXT_PUBLIC_NETWORK_TYPE == 'test') {
      rpc = process.env.NEXT_PUBLIC_RPC_TEST;
      contract_address = process.env.NEXT_PUBLIC_PELE_ADDRESS_TEST;
    }
    var zilliqa = new Zilliqa(rpc);
    if (window && window.zilPay) {
      const zilPay = window.zilPay;
      const result = await zilPay.wallet.connect();
      if (result) {
        zilliqa = zilPay;
      }
    }
    const contract = zilliqa.contracts.at(contract_address);
    const state = await contract.getState();
    for (var x in state.balances) {
      if (x.toUpperCase() == rdxbase16.toUpperCase()) {
        setVotablePele(true);
      }
    }
    setPeleHolder(Object.keys(state.balances).length)
  }

  const getPeleVoter = (proposal_id) => {
    var url = 'https://api.pinata.cloud/data/pinList?status=pinned&';
    url += '&metadata[keyvalues]={"proposal_id":{"value":"'+proposal_id+'","op":"eq"}, "step":{"value":"1","op":"eq"}, "vote":{"value":"1","op":"eq"}}';
    axios.get(url, {
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      }
    })
    .then(function(res) {
      setPeleVoter(res.data.rows.length);
    })
    .catch(function (error) {
      console.log(error)
    });
  }
  const getPeleVotingRate = (proposal_id) => {
    var url = process.env.NEXT_PUBLIC_DIST_API + 'calPeleVoteRate?pid=' + proposal_id;
    axios.get(url)
    .then(function (response) {
      var res = response.data;
      if (res.state == 'ok') {
        setPeleRate(Number(res.data));
      }
    })
    .catch(function (error) {
      console.log(error);
    });
  }
  const getMyPeleVoteState = (proposal_id, myaddress) => {
    var url = 'https://api.pinata.cloud/data/pinList?status=pinned&';
    url += '&metadata[keyvalues]={"proposal_id":{"value":"'+proposal_id+'","op":"eq"}, "step":{"value":"1","op":"eq"}, "proposer":{"value":"'+myaddress+'","op":"eq"}}';
    axios.get(url, {
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      }
    })
    .then(function(res) {
      if (res.data.rows.length > 0) {
        setMyPeleVoteSate(res.data.rows[0].metadata.keyvalues.vote)
      }
    })
    .catch(function (error) {
      console.log(error)
    });
  }
  const getInsigniaVoter = (proposal_id) => {
    var url = 'https://api.pinata.cloud/data/pinList?status=pinned&';
    url += '&metadata[keyvalues]={"proposal_id":{"value":"'+proposal_id+'","op":"eq"}, "step":{"value":"2","op":"eq"}, "vote":{"value":"1","op":"eq"}}';
    axios.get(url, {
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      }
    })
    .then(function(res) {
      setInsigniaVoter(res.data.rows.length);
    })
    .catch(function (error) {
      console.log(error)
    });
  }
  const getMyInsigniaVoteState = (proposal_id, myaddress) => {
    var url = 'https://api.pinata.cloud/data/pinList?status=pinned&';
    url += '&metadata[keyvalues]={"proposal_id":{"value":"'+proposal_id+'","op":"eq"}, "step":{"value":"2","op":"eq"}, "proposer":{"value":"'+myaddress+'","op":"eq"}}';
    axios.get(url, {
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      }
    })
    .then(function(res) {
      if (res.data.rows.length > 0) {
        setMyInsigniaVoteSate(res.data.rows[0].metadata.keyvalues.vote)
      }
    })
    .catch(function (error) {
      console.log(error)
    });
  }

  const fCancelProposal = () => {
    var url = `https://api.pinata.cloud/pinning/hashMetadata`;
    var body = {
      ipfsPinHash: pid,
      keyvalues: {
        state: 'cancelled'
      }
    };
    axios.put(url, body, {
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      }
    })
    .then(function (response) {
      console.log(response);
      setMsgType("error");
      setMsgText('Proposal is cancelled');
      setMsgOpen(true);
      setOpenDelete(false);
    })
    .catch(function (error) {
      console.log(error);
      setOpenDelete(false);
    });
  }

  const winningAction = React.useCallback(() => {
    var url = `https://api.pinata.cloud/pinning/hashMetadata`;
    var body = {
      ipfsPinHash: pid,
      keyvalues: {
        state: 'success'
      }
    };
    axios.put(url, body, {
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      }
    })
    .then(function (response) {
      console.log(response);
      setMsgType("success");
      setMsgText('Proposal is successed');
      setMsgOpen(true);
    })
    .catch(function (error) {
      console.log(error);
    });

    url = process.env.NEXT_PUBLIC_DIST_API + 'setDistributor';
    body = {
      address: address,
      deadline: deadline, 
      amount: amount
    };
    axios.post(url, body)
    .then(function (response) {
      console.log(response);
    })
    .catch(function (error) {
      console.log(error);
    });
  }, [deadline, address, amount]);

  const fVote = async(dir, step, addr, amount, pv, iv, ih) => {
    var base16_address = fromBech32Address(addr);
    const candidate = base16_address.replace('0x', '');
    const template_id = amount;

    const template_id_bn = new BN(template_id);
    const uint_ti = Uint8Array.from(template_id_bn.toArrayLike(Buffer, undefined, 4));

    const candidate_hash = hash.sha256().update(bytes.hexToByteArray(candidate)).digest('hex');
    const ti_hash = hash.sha256().update(uint_ti).digest('hex');
    var msg = candidate_hash + ti_hash;

    const { signature, message, publicKey } = await window.zilPay.wallet.sign(msg);

    var ts = new Date();
    var JSONBody = {
      pinataMetadata: {
        name: 'Pele_vote_'+pid,
        keyvalues: {
          proposal_id: pid,
          proposer: rdxbech32,
          vote: dir,
          step: step,
          created: ts.getTime()
        }
      },
      pinataContent: {
        proposal_id: pid,
        publicKey: publicKey,
        signature: signature,
        vote: dir,
        step: step,
        created: ts.getTime()
      }
    }
    setIsLoding(true);
    var url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    axios.post(url, JSONBody, {
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      }
    })
    .then(function (response) {
      if (dir == 1) {
        setMsgType("success");
        setMsgText("Vote Successfull");
        if (step == 2) {
          setInsigniaVoter(1+iv);
          var rate2 = Number(1+iv) / Number(ih) * 100;
          if (rate2 >= (2/3)) {
            winningAction();
          }
        }
        else {
          getPeleVotingRate(pid);
        }
      }
      else {
        setMsgType("success");
        setMsgText("Against Successfull");
      }
      setMsgOpen(true);
      setIsLoding(false);
    })
    .catch(function (error) {
      console.log(error);
      setIsLoding(false);
    });
  }

  const vote = React.useCallback((dir) => {
    if (proposalState == 'cancelled') {
      setMsgType("error");
      setMsgText('This proposal is cancelled.');
      setMsgOpen(true);
      return;
    }

    if (voteStep == 1 || voteStep == 2) {
      if (voteStep == 1 && votablePele  == false) {
        setMsgType("error");
        setMsgText('You are not PELE holder.');
        setMsgOpen(true);
        return;
      }
      if (voteStep == 2 && votableInsignia  == false) {
        setMsgType("error");
        setMsgText('You are not insignia holder.');
        setMsgOpen(true);
        return;
      }
      if (voteStep == 1 && myPeleVoteSate >-1) {
        if (myPeleVoteSate == 0) {
          setMsgType("error");
          setMsgText('You already voted.');
        }
        else {
          setMsgType("error");
          setMsgText('You already againsted.');
        }
        setMsgOpen(true);
        return;
      }
      if (voteStep == 2 && myInsigniaVoteSate >-1) {
        if (myInsigniaVoteSate == 0) {
          setMsgType("error");
          setMsgText('You already voted.');
        }
        else {
          setMsgType("error");
          setMsgText('You already againsted.');
        }
        setMsgOpen(true);
        return;
      }
      fVote(dir, voteStep, address, amount, peleVoter, insigniaVoter, insigniaHolder);
    }
    else {
      setMsgType("error");
      setMsgText('This proposal is not able to vote.');
      setMsgOpen(true);
    }
  }, [proposalState, voteStep, votablePele, votableInsignia, address, amount, myPeleVoteSate, myInsigniaVoteSate, insigniaVoter, peleVoter, insigniaHolder]);

  React.useEffect(() => {
    if (proposalState == 'active' || proposalState == 'success') {
      if (peleRate < 51) {
        setVoteStep(1);
      }
      if (insigniaHolder > 0) {
        var rate2 = Number(insigniaVoter) / Number(insigniaHolder) * 100;
        setInsigniaRate(rate2);
        if (peleRate >= 51) {
          if (rate2 >= (200/3)) {
            setVoteStep(3);
          }
          else {
            setVoteStep(2);
          }
        }
      }
    }
    // else if (proposalState == 'success') {
    //   setVoteStep(3);
    // }
  }, [proposalState, peleRate, insigniaVoter, insigniaHolder]);

  React.useEffect(() => {
    setCancelProposal(false);
    setVotableInsignia(false);
    for (var iid in rdxmyinsignias) {
      if (rdxmyinsignias[iid] && rdxmyinsignias[iid].length > 0) {
        if (rdxcontractState.vote_access[iid] && rdxcontractState.vote_access[iid].constructor == 'True') {
          setVotableInsignia(true);
        }
      }
    }
    if (rdxcontractState!=null && rdxcontractState.insignia_templates) {
      var sum = 0;
      for (var x in rdxcontractState.insignia_templates) {
        if (rdxcontractState.vote_access[x] && rdxcontractState.vote_access[x].constructor=="True") {
          sum += Number(rdxcontractState.insignia_templates[x].arguments[3]);
        }
      }
      setInsigniaHolder(sum);
    }
    if (rdxcontractState && rdxcontractState.contract_owner && rdxcontractState.contract_owner.toUpperCase() == rdxbase16.toUpperCase()) {
      setCancelProposal(true);
      setVotableInsignia(true);
    }
  }, [rdxmyinsignias, rdxcontractState]);

  React.useEffect(() => {
    setIsLoding(true);
    axios.get(process.env.NEXT_PUBLIC_PINATA_GATEWAY+pid)
    .then((cb) => {
      setProposal(cb.data.proposal)
      setDeadline(cb.data.deadline)
      setAddress(cb.data.receive_address)
      setAmount(cb.data.amount)
      setIsLoding(false);
    })
    .catch((err) => {
      setIsLoding(false);
    });

    var url = 'https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=Pele_proposal';
    url += '&metadata[keyvalues]={"pinHash":{"value":"'+pid+'","op":"eq"}}';
    axios.get(url, {
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      }
    })
    .then(function(res) {
      setProposalState(res.data.rows[0].metadata.keyvalues.state);
    })
    .catch(function (error) {
      console.log(error)
    });

    getPeleState();
    getPeleVoter(pid);
    getPeleVotingRate(pid);
    getInsigniaVoter(pid);
    getMyPeleVoteState(pid, rdxbech32);
    getMyInsigniaVoteState(pid, rdxbech32);
  }, []);

  return (
    <div className='w-full h-screen bg-color overflow-y-auto'>
      <Navbar></Navbar>

      {isLoding && 
        <Snipping></Snipping>
      }
      
      <div className='pt-24 px-4 pb-4 flex h-screen'>
        <div className='m-2 p-4 rounded-3xl flex-grow bg-cyan-200/90'>
          <div className='mb-4'>
            <div className='flex w-full justify-between'>
              <div>
                <ArrowBackIcon className='cursor-pointer' onClick={() => router.push('/snapshot')}></ArrowBackIcon>
              </div>
              <div className={`mx-2 w-fit px-2 border rounded-full ${proposalState=='success'?'border-green-700 bg-green-700':''} ${proposalState=='active'?'border-purple-800 bg-purple-800':''} ${proposalState=='cancelled'?'border-red-800 bg-red-800':''} text-white`}>{proposalState}</div>
            </div>
          </div>
          <div className='text-xl'>
            <NewlineText text={proposal} />
          </div>
          <div className='m-2'>Deadline: {deadline}</div>
          <div className='m-2 flex'><div>Receiver Address: </div><div className='elliptxt'>{address}</div><div>{address.substr(-4)}</div></div>
          <div className='m-2'>Amount: {amount}</div>
          <div className='mt-6'>
            <div className='text-lg'>PELE Holders ({peleVoter} / {peleHolder})</div>
            <div className='md:flex'>
              <div className='flex-grow'><LinearProgressWithLabel value={peleRate} /></div>
              <div className={`w-32 mx-2 w-fit px-2 border rounded-full ${voteStep==1?'bg-purple-800 border-purple-800':''} ${voteStep>1?'bg-green-700 border-green-700':''} text-white`}>
                {voteStep == 1 &&
                  `In progress`
                }
                {voteStep > 1 &&
                  `Passed`
                }
              </div>
            </div>
          </div>
          <div className='mt-6'>
            <div className='text-lg'>Insignia Holders ({insigniaVoter} / {insigniaHolder})</div>
            <div className='md:flex'>
              <div className='flex-grow'><LinearProgressWithLabel value={insigniaRate} /></div>
              <div className={`w-32 mx-2 w-fit px-2 border rounded-full ${voteStep>1?'bg-purple-800 border-purple-800':'bg-green-700 border-green-700'} text-white`}>
                {voteStep == 1 &&
                  `Not started`
                }
                {voteStep == 2 &&
                  `In progress`
                }
                {voteStep > 2 &&
                  `Passed`
                }
              </div>
            </div>
          </div>
        </div>
        <div className='m-2 rounded-3xl w-80'>
          <div className='border rounded-full m-3 p-2 text-white text-2xl text-center cursor-pointer hover:text-rose-100' onClick={() => vote(1)}>{voteStep==1||voteStep==2?`Stage ${voteStep} `:''}Vote</div>
          <div className='border rounded-full m-3 p-2 text-white text-2xl text-center cursor-pointer hover:text-rose-100' onClick={() => vote(0)}>Against</div>
          {cancelProposal &&
            <div className='border rounded-full m-3 p-2 text-white text-2xl text-center cursor-pointer hover:text-rose-100' onClick={() => setOpenDelete(true)}>Cancel</div>
          }
          <a className='block border rounded-full m-3 p-2 text-white text-2xl text-center cursor-pointer hover:text-rose-100' href="https://t.me/getyousomepele">Discuss</a>
        </div>
      </div>

      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Do you want to ancel this proposal?</DialogTitle>
        <DialogActions>
          <div className='m-2 p-2 border rounded-lg cursor-pointer hover:font-medium' onClick={() => fCancelProposal()}>Sure, cancel proposal</div>
          <div className='m-2 p-2 border rounded-lg cursor-pointer hover:font-medium' onClick={() => setOpenDelete(false)}>Close</div>
        </DialogActions>
      </Dialog>

      <Snackbar
        anchorOrigin={{ vertical:'bottom', horizontal:'right' }}
        open={msgOpen}
        autoHideDuration={6000}
        onClose={() => { setMsgOpen(false) }}
      >
        <Alert onClose={() => { setMsgOpen(false) }} severity={msgType} sx={{ width: '100%' }}>{msgText}</Alert>
      </Snackbar>
    </div>
  )
}
