import { TonClient, HttpApi, HttpApiParameters } from "@ton/ton";
import axios from 'axios';
import {Address, address} from "@ton/core"
require("dotenv").config()

const baseURL = 'https://anton.tools/api/v0/transactions';

const params = {
  address: 'UQDOvT4VeNNUq3ibvviqkIcqyu_75SH_MBSN4VJYqDulhEly',
  workchain: 0,
  order: 'DESC',
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

// Other option 
// curl -X GET 'https://anton.tools/api/v0/blocks?workchain=-1&with_transactions=true&order=DESC&limit=3'
// https://github.com/tonindexer/anton/blob/main/docs/API.md