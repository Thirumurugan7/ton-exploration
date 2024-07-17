const { TonClient, WalletContractV4, internal } = require("@ton/ton");
const TonWeb = require("tonweb");

const {
  mnemonicNew,
  mnemonicToPrivateKey,
  sign,
  signVerify,
} = require("@ton/crypto");

const tonCenterPoint = "https://testnet.toncenter.com";
const tonApiKey =
  "4228a35e740e0041639fdbc8dd46edc38c817b3a3bc3938ff2f8f13fa38afa33";

const client = new TonClient({
  endpoint: `${tonCenterPoint}/api/v2/jsonRPC`,
  apiKey: tonApiKey,
  timeout: 60000, // Set a longer timeout to handle retries
});

const tonweb = new TonWeb(
  new TonWeb.HttpProvider(`${tonCenterPoint}/api/v2/jsonRPC`, {
    apiKey: tonApiKey,
  })
);

const func = async () => {
  try {
    // Generate new key
    let mnemonics = await mnemonicNew();
    console.log("Generated mnemonics:", mnemonics);

    // Replace with your mnemonics if needed
    mnemonics = [
      "seek",
      "decade",
      "midnight",
      "year",
      "zebra",
      "duck",
      "stumble",
      "satoshi",
      "erosion",
      "accuse",
      "desk",
      "share",
      "oxygen",
      "blade",
      "illness",
      "arena",
      "equip",
      "promote",
      "inner",
      "mind",
      "hero",
      "attend",
      "chimney",
      "drift",
    ];

    // Generating keypair from mnemonics
    let keyPair = await mnemonicToPrivateKey(mnemonics);
    console.log("Generated key pair:", keyPair);

    // Create wallet contract
    let workchain = 0; // Usually you need workchain 0

    // Creating a wallet instance
    let wallet = WalletContractV4.create({
      workchain,
      publicKey: keyPair.publicKey,
    });
    console.log("Created wallet:", wallet);

    // Get wallet address
    const walletAddress = wallet.address.toString(true, true, true);
    console.log("Wallet Address:", walletAddress);

    // Get balance
    let balance = await retryWithBackoff(() =>
      client.getBalance(wallet.address)
    );
    console.log("Wallet balance:", balance);

    // Get Wallet Seqno
    let contract = client.open(wallet);
    let seqno = await contract.getSeqno();
    console.log("Wallet Seqno:", seqno);

    // Get basic address information
    let addressInfo = await retryWithBackoff(() =>
      client.getContractState(wallet.address)
    );
    console.log("Address Information:", addressInfo);

    // Get transaction history
    let transactions = await retryWithBackoff(() =>
      client.getTransactions(wallet.address, { limit: 10 })
    );
    console.log("Transaction History:", transactions);

    // Prepare the transfer message
    let transferMessage = internal({
      value: "1.5", // Amount in TON
      to: "EQB_AmFKfZ3yIKdc7q7rKWV2gUKxTvfzQRwBoqLw98D9BiMp", // Recipient address
      body: "Hello world", // Message body
    });

    // Estimate fees
    let feeEstimation = await retryWithBackoff(() =>
      client.estimateExternalMessageFee(wallet.address, transferMessage)
    );
    console.log("Estimated Fees:", feeEstimation);

    // Create transfer
    let transfer = await wallet.createTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [transferMessage],
    });
    console.log("Created transfer:", transfer);

    // Offline signing (Sign the transfer message)
    const boc = Buffer.from(transfer.toBoc().toString("hex"), "hex");
    const signedMessage = sign(boc, keyPair.secretKey);
    console.log("Signed Message:", signedMessage);

    // Determine if the network is testnet or mainnet
    const isTestnet = tonCenterPoint.includes("testnet");

    // Send transfer
    try {
      const tx = await client.sendExternalMessage(wallet, transfer);
      // Fetch the latest transaction again to get its hash using TonWeb
      tonweb
        .getTransactions(walletAddress, 1)
        .then((resp) => {
          console.log("Transaction response:", resp);
          if (resp && resp.length > 0 && resp[0].transaction_id) {
            const transactionDetails = resp[0];
            const hash = transactionDetails.transaction_id.hash;
            console.log("Transaction Hash from TonWeb:", hash);

            // Provide the explorer link based on the hash from TonWeb
            const explorerLink = isTestnet
              ? `https://testnet.tonscan.org/tx/${hash}`
              : `https://tonscan.org/tx/${hash}`;
            console.log("Explorer Link from TonWeb:", explorerLink);
          }
        })
        .catch((error) => {
          console.log("Error fetching transaction from TonWeb:", error);
        });
    } catch (error) {
      console.log("Error in transfer:", error);
    }

    // Check if the contract is deployed
    const contractState = await client.isContractDeployed(wallet.address);
    console.log("Contract Deployed:", contractState);

    // Signing and verifying a custom message
    const message = "Hello, This is Vm.";
    const messageBuffer = Buffer.from(message);

    // Sign the message
    const signature = sign(messageBuffer, keyPair.secretKey);
    console.log("Signature:", signature);

    // Verify the signature
    const isValid = signVerify(messageBuffer, signature, keyPair.publicKey);
    console.log("Is the signature valid?", isValid);

    // To sign a random hash value
    const randomHash = Buffer.from("hello-vm");
    const hashSignature = sign(randomHash, keyPair.secretKey);
    console.log("Hash Signature:", hashSignature);

    // Verify the hash signature
    const isHashValid = signVerify(
      randomHash,
      hashSignature,
      keyPair.publicKey
    );
    console.log("Is the hash signature valid?", isHashValid);

    // Fetch the latest transaction again to get its hash
    transactions = await retryWithBackoff(() =>
      client.getTransactions(wallet.address, { limit: 1 })
    );
    if (transactions && transactions.length > 0) {
      const latestTx = transactions[0];
      const hash = Buffer.from(latestTx.hash(), "base64").toString("hex");
      console.log("Latest Transaction Hash:", hash);
    }
  } catch (error) {
    console.log("An error occurred:", error);
  }
};

const retryWithBackoff = async (fn, retries = 5, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    console.log(`Retrying in ${delay} ms due to error:`, error.message);
    await new Promise((r) => setTimeout(r, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

func();
