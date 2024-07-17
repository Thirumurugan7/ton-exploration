import { TonClient, WalletContractV4, internal } from "@ton/ton";
import { mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";
require("dotenv").config()
// Create Client
const client = new TonClient({
//   endpoint: 'https://toncenter.com/api/v2/jsonRPC',
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
});

const main = async (): Promise<void> => {

// Generate new key
// let mnemonics = await mnemonicNew();
let mnemonics = [
  'bullet',  'legal',   'silent',
  'crunch',  'grief',   'exact',
  'digital', 'error',   'real',
  'relief',  'quote',   'turn',
  'typical', 'undo',    'month',
  'gather',  'thunder', 'mimic',
  'marble',  'soldier', 'wedding',
  'fresh',   'seminar', 'rally'
]
let keyPair = await mnemonicToPrivateKey(mnemonics);

console.log("mnemonics: ",mnemonics);
console.log("keyPair: ",keyPair);

// Create wallet contract
let workchain = 0; // Usually you need a workchain 0
let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
let contract = client.open(wallet);

// Get balance
let balance: bigint = await contract.getBalance();
console.log("balance: ",balance);


// Create a transfer
let seqno: number = await contract.getSeqno();
console.log("seqno: ",seqno);

let transfer = await contract.createTransfer({
  seqno,
  secretKey: keyPair.secretKey,
  messages: [internal({
    value: '0.001',
    to: 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N',
    body: 'Hello world',
  })]
});
await sleep(40000)
console.log("transfer: ",transfer);

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main()