import { TonClient, HttpApi, HttpApiParameters } from "@ton/ton";
import axios from 'axios';
import {Address, address} from "@ton/core"
require("dotenv").config()

const baseURL = 'https://anton.tools/api/v0/accounts';
//need to check what nft collection is
const params = {
  latest: true,
  interface: 'nft_collection',
  order: 'DESC',
  after: 36418223000005,
  limit: 1
};

const main = async (): Promise<void> => {

try {
    const response = await axios.get(baseURL, { params });
    console.log(response.data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }

}


main()
//Response
// currBlk:  {
//   last: {
//     seqno: 39050517,
//     shard: '-9223372036854775808',
//     workchain: -1,
//     fileHash: 'BTvDUFal2AlW+CgK8bfyIh2AlkFUyAsoT/rKsqOnLf0=',
//     rootHash: 'u6GdmG8C5DAf5XsrYQHl9HvPLEJsi9WKbzSNehZGwGQ='
//   },
//   init: {
//     fileHash: 'XplPz01CXAps5qeSWUtxcyBfdAo5zVb1N979KLSKD24=',
//     rootHash: 'F6OpKZKqvqeFp6CQmFomXNMfMj2EnaUSOXN+Mh+wVWk='
//   },
//   stateRootHash: 'yPvCo6xAxb3r09lODLPAWvBSP7899aPUqzFSRiaVElM=',
//   now: 1721123806
// }
// accInfo:  {
//   account: {
//     state: { type: 'uninit' },
//     balance: { coins: '13520800000' },
//     last: {
//       lt: '47790386000001',
//       hash: 'J8wp4Wi4SusE/L8UbZjWSRXEGC9mDRZuUhfe1iU1z5k='
//     },
//     storageStat: { lastPaid: 1721123662, duePayment: null, used: [Object] }
//   },
//   block: {
//     workchain: -1,
//     seqno: 39050517,
//     shard: '-9223372036854775808',
//     rootHash: 'u6GdmG8C5DAf5XsrYQHl9HvPLEJsi9WKbzSNehZGwGQ=',
//     fileHash: 'BTvDUFal2AlW+CgK8bfyIh2AlkFUyAsoT/rKsqOnLf0='
//   }
// }

// Other option 
// curl -X GET 'https://anton.tools/api/v0/blocks?workchain=-1&with_transactions=true&order=DESC&limit=3'
// https://github.com/tonindexer/anton/blob/main/docs/API.md