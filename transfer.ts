import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { TonClient4, WalletContractV4, internal } from "ton";
import {Address, address} from "@ton/core"
import { mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";
require("dotenv").config()


const main = async (): Promise<void> => {

// copy paste the following snippet into your dapp client code
// to initialize your favorite TON API library and make blockchain queries


// get the decentralized RPC endpoint
const endpoint = await getHttpV4Endpoint();
// initialize ton library
const client4 = new TonClient4({ endpoint });


// Generate new key
// let mnemonics = await mnemonicNew();
// devwallet UQB1tN0c6mdyrGmxAtYYPbGBn8rqiWV52LZ0OgWqbSgiBphp
let mnemonics =  "side,pig,wrestle,second,solar,swallow,fury,swallow,foil,minute,tube,phrase,tumble,slight,nothing,van,smooth,guilt,garage,wonder,business,large,assist,dream".split(",")
let keyPair = await mnemonicToPrivateKey(mnemonics);

// Create wallet contract
let workchain = 0; // Usually you need a workchain 0
let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
let contract = client4.open(wallet);

// Get balance
let balance: bigint = await contract.getBalance();
console.log(`Balance: ${balance}`);

// get seq num
let seqno: number = await contract.getSeqno();
console.log(`seqno: ${seqno}`);

// tranfer
let transfer = await contract.sendTransfer({
  seqno,
  secretKey: keyPair.secretKey,
  messages: [internal({
    value: '0.001',
    to: 'UQDOvT4VeNNUq3ibvviqkIcqyu_75SH_MBSN4VJYqDulhEly',
    body: 'Example transfer body',
  })]
});



// let transfer = await contract.createTransfer({
//   seqno,
//   secretKey: keyPair.secretKey,
//   messages: [internal({
//     value: '0.01',
//     to: 'UQDOvT4VeNNUq3ibvviqkIcqyu_75SH_MBSN4VJYqDulhEly',
//     body: 'Hello world ovi',
//   })]
// });
await sleep(60000)
console.log(`transfer: ${transfer}`)




// // get block by block number
// let block = await client4.getBlock(39053724)
// console.log("block: ", block)
// // console.log("shards: ", block.shards)
// let sampleTxn = block.shards[0]?.transactions[0]  ?? null
// console.log("sample txn: ", sampleTxn)

// //get account info 
// let add = address("UQDOvT4VeNNUq3ibvviqkIcqyu_75SH_MBSN4VJYqDulhEly")
// let currBlk = await client4.getLastBlock();
// console.log("currBlk: ", currBlk);
// let accInfo = await client4.getAccount(currBlk.last.seqno,add)
// console.log("accInfo: ", accInfo)

//get txn info
// let txnInfo = await client4.getAccountTransactionsParsed(address(sampleTxn.account),BigInt(sampleTxn.lt),Buffer.from(sampleTxn.hash))
// console.log("txnInfo: ", txnInfo)


}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main()
//Response



// Other option 
// https://www.orbs.com/ton-access/
// https://docs.ton.org/develop/dapps/apis/sdk