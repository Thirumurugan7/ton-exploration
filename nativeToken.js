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
    // Validate recipient address
    try {
      recipientAddress = new TonWeb.utils.Address(recipientAddress);
    } catch (error) {
      console.error("Invalid recipient address:", recipientAddress);
      return;
    }

    // Generate new key
    let mnemonics = await mnemonicNew();
    console.log("Generated mnemonics:", mnemonics);
    // Replace with your mnemonics if needed
    mnemonics = [
      'note',
      'trial',
      'donor',
      'decrease',
      'maze',
      'coral',
      'banner',
      'doll',
      'promote',
      'poet',
      'naive',
      'earn',
      'tank',
      'pass',
      'gap',
      'outer',
      'man',
      'faint',
      'option',
      'best',
      'neutral',
      'sausage',
      'marine',
      'issue'

    ]

    // Generating keypair from mnemonics
    let keyPair = await mnemonicToPrivateKey(mnemonics);
    console.log("Generated key pair:", keyPair);

    // Create wallet contract
    let workchain = 0; // Usually you need workchain 0
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

    // // Get transaction history
    // let transactions = await retryWithBackoff(() =>
    //   client.getTransactions(walletAddress, 1)
    // );
    // // console.log("Transaction History:", transactions);

    // // Prepare the transfer message
    // let transferMessage = internal({
    //   value: TonWeb.utils.toNano("0.01"), // Amount in TON
    //   to: "UQDOvT4VeNNUq3ibvviqkIcqyu_75SH_MBSN4VJYqDulhEly",
    //   body: "Hello world", // Message body
    // });

    // // Estimate fees
    // let feeEstimation = await retryWithBackoff(() =>
    //   client.estimateExternalMessageFee(wallet.address, transferMessage)
    // );
    // console.log("Estimated Fees:", feeEstimation);

    // // Create transfer
    // let transfer = await wallet.createTransfer({
    //   seqno,
    //   secretKey: keyPair.secretKey,
    //   messages: [transferMessage],
    // });
    // console.log("Created transfer:", transfer);

    // // Send transfer
    // const tx = await client.sendExternalMessage(wallet, transfer);

    // Fetch the latest transaction again to get its hash using TonWeb
    await client
      .getTransactions(walletAddress, 1)
      .then(async (resp) => {
        // console.log("Transaction response:", resp);
        console.log("Transaction response:", resp[0]);
        console.log("Transaction info in msg:", resp[0]?.inMessage?.info);
        //code to extract the comment from in message
        const inMessage = resp[0].inMessage;
        if (inMessage && inMessage.body) {
          const bodyHex = inMessage.body;
          console.log("Type of bodyHex:", typeof bodyHex);
          console.log("Body content:", bodyHex);

          if (typeof bodyHex === "object" && bodyHex.toString) {
            // Convert object to string
            const hexString = bodyHex.toString();
            console.log("Converted hexString:", hexString);

            // Remove the 'x{' prefix and '}' suffix if they exist
            const trimmedHexString = hexString.startsWith("x{")
              ? hexString.slice(2, -1)
              : hexString;
            const bodyBuffer = Buffer.from(trimmedHexString, "hex");
            const decodedBody = bodyBuffer.toString("utf-8");
            console.log("Decoded Body:", decodedBody);
          } else {
            console.log("Body is not a string and cannot be converted.");
          }
        } else {
          console.log("No inMessage body available.");
        }
        // console.log("Transaction out:", resp[0]?.outMessages?.);

        console.log("trying out message ======")
        console.log("Transaction info out:", resp[0]?.outMessages)
        // console.log("Transaction info out :", resp[0]?.outMessages[0])
        //extracting details from out message
        const outMessages = resp[0].outMessages;

        // Ensure outMessages map is not empty
        if (outMessages._map.size > 0) {
          // Iterate through the _map entries
          for (const [key, value] of outMessages._map) {
            console.log(`Key: ${ key }, Value info: `,value.info)

            if (value.body) {
              const bodyHex = value.body;
              console.log("Body content:", bodyHex);

              // Convert the hex string to a buffer and decode it
              const hexString = bodyHex.toString().slice(2, -1); // Remove 'x{' and '}'
              const bodyBuffer = Buffer.from(hexString, "hex");
              const decodedBody = bodyBuffer.toString("utf-8");
              console.log("Decoded Body:", decodedBody);
            } else {
              console.log("No body in the value.");
            }
          }
        } else {
          console.log("No outMessages available.");
        }

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
          await getTransactionDetails(walletAddress);
        }
      })
      .catch((error) => {
        console.log("Error fetching transaction from TonWeb:", error);
      });

    process.exit()

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
    const tonTransferTx = await transferTON(
      recipientAddress.toString(true, true, true),
      "0.01",
      keyPair,
      wallet,
      walletAddress
    );
    // Call additional functions
    const jettonTransferTx = await transferJetton(
      recipientAddress.toString(true, true, true),
      "0.01",
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

const getTransactionDetails = async (accountAddress) => {
  try {
    const transaction = await client.getTransactions(accountAddress, 1);
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
    const lm = "EQB_AmFKfZ3yIKdc7q7rKWV2gUKxTvfzQRwBoqLw98D9BiMp";

    const jettonAmount = TonWeb.utils.toNano(amount); // Convert amount to Nano
    const forwardAmount = TonWeb.utils.toNano("0.01"); // Convert forward amount to Nano

    // Check if amounts are properly converted
    if (isNaN(jettonAmount) || isNaN(forwardAmount)) {
      throw new Error("Converted amount is NaN");
    }

    const payload = await jettonWallet.createTransferBody({
      jettonAmount, // Jetton amount (in basic indivisible units)
      toAddress: lm, // recipient user's wallet address (not Jetton wallet)
      forwardAmount, // some amount of TONs to invoke Transfer notification message
      forwardPayload: comment, // text comment for Transfer notification message
      responseAddress: new TonWeb.utils.Address(walletAddress), // return the TONs after deducting commissions back to the sender's wallet address
    });

    const seqno = await client.open(wallet).getSeqno();

    const transfer = await wallet.createTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        internal({
          value: TonWeb.utils.toNano("0.01"),
          to: new TonWeb.utils.Address(lm),
          payload: payload,
          sendMode: 3,
        }),
      ],
    });

    // Send transfer
    const tx = await client.sendExternalMessage(wallet, transfer);
    console.log("Jetton Transfer Transaction:", tx);
    client.getTransaction(tx).then((transaction) => {
      console.log("Transaction:", transaction);
    });

    // Fetch the latest transaction again to get its hash using TonWeb
    await client.getTransactions(walletAddress, 1).then(async (resp) => {
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
        await getTransactionDetails(walletAddress);
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
      to: "UQDOvT4VeNNUq3ibvviqkIcqyu_75SH_MBSN4VJYqDulhEly", // Recipient address
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
    await client.getTransactions(walletAddress, 1).then(async (resp) => {
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
        await getTransactionDetails(walletAddress);
      }
    });

    return tx;
  } catch (error) {
    console.error("Error in TON transfer:", error);
  }
};

// Provide the account address dynamically
func("UQDOvT4VeNNUq3ibvviqkIcqyu_75SH_MBSN4VJYqDulhEly");
