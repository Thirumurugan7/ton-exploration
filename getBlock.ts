import { TonClient, HttpApi, HttpApiParameters } from "@ton/ton";
import axios from 'axios';
import {Address, address} from "@ton/core"
require("dotenv").config()

const params = {
  workchain: -1,
  seq_no: 39048395,
  with_transactions: true
};

const main = async (): Promise<void> => {

// getviaAxios()
getviaSDK()


}

const getviaAxios = async (): Promise<void> =>{

  const baseURL = 'https://anton.tools/api/v0/blocks';

//note block numbers are called sequence numbers in ton


try {
    const response = await axios.get(baseURL, { params });
    console.log(response.data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }

}

const getviaSDK = async (): Promise<void> =>{

// // Create Client
// const client = new TonClient({
//   endpoint: 'https://toncenter.com/api/v2/jsonRPC',
//   // endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
// });
let endpoint = 'https://toncenter.com/api/v2/jsonRPC'

let httpapi = new HttpApi(endpoint)
// console.log(address("UQDOvT4VeNNUq3ibvviqkIcqyu_75SH_MBSN4VJYqDulhEly"));
// let addressInfo = httpapi.getAddressInformation(address("UQDOvT4VeNNUq3ibvviqkIcqyu_75SH_MBSN4VJYqDulhEly"))
// console.log("addressInfo: ", (await addressInfo).balance);
let block = httpapi.getBlockTransactions(params.workchain,params.seq_no, "3")
console.log("block: ", block)
console.log("txn: ", (await block).transactions)

// console.log("block: ", JSON.parse((await (await block).transactions),2,null))

}




main()
//Response
// {
//   total: 1,
//   results: [
//     {
//       workchain: -1,
//       shard: -9223372036854776000,
//       seq_no: 39048395,
//       file_hash: 'ZfmtqgtcBU5ACGjVk8PfnYUqJODJuvH8M7dxnts/ckw=',
//       root_hash: '4N8Aj92UWeU+ouXYeL9n9oLdO3Dao8fyE0f+ujchmMk=',
//       shards: [Array],
//       transactions_count: 3,
//       transactions: [Array],
//       scanned_at: '2024-07-16T07:20:08.489695Z'
//     }
//   ]
// }


// Other option 
// curl -X GET 'https://anton.tools/api/v0/blocks?workchain=-1&with_transactions=true&order=DESC&limit=3'
// https://github.com/tonindexer/anton/blob/main/docs/API.md