require('dotenv').config()

const {BN, Long, bytes, units} = require('@zilliqa-js/util');
const {Zilliqa} = require('@zilliqa-js/zilliqa');
const {
  toBech32Address,
  getAddressFromPrivateKey,
} = require('@zilliqa-js/crypto');


async function main() {
  const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');
  const CHAIN_ID = 333;
  const MSG_VERSION = 1;
  const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);
  privkey = process.env.private_key_bob;
  zilliqa.wallet.addByPrivateKey(
      privkey
  );
  const address = getAddressFromPrivateKey(privkey);
  console.log("Your account address is:");
  console.log(`${address}`);

  const myGasPrice = units.toQa('2000', units.Units.Li); // Gas Price that will be used by all transactions

  const nftAddr = toBech32Address(process.env.insignia);
  try {
    const contract = zilliqa.contracts.at(nftAddr);
    const callTx = await contract.call(
      'SetTreasuryAddress',
      [
        {
          vname: 'wallet_address',
          type: 'ByStr20',
          value: `0x${process.env.zrc4}`,
        }
      ],
      {
        // amount, gasPrice and gasLimit must be explicitly provided
        version: VERSION,
        amount: new BN(0),
        gasPrice: myGasPrice,
        gasLimit: Long.fromNumber(25000),
      }
    );

    // process confirm
    console.log(`The transaction id is:`, callTx.id);
    console.log(JSON.stringify(callTx.receipt));

  } catch (err) {
    console.log(err);
  }
}

main();
