require("dotenv").config();
const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { getAddressFromPrivateKey, fromBech32Address } = require('@zilliqa-js/crypto')

var hash = require('hash.js');

const covertDecimal = (amount, decimal, dir) => {
  var strAmount = amount.toString();
  if (dir == 'toBN') {
    var arr = strAmount.split(".");
    if (arr[1] && arr[1] != '') {
      if (arr[1].length >= decimal) {
        return arr[0] + arr[1].substr(0, decimal);
      }
      else {
        var len = decimal - arr[1].length;
        var decimal = '';
        while(len > 0) {
          decimal = decimal + '0';
          len --;
        }
        return arr[0] + arr[1] + decimal;
      }
    }
    else {
      var len = decimal;
      var decimal_str = '';
      while(len > 0) {
        decimal_str = decimal_str + '0';
        len --;
      }
      return strAmount + decimal_str;
    }
  }
  else {
    if (strAmount.length > decimal) {
      var top = strAmount.substr(0, strAmount.length - decimal);
      var low = strAmount.substr(strAmount.length - decimal, 2);
      return top+"."+low;
    }
    else {
      var len = decimal - strAmount.length;
      var dec = '';
      while (len > 0) {
        dec = dec + '0';
        len --;
      }
      return '0.'+ dec + strAmount.substr(0, 2);
    }
  }
}
module.exports.covertDecimal = covertDecimal;


exports.mixedAction = async (func_name, account, amount, epoch, period, timestamp) => {
  var net_url = process.env.TEST_STREAM;
  var chain_id = process.env.TEST_CHAINID;
  var contractAddr = process.env.DISTRIBUTOR_TEST_BASE16;
  if (process.env.NET_TYEP == 'main') {
    net_url = process.env.MAIN_STREAM;
    chain_id = process.env.MAIN_CHAINID;
    contractAddr = process.env.DISTRIBUTOR_MAIN_BASE16;
  }
  contractAddr = contractAddr.replace('0x', '');
  const zilliqa = new Zilliqa(net_url);
  const VERSION = bytes.pack(Number(chain_id), Number(process.env.MSG_VERSION));

  const dist_addr = fromBech32Address(account.toString());
  const address = getAddressFromPrivateKey(process.env.PRV_KEY);
  zilliqa.wallet.addByPrivateKey(process.env.PRV_KEY);
  zilliqa.wallet.setDefault(address);

  const myGasPrice = units.toQa('2000', units.Units.Li);


  console.log("==========================================")
  try {
    const contract = zilliqa.contracts.at(contractAddr);
    const callTx = await contract.call(
      func_name,
      [
        {
          vname: 'account',
          type: 'ByStr20',
          value: dist_addr.toString(),
        },
        {
          vname: 'amount',
          type: 'Uint128',
          value: amount.toString(),
        },
        {
          vname: 'epoch',
          type: 'Uint128',
          value: epoch.toString(),
        },
        {
          vname: 'period',
          type: 'Uint128',
          value: period.toString(),
        },
        {
          vname: 'timestamp',
          type: 'String',
          value: timestamp.toString(),
        },
      ],
      {
        version: VERSION,
        amount: new BN(0),
        gasPrice: myGasPrice,
        gasLimit: Long.fromNumber(25000),
      }
    );
    console.log(callTx.receipt);
    return {
      state: 'ok',
      log : callTx.receipt
    }
  }
  catch (err) {
    console.log(err)
    return {
      state: 'err',
      log : err
    }
  }

}

exports.getState = async () => {
  var net_url = process.env.TEST_STREAM;
  if (process.env.NET_TYEP == 'main') {
    net_url = process.env.MAIN_STREAM;
  }
  const zilliqa = new Zilliqa(net_url);

  const contractAddr = process.env.CONTRACT_ADDRESS;

  try {
    const { result } = await zilliqa.blockchain.getSmartContractState(contractAddr);
    return result;
  }
  catch (err) {
    console.log(err);
    return null;
  }

}

exports.getHash = (account, amount, epoch, period, timestamp) => {
  const dist_addr = fromBech32Address(account.toString());
  const amount_bn = new BN(amount.toString()+process.env.DECIMAL)
  const epoch_bn = new BN(epoch)
  const period_bn = new BN(period)
  const uint_amount = Uint8Array.from(amount_bn.toArrayLike(Buffer, undefined, 16))
  const uint_epoch = Uint8Array.from(epoch_bn.toArrayLike(Buffer, undefined, 16))
  const uint_period = Uint8Array.from(period_bn.toArrayLike(Buffer, undefined, 16))
  const account_hash = hash.sha256().update(bytes.hexToByteArray(dist_addr.substring(2))).digest('hex')
  const amount_hash = hash.sha256().update(uint_amount).digest('hex')
  const epoch_hash = hash.sha256().update(uint_epoch).digest('hex')
  const period_hash = hash.sha256().update(uint_period).digest('hex')
  const timestamp_hash = hash.sha256().update(timestamp).digest('hex')

  const concat_str = account_hash+amount_hash+epoch_hash+period_hash+timestamp_hash;
  
  const concat_hash = hash.sha256().update(bytes.hexToByteArray(concat_str)).digest('hex')
  return '0x' + concat_hash;
}

const winningVote = async(candidate, distributor, template_id, amount) => {
  var net_url = process.env.TEST_STREAM;
  var chain_id = process.env.TEST_CHAINID;
  var contractAddr = process.env.INSIGNIA_TEST_BASE16;
  if (process.env.NET_TYEP == 'main') {
    net_url = process.env.MAIN_STREAM;
    chain_id = process.env.MAIN_CHAINID;
    contractAddr = process.env.INSIGNIA_MAIN_BASE16;
  }
  contractAddr = contractAddr.replace('0x', '');
  const zilliqa = new Zilliqa(net_url);
  const VERSION = bytes.pack(Number(chain_id), Number(process.env.MSG_VERSION));
  
  const address = getAddressFromPrivateKey(process.env.PRV_KEY);
  zilliqa.wallet.addByPrivateKey(process.env.PRV_KEY);
  zilliqa.wallet.setDefault(address);

  const myGasPrice = units.toQa('2000', units.Units.Li);

  var cand_addr = fromBech32Address(candidate.toString());
  var dist_addr = fromBech32Address(distributor.toString());
  var amount_str = covertDecimal(amount, process.env.DECIMAL, 'toBN');

  try {
    const contract = zilliqa.contracts.at(contractAddr);
    const callTx = await contract.call(
      'WinningVote',
      [
        {
          vname: 'candidate',
          type: 'ByStr20',
          value: cand_addr.toString(),
        },
        {
          vname: 'distributor',
          type: 'ByStr20',
          value: dist_addr.toString(),
        },
        {
          vname: 'template_id',
          type: 'Uint32',
          value: template_id.toString(),
        },
        {
          vname: 'amount',
          type: 'Uint128',
          value: amount_str.toString(),
        }
      ],
      {
        version: VERSION,
        amount: new BN(0),
        gasPrice: myGasPrice,
        gasLimit: Long.fromNumber(25000),
      }
    );
    console.log(callTx.receipt);
    return {
      state: 'ok',
      log : callTx.receipt
    }
  }
  catch (err) {
    console.log(err)
    return {
      state: 'err',
      log : err
    }
  }
}
module.exports.winningVote = winningVote;