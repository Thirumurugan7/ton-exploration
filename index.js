const  { TonClient, WalletContractV4, internal } = require("@ton/ton");
const { mnemonicNew, mnemonicToPrivateKey }  = require( "@ton/crypto");

// Create Client
const client = new TonClient({
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
});

// Generate new key


const func = async ( ) => {

  // mnemonic generated
    let mnemonics = await mnemonicNew();

    console.log("mne", mnemonics);

    // replaced with my mnemonics from TON Keeper app
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
    
    // generating keypair from mnemonics
let keyPair = await mnemonicToPrivateKey(mnemonics);

//logging the keypair
console.log("pair",keyPair);


// Create wallet contract
let workchain = 0; // Usually you need a workchain 0

// creating a wallet instance
let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });

console.log("wallet",wallet);


// all the address are considered as contracts, so we need a contract instance to interact with any accounts
let contract = client.open(wallet);

// logging the contract instance
console.log("contract",contract);


// Get balance
let balance = await contract.getBalance();

//logging the balance
console.log("balance",balance);


// Get Wallet Seqno
let seqno = await contract.getSeqno();

// logging the seqno
console.log("seqno", seqno);

let transfer = await contract.createTransfer({
  seqno,
  secretKey: keyPair.secretKey,
  messages: [internal({
    value: '1.5',
    to: 'EQB_AmFKfZ3yIKdc7q7rKWV2gUKxTvfzQRwBoqLw98D9BiMp',
    body: 'Hello world',
  })]
});



console.log("transfer",transfer);

let sendd = await contract.sender(keyPair.secretKey)
console.log("sendd", sendd);


// sendd.send({    value: '0.5',
// to: 'EQB_AmFKfZ3yIKdc7q7rKWV2gUKxTvfzQRwBoqLw98D9BiMp',

// })

try {
  // const tx = await contract.sendTransfer({
  //   messages:  [internal({
  //     value: '1',
  //     to: 'EQB_AmFKfZ3yIKdc7q7rKWV2gUKxTvfzQRwBoqLw98D9BiMp',
  //     body: 'Hello world',
  //   })],
  //   seqno:seqno, secretKey:  keyPair.secretKey,
    
  // })
  
  // console.log("tx",tx);
} catch (error) {
  // console.log("error in transfer", error);
}

}

func()