require("dotenv").config();
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { getAddressFromPrivateKey, fromBech32Address, toBech32Address } = require('@zilliqa-js/crypto')
const cron = require('node-cron');

const { covertDecimal } = require('./../contract');
const { pelebalance } = require('./../models')

const updatePelebalance = async () => {
  var net_url = process.env.TEST_STREAM;
  var contractAddr = process.env.PELE_TEST_BASE16;
  if (process.env.NET_TYEP == 'main') {
    net_url = process.env.MAIN_STREAM;
    contractAddr = process.env.PELE_MAIN_BASE16;
  }
  const zilliqa = new Zilliqa(net_url);
  const contract = zilliqa.contracts.at(contractAddr);

  const state = await contract.getState();

  for (var x in state.balances) {
    var bech32 = toBech32Address(x);
    var balance = covertDecimal(state.balances[x], process.env.DECIMAL, 'toNum');
    var tmp = await pelebalance.findOne({bech32:bech32});
    if (tmp == null) {
      tmp = new pelebalance({
        bech32: bech32,
        balance: balance
      })
    }
    else {
      tmp.balance = balance;
    }
    await tmp.save();
  }
}

const runMaintainPeleBalance = () => {
  cron.schedule("*/10 * * * * *", function() {
    try {
      updatePelebalance();
    } catch (error) {
      console.log(error);
    }
  });
}

module.exports.runMaintainPeleBalance = runMaintainPeleBalance
