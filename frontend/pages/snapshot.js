import React from 'react';
import { useRouter } from 'next/router';
const axios = require('axios');

import { Navbar } from '../modules/Navbar';
import { Snipping } from '../modules/Snipping';

import { useSelector } from 'react-redux';
import { bech32, base16, contractState, myinsignias } from './../modules/ZilpaySlice';

import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function Sanpshot() {
  const router = useRouter();

  const rdxbech32 = useSelector(bech32);
  const rdxbase16 = useSelector(base16);
  const rdxcontractState = useSelector(contractState);
  const rdxmyinsignias = useSelector(myinsignias);

  const [openSubmit, setOpenSubmit] = React.useState(false);
  const [submitAddress, setSubmitAddress] = React.useState('');
  const [submitAmount, setSubmitAmount] = React.useState('');
  const [submitTag, setSubmitTag] = React.useState('');
  const [submitDeadline, setSubmitDeadline] = React.useState('');
  const [ableToPropose, setAbleToPropose] = React.useState(false);
  
  const [option, setOption] = React.useState('active');
  const [proposals, setProposals] = React.useState([]);

  const [msgOpen, setMsgOpen] = React.useState(false);
  const [msgText, setMsgText] = React.useState('');
  const [isLoding, setIsLoding] = React.useState(false);

  const submitProposal = React.useCallback(() => {
    var ts = new Date();
    var JSONBody = {
      pinataMetadata: {
        name: 'Pele_proposal',
        keyvalues: {
          proposer: rdxbech32,
          proposal: submitTag,
          state: 'active',
          created: ts.getTime()
        }
      },
      pinataContent: {
        proposal: submitTag,
        deadline: submitDeadline,
        amount: submitAmount,
        receive_address: submitAddress
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
      var data = proposals;
      data.push({
        ipfs_pin_hash: response.data.IpfsHash,
        proposal: submitTag,
        proposer: rdxbech32,
        state: 'active'
      });
      setProposals(data);
      setIsLoding(false);
      setOpenSubmit(false);

      var url = `https://api.pinata.cloud/pinning/hashMetadata`;
      var body = {
        ipfsPinHash: response.data.IpfsHash,
        keyvalues: {
          pinHash: response.data.IpfsHash
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
      })
      .catch(function (error) {
        console.log(error);
      });
    })
    .catch(function (error) {
      console.log(error);
      setIsLoding(false);
      setOpenSubmit(false);
    });
  }, [submitAddress, submitAmount, submitTag, submitDeadline, rdxbech32, proposals]);

  React.useEffect(() => {
    setAbleToPropose(false);
    for (var iid in rdxmyinsignias) {
      if (rdxmyinsignias[iid] && rdxmyinsignias[iid].length > 0) {
        if (rdxcontractState.proposal_access[iid] && rdxcontractState.proposal_access[iid].constructor == 'True') {
          setAbleToPropose(true);
        }
      }
    }
    if (rdxcontractState && rdxcontractState.contract_owner && rdxcontractState.contract_owner.toUpperCase() == rdxbase16.toUpperCase()) {
      setAbleToPropose(true);
    }
  }, [rdxmyinsignias, rdxcontractState]);

  React.useEffect(() => {
    var url = 'https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=Pele_proposal';
    if (option != 'all') {
      url += '&metadata[keyvalues]={"state":{"value":"'+option+'","op":"eq"}}';
    }
    axios.get(url, {
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      }
    })
    .then(function(res) {
      var data = [];
      var rows = res.data.rows;
      for (var x in rows) {
        data.push({
          ipfs_pin_hash: rows[x].ipfs_pin_hash,
          proposal: rows[x].metadata.keyvalues.proposal,
          proposer: rows[x].metadata.keyvalues.proposer,
          state: rows[x].metadata.keyvalues.state
        });
      }
      setProposals(data);
    })
    .catch(function (error) {
      console.log(error)
    });
  }, [option]);

  return (
    <div className='w-full h-screen bg-color overflow-y-auto'>
      <Navbar></Navbar>

      {isLoding && 
        <Snipping></Snipping>
      }

      <div className='pt-24 pb-2 p-10 flex'>
        <div className={`w-32 border rounded-full m-3 p-3 text-white text-center cursor-pointer hover:text-rose-100 ${option=='all'?'bg-purple-800':''}`} onClick={() => setOption('all')}>All</div>
        <div className={`w-32 border rounded-full m-3 p-3 text-white text-center cursor-pointer hover:text-rose-100 ${option=='active'?'bg-purple-800':''}`} onClick={() => setOption('active')}>Active</div>
        <div className={`w-32 border rounded-full m-3 p-3 text-white text-center cursor-pointer hover:text-rose-100 ${option=='success'?'bg-purple-800':''}`} onClick={() => setOption('success')}>Success</div>
        <div className={`w-36 border rounded-full m-3 p-3 text-white text-center cursor-pointer hover:text-rose-100 ${option=='failed'?'bg-purple-800':''}`} onClick={() => setOption('cancelled')}>Failed/Cancelled</div>
        <div className='grow '></div>
        {ableToPropose?
          <div className='w-40 border rounded-full m-3 p-3 text-white text-center cursor-pointer hover:text-rose-100' onClick={() => setOpenSubmit(true)}>Create Proposal</div>
        :
          <div className='w-40 border border-slate-500 rounded-full m-3 p-3 text-slate-400 text-center'>Create Proposal</div>
        }
      </div>
      
      <div className='flex lg:flex-nowrap flex-wrap container mx-auto'>
        <div className='w-full'>
          {proposals.map((item) =>
            <div key={item.ipfs_pin_hash} className='m-2 p-4 bg-cyan-200/90 rounded-3xl cursor-pointer hover:bg-cyan-200/80' onClick={() => router.push('/snapshot/'+item.ipfs_pin_hash)}>
              <div className='relative top-2 bg-purple-600 w-fit py-1 px-3 rounded-full text-white'>{item.state}</div>
              <div className='text-lg -mt-6 ml-24'>{item.proposal}</div>
              <div className='text-right'>Proposed by <span className='font-medium'>{item.proposer}</span></div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={openSubmit} onClose={() => setOpenSubmit(false)}>
        <DialogTitle>Submit proposal</DialogTitle>
        <DialogContent className='w-96'>
          <TextField onChange={(e) => setSubmitTag(e.target.value)} className='w-full mt-2' label="Proposal" variant="standard" multiline rows={4} maxRows={8} />
          <TextField 
            onChange={(e) => setSubmitDeadline(e.target.value)} className='w-full mt-2 hideLabel' label="Deadline" variant="standard"
            type="date"
          />
          <TextField onChange={(e) => setSubmitAmount(e.target.value)} className='w-full mt-2' label="Amount" variant="standard" />
          <TextField onChange={(e) => setSubmitAddress(e.target.value)} className='w-full' label="Receiving Address" variant="standard" />
        </DialogContent>
        <DialogActions>
          <div className='m-2 p-2 border rounded-lg cursor-pointer hover:font-medium' onClick={() => submitProposal()}>Submit</div>
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
