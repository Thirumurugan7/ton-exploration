import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { TonClient4 } from "ton";
import {Address, address} from "@ton/core"
require("dotenv").config()


const main = async (): Promise<void> => {

// copy paste the following snippet into your dapp client code
// to initialize your favorite TON API library and make blockchain queries


// get the decentralized RPC endpoint
const endpoint = await getHttpV4Endpoint();

// initialize ton library
const client4 = new TonClient4({ endpoint });

// get block by block number
let block = await client4.getBlock(39053724)
console.log("block: ", block)
// console.log("shards: ", block.shards)
let sampleTxn = block.shards[0]?.transactions[0]  ?? null
console.log("sample txn: ", sampleTxn)

// //get account info 
// let add = address("UQDOvT4VeNNUq3ibvviqkIcqyu_75SH_MBSN4VJYqDulhEly")
// let currBlk = await client4.getLastBlock();
// console.log("currBlk: ", currBlk);
// let accInfo = await client4.getAccount(currBlk.last.seqno,add)
// console.log("accInfo: ", accInfo)

//get txn info
// let txnInfo = await client4.getAccountTransactionsParsed(address(sampleTxn.account),BigInt(sampleTxn.lt),Buffer.from(sampleTxn.hash))
// console.log("txnInfo: ", txnInfo)




// //get account info 
// let add = address("UQDOvT4VeNNUq3ibvviqkIcqyu_75SH_MBSN4VJYqDulhEly")
// let currBlk = await client4.getLastBlock();
// console.log("currBlk: ", currBlk);
// let accInfo = await client4.getAccount(currBlk.last.seqno,add)
// console.log("accInfo: ", accInfo)




}




main()
//Response



// Other option 
// https://www.orbs.com/ton-access/
// https://docs.ton.org/develop/dapps/apis/sdk