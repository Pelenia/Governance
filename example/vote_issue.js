require('dotenv').config()

const {BN, Long, bytes, units} = require('@zilliqa-js/util');
const {Zilliqa} = require('@zilliqa-js/zilliqa');
const {
  toBech32Address,
  getAddressFromPrivateKey,
  getPubKeyFromPrivateKey,
  sign
} = require('@zilliqa-js/crypto');
var hash = require('hash.js')


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

  const pubkey = getPubKeyFromPrivateKey(privkey);

  //Signature Parameters calculation
  const from_addr = process.env.bob
  const sender_template_id = 1;
  const sender_insignia_id = 1;
  const candidate = process.env.bob;
  const template_id = 1;

  const sender_template_id_bn = new BN(sender_template_id)
  const sender_insignia_id_bn = new BN(sender_insignia_id)
  const template_id_bn = new BN(template_id)
  const uint_sti = Uint8Array.from(sender_template_id_bn.toArrayLike(Buffer, undefined, 4))
  const uint_sii = Uint8Array.from(sender_insignia_id_bn.toArrayLike(Buffer, undefined, 16))
  const uint_ti = Uint8Array.from(template_id_bn.toArrayLike(Buffer, undefined, 4))

  const from_hash = hash.sha256().update(bytes.hexToByteArray(from_addr)).digest('hex')
  const sti_hash = hash.sha256().update(uint_sti).digest('hex')
  const sii_hash = hash.sha256().update(uint_sii).digest('hex')
  const candidate_hash = hash.sha256().update(bytes.hexToByteArray(candidate)).digest('hex')
  const ti_hash = hash.sha256().update(uint_ti).digest('hex')
  const msg_buf = Buffer.from(from_hash + sti_hash + sii_hash + candidate_hash + ti_hash, 'hex')
  
  const sig = sign(msg_buf, privkey, pubkey);

  const myGasPrice = units.toQa('2000', units.Units.Li); // Gas Price that will be used by all transactions

  const nftAddr = toBech32Address(process.env.insignia);
  try {
    const contract = zilliqa.contracts.at(nftAddr);
    const callTx = await contract.call(
      // 'VoteIssue',
      'AgainstIssue',
      [
        {
          vname: 'pubkey',
          type: 'ByStr33',
          value: `0x${pubkey}`,
        },
        {
          vname: 'sender_template_id',
          type: 'Uint32',
          value: '1',
        },
        {
          vname: 'sender_insignia_id',
          type: 'Uint128',
          value: '1',
        },
        {
          vname: 'candidate',
          type: 'ByStr20',
          value: `0x${process.env.bob}`,
        },
        {
          vname: 'template_id',
          type: 'Uint32',
          value: '1',
        },
        {
          vname: 'signature',
          type: 'ByStr64',
          value: `0x${sig}`,
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
