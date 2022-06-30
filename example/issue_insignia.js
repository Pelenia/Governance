require('dotenv').config()

const {BN, Long, bytes, units} = require('@zilliqa-js/util');
const {Zilliqa} = require('@zilliqa-js/zilliqa');
const { schnorr } = require('@zilliqa-js/crypto');
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
  privkey = process.env.private_key;
  zilliqa.wallet.addByPrivateKey(
      privkey
  );
  const address = getAddressFromPrivateKey(privkey);
  console.log("Your account address is:");
  console.log(`${address}`);

  const pubkey = getPubKeyFromPrivateKey(privkey);

  //Signature Parameters calculation
  const from_addr = process.env.alice
  const sender_template_id = 0;
  const sender_insignia_id = 0;
  const candidate = process.env.alice;
  const template_id = 1;
  const pending_id = 1;

  const sender_template_id_bn = new BN(sender_template_id)
  const sender_insignia_id_bn = new BN(sender_insignia_id)
  const template_id_bn = new BN(template_id)
  const pending_id_bn = new BN(pending_id)
  const uint_sti = Uint8Array.from(sender_template_id_bn.toArrayLike(Buffer, undefined, 4))
  const uint_sii = Uint8Array.from(sender_insignia_id_bn.toArrayLike(Buffer, undefined, 16))
  const uint_ti = Uint8Array.from(template_id_bn.toArrayLike(Buffer, undefined, 4))
  const uint_pi = Uint8Array.from(pending_id_bn.toArrayLike(Buffer, undefined, 16))

  const from_hash = hash.sha256().update(bytes.hexToByteArray(from_addr)).digest('hex')
  const sti_hash = hash.sha256().update(uint_sti).digest('hex')
  const sii_hash = hash.sha256().update(uint_sii).digest('hex')
  const candidate_hash = hash.sha256().update(bytes.hexToByteArray(candidate)).digest('hex')
  const ti_hash = hash.sha256().update(uint_ti).digest('hex')
  const pi_hash = hash.sha256().update(uint_pi).digest('hex')
  // const msg_buf = Buffer.from(from_hash + sti_hash + sii_hash + candidate_hash + ti_hash, 'hex')

  var msg = from_hash + sti_hash + sii_hash + candidate_hash + ti_hash + pi_hash;
  const msg_hash = hash.sha256().update(msg).digest('hex');
  const msg_buf = Buffer.from(msg_hash, 'hex')
  
  const sig = sign(msg_buf, privkey, pubkey);

  const myGasPrice = units.toQa('2000', units.Units.Li); // Gas Price that will be used by all transactions
  const signature2 = schnorr.toSignature(sig)
  const verify = schnorr.verify(
    msg_buf,
    signature2,
    Buffer.from(pubkey, 'hex')
  )

  // 024e4ba0673e38eedcf7c37dc850c670e02e333591668920bbccccebb66963cc5a992b741548ba627b4ecaf06a9e371b79aebaa7ba97d3ff175e9b5bcf137c93
  // 32b4400f84779a4f73f9e7a3c879fe4d2b20af8a750d190f702fdcfa2b77ba7ce9847a859016b497fedd1383d34ac392119d96f3c769213154774de1e3dadf58
  console.log(pubkey)
  console.log(msg_buf)
  console.log(sig)
  console.log(verify)
  const nftAddr = toBech32Address(process.env.insignia);
  try {
    const contract = zilliqa.contracts.at(nftAddr);
    const callTx = await contract.call(
      'IssueInsignia',
      [
        {
          vname: 'pubkey',
          type: 'ByStr33',
          value: `0x${pubkey}`,
        },
        {
          vname: 'sender_template_id',
          type: 'Uint32',
          value: '0',
        },
        {
          vname: 'sender_insignia_id',
          type: 'Uint128',
          value: '0',
        },
        {
          vname: 'candidate',
          type: 'ByStr20',
          value: `0x${process.env.alice}`,
        },
        {
          vname: 'template_id',
          type: 'Uint32',
          value: '1',
        },
        {
          vname: 'pending_id',
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
