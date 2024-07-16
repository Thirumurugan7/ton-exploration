const  { TonClient, WalletContractV4, internal } = require("@ton/ton");
const { mnemonicNew, mnemonicToPrivateKey }  = require( "@ton/crypto");

// Create Client
const client = new TonClient({
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
});

// Generate new key


const func = async ( ) => {
    let mnemonics = await mnemonicNew();

    console.log("mne", mnemonics);

    mnemonics = [ 'seek',
    'decade',
    'midnight',
    'year',
    'zebra',
    'duck',
    'stumble',
    'satoshi',
    'erosion',
    'accuse',
    'desk',
    'share',
    'oxygen',
    'blade',
    'illness',
    'arena',
    'equip',
    'promote',
    'inner',
    'mind',
    'hero',
    'attend',
    'chimney',
    'drift' ]

    console.log("mne", mnemonics);
    
let keyPair = await mnemonicToPrivateKey(mnemonics);

console.log("pair",keyPair);


// Create wallet contract
let workchain = 0; // Usually you need a workchain 0
let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });

console.log("wallet",wallet);

let contract = client.open(wallet);

console.log("contract",contract);


// Get balance
let balance = await contract.getBalance();

console.log("balance",balance);


// Create a transfer
let seqno = await contract.getSeqno();


// let transfer = await contract.createTransfer({
//   seqno,
//   secretKey: keyPair.secretKey,
//   messages: [internal({
//     value: '1.5',
//     to: 'EQB_AmFKfZ3yIKdc7q7rKWV2gUKxTvfzQRwBoqLw98D9BiMp',
//     body: 'Hello world',
//   })]
// });

// console.log("transfer",transfer);

try {
  const tx = await contract.sendTransfer({
    messages:  [internal({
      value: '1',
      to: 'EQB_AmFKfZ3yIKdc7q7rKWV2gUKxTvfzQRwBoqLw98D9BiMp',
      body: 'Hello world',
    })],
    seqno:seqno, secretKey:  keyPair.secretKey,
    
  })
  
  console.log("tx",tx);
} catch (error) {
  console.log("error in transfer", error);
}

}

func()