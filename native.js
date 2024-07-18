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
    mnemonics = [
      "note",
      "trial",
      "donor",
      "decrease",
      "maze",
      "coral",
      "banner",
      "doll",
      "promote",
      "poet",
      "naive",
      "earn",
      "tank",
      "pass",
      "gap",
      "outer",
      "man",
      "faint",
      "option",
      "best",
      "neutral",
      "sausage",
      "marine",
      "issue",
    ];

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

    // Get transaction history
    let transactions = await retryWithBackoff(() =>
      client.getTransactions(walletAddress, 1)
    );
    console.log("Transaction History:", transactions);

    // Prepare the transfer message
    let transferMessage = internal({
      value: TonWeb.utils.toNano("0.01"), // Amount in TON
      to: recipientAddress.toString(true, true, true),
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
    await client.getTransactions(walletAddress, 1).then(async (resp) => {
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
      const outMessages = resp[0].outMessages;

      // Ensure outMessages map is not empty
      if (outMessages._map.size > 0) {
        // Iterate through the _map entries
        for (const [key, value] of outMessages._map) {
          console.log(`Key: ${key}, Value:`, value);

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
      }
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
    const tonTransferTx = await transferTON(
      recipientAddress.toString(true, true, true),
      "0.01",
      keyPair,
      wallet,
      walletAddress
    );

    // Fetch the latest transaction hash again to get its hash using TonWeb
    await retryWithBackoff(() =>
      client.getTransactions(walletAddress, 1).then(async (resp) => {
        if (resp && resp.length > 0 && resp[0].transaction_id) {
          const transactionDetails = resp[0];
          const hash = transactionDetails.transaction_id.hash;
          console.log("Jetton Transfer Transaction:", hash);

          // Provide the explorer link based on the hash from TonWeb
          const explorerLink = tonCenterPoint.includes("testnet")
            ? `https://testnet.tonscan.org/tx/${hash}`
            : `https://tonscan.org/tx/${hash}`;
          console.log("Explorer Link from TonWeb:", explorerLink);
          return { explorerLink };
        }
      })
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
      to: toAddress, // Recipient address
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
      if (resp && resp.length > 0 && resp[0].transaction_id) {
        const transactionDetails = resp[0];
        const hash = transactionDetails.transaction_id.hash;
        console.log("TON Transfer Transaction:", hash);

        // Provide the explorer link based on the hash from TonWeb
        const explorerLink = tonCenterPoint.includes("testnet")
          ? `https://testnet.tonscan.org/tx/${hash}`
          : `https://tonscan.org/tx/${hash}`;
        console.log("Explorer Link from TonWeb:", explorerLink);
      }
    });

    return tx;
  } catch (error) {
    console.error("Error in TON transfer:", error);
  }
};

// Provide the account address dynamically
func("UQDOvT4VeNNUq3ibvviqkIcqyu_75SH_MBSN4VJYqDulhEly");
