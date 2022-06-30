import React from 'react';

import { Navbar } from '../modules/Navbar';

import { useSelector } from 'react-redux';
import { contractState,  myinsignias } from './../modules/ZilpaySlice';

export default function Mycollection() {
  const rdxmyinsignias = useSelector(myinsignias);
  const rdxcontractState = useSelector(contractState);

  const [insignias, setInsignias] = React.useState([]);

  React.useEffect(() => {
    if (rdxcontractState != null) {
      var data = [];
      var index = 1;
      for (var x in rdxmyinsignias) {
        for (var y in rdxmyinsignias[x]) {
          data.push({
            id: index,
            tid: x,
            iid: rdxmyinsignias[x][y],
            name: rdxcontractState.insignia_templates[x].arguments[0],
            url: rdxcontractState.insignia_templates[x].arguments[1]
          });
          index ++;
        }
      }
      setInsignias(data);
    }
  }, [rdxcontractState, rdxmyinsignias])

  return (
    <div className='w-full h-screen bg-color overflow-y-auto'>
      <Navbar></Navbar>

      <div className='flex flex-wrap justify-center pt-20'>
        {insignias.map((item) =>
          <div key={item.id} className={`w-full lg:w-1/5 md:w-1/3 sm:w-1/2 py-4 border-2 rounded-3xl m-10`}>
            <div className='w-32 h-32 mx-auto rounded-full' style={{backgroundImage:`url(${item.url})`, backgroundSize:'100% 100%'}}></div>
            <div className='text-center mt-3 text-lg text-white'>Name: {item.name}</div>
            <div className='text-center mt-2 text-lg text-white'>ID: {item.iid}</div>
          </div>
        )}
      </div>
    </div>
  )
}
