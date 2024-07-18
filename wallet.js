const { TonClient, WalletContractV4, internal } = require("@ton/ton");
const TonWeb = require("tonweb");
const {
  mnemonicNew,
  mnemonicToPrivateKey,
  sign,
  signVerify,
} = require("@ton/crypto");

const tonCenterPoint = "https://toncenter.com";
const tonApiKey =
  "4228a35e740e0041639fdbc8dd46edc38c817b3a3bc3938ff2f8f13fa38afa33";

const client = new TonClient({
  endpoint: `${tonCenterPoint}/api/v2/jsonRPC`,
  apiKey: tonApiKey,
  timeout: 60000,
});

const tonweb = new TonWeb(
  new TonWeb.HttpProvider(`${tonCenterPoint}/api/v2/jsonRPC`, {
    apiKey: tonApiKey,
  })
);

const func = async (recipientAddress) => {
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
      tonweb.getTransactions(walletAddress, 1)
    );
    console.log("Transaction History:", transactions);

    // Prepare the transfer message
    let transferMessage = internal({
      value: "1.5", // Amount in TON
      to: recipientAddress, // Re/ Recipient address
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

    // Send transfer
    const tx = await client.sendExternalMessage(wallet, transfer);

    // Fetch the latest transaction again to get its hash using TonWeb
    await tonweb
      .getTransactions(walletAddress, 1)
      .then(async (resp) => {
        console.log("Transaction response:", resp);
        if (resp && resp.length > 0 && resp[0].transaction_id) {
          const transactionDetails = resp[0];
          const hash = transactionDetails.transaction_id.hash;
          console.log("Transaction Hash from TonWeb:", hash);

          // Provide the explorer link based on the hash from TonWeb
          const explorerLink = tonCenterPoint.includes("testnet")
            ? `https://testnet.tonscan.org/tx/${hash}`
            : `https://tonscan.org/tx/${hash}`;
          console.log("Explorer Link from TonWeb:", explorerLink);

          // Call getTransactionDetails with the correct hash
          await getTransactionDetails(walletAddress, hash);
        }
      })
      .catch((error) => {
        console.log("Error fetching transaction from TonWeb:", error);
      });

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

    // Call additional functions
    const jettonTransferTx = await transferJetton(
      recipientAddress,
      "10.0",
      keyPair,
      wallet,
      walletAddress
    );

    const tonTransferTx = await transferTON(
      recipientAddress,
      "1.0",
      keyPair,
      wallet,
      walletAddress
    );
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

const getTransactionDetails = async (accountAddress, hash) => {
  try {
    const transaction = await tonweb.getTransactions(accountAddress, 1);
    console.log("Transaction Details:", transaction);

    const tx = transaction[0];
    const payload = tx.data;
    const amount = tx.in_msg.value;
    const to = tx.in_msg.destination;
    const from = tx.in_msg.source;
    const value = tx.in_msg.value;
    const fees = tx.in_msg.fwd_fee;
    const createdAt = tx.in_msg.created_at;
    const lt = tx.in_msg.created_lt;
    const comment = tx.in_msg.message;
    const decodedComment = Buffer.from(comment, "base64").toString("utf-8");

    console.log("Payload:", payload);
    console.log("Amount:", amount);
    console.log("To:", to);
    console.log("From:", from);
    console.log("Value:", value);
    console.log("Fees:", fees);

    return {
      payload,
      amount,
      to,
      from,
      value,
      fees,
      createdAt,
      lt,
      decodedComment,
    };
  } catch (error) {
    console.error("Error fetching transaction details:", error);
  }
};

const transferJetton = async (
  toAddress,
  amount,
  keyPair,
  wallet,
  walletAddress
) => {
  try {
    const jettonWallet = new TonWeb.token.jetton.JettonWallet(tonweb.provider, {
      address: walletAddress,
    });

    const comment = new Uint8Array([
      ...new Uint8Array(4),
      ...new TextEncoder().encode("text comment"),
    ]);

    const payload = await jettonWallet.createTransferBody({
      jettonAmount: TonWeb.utils.toNano(amount), // Jetton amount (in basic indivisible units)
      toAddress: new TonWeb.utils.Address(toAddress), // recipient user's wallet address (not Jetton wallet)
      forwardAmount: TonWeb.utils.toNano("0.01"), // some amount of TONs to invoke Transfer notification message
      forwardPayload: comment, // text comment for Transfer notification message
      responseAddress: walletAddress, // return the TONs after deducting commissions back to the sender's wallet address
    });

    const seqno = await client.open(wallet).getSeqno();

    const transfer = await wallet.createTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        internal({
          value: TonWeb.utils.toNano("0.05"),
          to: walletAddress,
          payload: payload,
          sendMode: 3,
        }),
      ],
    });

    // Send transfer
    const tx = await client.sendExternalMessage(wallet, transfer);

    // Fetch the latest transaction again to get its hash using TonWeb
    await tonweb.getTransactions(walletAddress, 1).then(async (resp) => {
      console.log("Transaction response:", resp);
      if (resp && resp.length > 0 && resp[0].transaction_id) {
        const transactionDetails = resp[0];
        const hash = transactionDetails.transaction_id.hash;
        console.log("Jetton Transfer Transaction:", hash);

        // Provide the explorer link based on the hash from TonWeb
        const explorerLink = tonCenterPoint.includes("testnet")
          ? `https://testnet.tonscan.org/tx/${hash}`
          : `https://tonscan.org/tx/${hash}`;
        console.log("Explorer Link from TonWeb:", explorerLink);

        // Call getTransactionDetails with the correct hash
        await getTransactionDetails(walletAddress, hash);
      }
    });

    return tx;
  } catch (error) {
    console.error("Error in Jetton transfer:", error);
  }
};

const transferTON = async (
  toAddress,
  amount,
  keyPair,
  wallet,
  walletAddress
) => {
  try {
    const tonTransferMessage = internal({
      value: TonWeb.utils.toNano(amount), // Amount in TON
      to: toAddress,
      body: "TON Transfer",
    });

    // Get Wallet Seqno
    let contract = client.open(wallet);
    let seqno = await contract.getSeqno();

    // Create transfer
    let transfer = await wallet.createTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [tonTransferMessage],
    });

    // Send transfer
    const tx = await client.sendExternalMessage(wallet, transfer);

    // Fetch the latest transaction again to get its hash using TonWeb
    await tonweb.getTransactions(walletAddress, 1).then(async (resp) => {
      console.log("Transaction response:", resp);
      if (resp && resp.length > 0 && resp[0].transaction_id) {
        const transactionDetails = resp[0];
        const hash = transactionDetails.transaction_id.hash;
        console.log("TON Transfer Transaction:", hash);

        // Provide the explorer link based on the hash from TonWeb
        const explorerLink = tonCenterPoint.includes("testnet")
          ? `https://testnet.tonscan.org/tx/${hash}`
          : `https://tonscan.org/tx/${hash}`;
        console.log("Explorer Link from TonWeb:", explorerLink);

        // Call getTransactionDetails with the correct hash
        await getTransactionDetails(walletAddress, hash);
      }
    });

    return tx;
  } catch (error) {
    console.error("Error in TON transfer:", error);
  }
};

// Provide the account address dynamically
func("UQDOvT4VeNNUq3ibvviqkIcqyu_75SH_MBSN4VJYqDulhEly");
