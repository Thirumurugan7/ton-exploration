const {
  TonClient,
  WalletContractV4,
  internal,
  beginCell,
  Cell,
} = require("@ton/ton");
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

const formatBalance = (balance) => (Number(balance) / 1e9).toFixed(2);

const func = async (recipientAddress) => {
  try {
    // Validate recipient address
    try {
      recipientAddress = new TonWeb.utils.Address(recipientAddress);
    } catch (error) {
      console.error("Invalid recipient address:", recipientAddress);
      return;
    }

    let mnemonics = [
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

    // Generate keypair from mnemonics
    let keyPair = await mnemonicToPrivateKey(mnemonics);
    console.log("Generated key pair:", keyPair);

    // Create wallet contract
    let workchain = 0; // Usually you need workchain 0
    let wallet = WalletContractV4.create({
      workchain,
      publicKey: keyPair.publicKey,
    });
    console.log("Created wallet:", wallet);

    // Get sender wallet address
    const senderAddress = wallet.address.toString(true, true, true);
    console.log("Sender Wallet Address:", senderAddress);

    // Get sender balance before transfer
    let senderBalanceBefore = await retryWithBackoff(() =>
      client.getBalance(wallet.address)
    );
    console.log(
      "Sender TON Balance Before:",
      formatBalance(senderBalanceBefore),
      "TON"
    );

    // Get sender seqno
    let contract = client.open(wallet);
    let senderSeqno = await contract.getSeqno();
    console.log("Sender Seq No:", senderSeqno);

    // Get sender account information
    let senderAccountInfo = await retryWithBackoff(() =>
      client.getContractState(wallet.address)
    );
    console.log("Sender Account Info:", senderAccountInfo);

    // Get receiver balance before transfer
    let receiverBalanceBefore = await retryWithBackoff(() =>
      client.getBalance(recipientAddress)
    );
    console.log(
      "Receiver TON Balance Before:",
      formatBalance(receiverBalanceBefore),
      "TON"
    );

    // Get receiver account information
    let receiverAccountInfo = await retryWithBackoff(() =>
      client.getContractState(recipientAddress)
    );
    console.log("Receiver Account Info:", receiverAccountInfo);

    // Prepare the transfer message
    let transferMessage = internal({
      value: TonWeb.utils.toNano("0.1"), // Amount in TON
      to: recipientAddress.toString(true, true, true),
      body: "TON Transfer", // Message body
    });
    console.log("Transfer Message:", transferMessage);

    // Estimate fees
    let estimatedFee = await retryWithBackoff(() =>
      client.estimateExternalMessageFee(wallet.address, transferMessage)
    );
    console.log("Estimated Fee:", estimatedFee);

    // Transfer message with fee details before signing
    let transferMsgWithFeeDetailsBefore = {
      ...transferMessage,
      estimatedFee,
    };
    console.log(
      "Transfer Message with Fee Details Before Signing:",
      transferMsgWithFeeDetailsBefore
    );

    // Manually serialize the transfer message
    const serializedTransferMsgBefore = beginCell()
      .storeUint(0x18, 6) // Message header
      .storeAddress(transferMessage.info.dest)
      .storeCoins(transferMessage.info.value.coins)
      .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
      .storeRef(
        beginCell()
          .storeBuffer(Buffer.from(transferMessage.body.toBoc(), "base64"))
          .endCell()
      )
      .endCell()
      .toBoc();
    console.log(
      "Serialized Transfer Message with Fee Details Before Signing:",
      serializedTransferMsgBefore
    );

    // Deserialize the transfer message to verify
    const deserializedTransferMsgBefore = Cell.fromBoc(
      serializedTransferMsgBefore
    )[0];
    console.log(
      "Deserialized Transfer Message with Fee Details Before Signing:",
      deserializedTransferMsgBefore
    );

    // Sign the message buffer
    const messageBuffer = Buffer.from(serializedTransferMsgBefore);
    const signature = sign(messageBuffer, keyPair.secretKey);
    console.log("Signature:", signature);

    // Transfer message with fee details after signing
    let transferMsgWithFeeDetailsAfter = {
      ...transferMsgWithFeeDetailsBefore,
      signature,
    };
    console.log(
      "Transfer Message with Fee Details After Signing:",
      transferMsgWithFeeDetailsAfter
    );

    // Manually serialize the transfer message after signing
    const signedTransferMessage = beginCell()
      .storeUint(0x18, 6) // Message header
      .storeAddress(transferMessage.info.dest)
      .storeCoins(transferMessage.info.value.coins)
      .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
      .storeRef(
        beginCell()
          .storeBuffer(Buffer.from(transferMessage.body.toBoc(), "base64"))
          .endCell()
      )
      .endCell();

    const serializedTransferMsgAfter = signedTransferMessage.toBoc();
    console.log(
      "Serialized Transfer Message with Fee Details After Signing:",
      serializedTransferMsgAfter
    );

    // Deserialize the transfer message to verify
    const deserializedTransferMsgAfter = Cell.fromBoc(
      serializedTransferMsgAfter
    )[0];
    console.log(
      "Deserialized Transfer Message with Fee Details After Signing:",
      deserializedTransferMsgAfter
    );

    // Create the transfer message with the signed message buffer
    const signedTransfer = await wallet.createTransfer({
      seqno: senderSeqno,
      secretKey: keyPair.secretKey,
      messages: [transferMessage],
    });
    console.log("Signed Transfer:", signedTransfer);

    // Send the signed transfer message and print txn result + hash
    const txnResult = await client.sendExternalMessage(wallet, signedTransfer);

    // Give time for the transaction to be processed
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Get sender balance after transfer
    let senderBalanceAfter = await retryWithBackoff(() =>
      client.getBalance(wallet.address)
    );
    console.log(
      "Sender TON Balance After:",
      formatBalance(senderBalanceAfter),
      "TON"
    );

    // Get receiver balance after transfer
    let receiverBalanceAfter = await retryWithBackoff(() =>
      client.getBalance(recipientAddress)
    );
    console.log(
      "Receiver TON Balance After:",
      formatBalance(receiverBalanceAfter),
      "TON"
    );

    // Get last txn on sender side
    let senderLastTxn = await client.getTransactions(senderAddress, 1);
    console.log("Sender Last Transaction:", senderLastTxn[0]);
    const outMessages = senderLastTxn[0].outMessages;

    // Ensure outMessages map is not empty
    if (outMessages._map.size > 0) {
      // Iterate through the _map entries
      for (const [key, value] of outMessages._map) {
        console.log(`Key: ${key}, Value:`, value);
        console.log("Sender Value Body src:", value.info.src);
        console.log("Sender Value Body dst:", value.info.dest);
        console.log(
          "Sender Value Body amount:",
          formatBalance(value.info.value.coins)
        );

        if (value.body) {
          const bodyHex = value.body;
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

    // Get last txn on receiver side
    let receiverLastTxn = await client.getTransactions(
      recipientAddress.toString(true, true, true),
      1
    );
    console.log("Receiver Last Transaction:", receiverLastTxn[0]);
    const inMessage = receiverLastTxn[0].inMessage;
    if (inMessage && inMessage.body) {
      const bodyHex = inMessage.body;
      const value = inMessage.info;
      console.log("Receiver Value Body src:", value.src);
      console.log("Receiver Value Body dst:", value.dest);
      console.log(
        "Receiver Value Body amount:",
        formatBalance(value.value.coins)
      );
      if (typeof bodyHex === "object" && bodyHex.toString) {
        // Convert object to string
        const hexString = bodyHex.toString();
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
  } catch (error) {
    console.log("An error occurred:", error);
  }
};

const retryWithBackoff = async (fn, retries = 5, delay = 10000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    console.log(`Retrying in ${delay} ms due to error:`, error.message);
    await new Promise((r) => setTimeout(r, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

// Provide the account address dynamically
func("UQDOvT4VeNNUq3ibvviqkIcqyu_75SH_MBSN4VJYqDulhEly");
