const TonWeb = require("tonweb");
const tonMnemonic = require("tonweb-mnemonic");
const { JettonMinter, JettonWallet } = TonWeb.token.jetton;
const crypto = require("crypto");
const { sign, signVerify } = require("@ton/crypto");
const { internal, beginCell, Cell } = require("@ton/core");
const { TonClient } = require("@ton/ton");

const tonCenterPoint = "https://toncenter.com";
const API_KEY =
  "4228a35e740e0041639fdbc8dd46edc38c817b3a3bc3938ff2f8f13fa38afa33";

const client = new TonClient({
  endpoint: `${tonCenterPoint}/api/v2/jsonRPC`,
  apiKey: API_KEY,
  timeout: 60000,
});

const mnemonic = [
 
];
const JETTON_CONTRACT_ADDRESS =
  "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs";
const RECIPIENT_WALLET_ADDRESS =
  "EQDOvT4VeNNUq3ibvviqkIcqyu_75SH_MBSN4VJYqDulhBS3";

const tonweb = new TonWeb(
  new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
    apiKey: API_KEY,
  })
);

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

const generateUniqueQueryId = () => {
  const buffer = crypto.randomBytes(8);
  return buffer.readBigUInt64BE().toString();
};

const formatBalance = (balance) => (Number(balance) / 1e9).toFixed(2);

const checkJettonBalance = async (jettonWallet) => {
  try {
    const data = await jettonWallet.getData();
    return parseFloat(data.balance) / 1e9; // Convert from nanotokens to tokens
  } catch (error) {
    console.error("Error getting Jetton balance:", error);
    return 0;
  }
};

const main = async () => {
  try {
    console.log("Starting transaction process...");

    const keyPair = await tonMnemonic.mnemonicToKeyPair(mnemonic);
    const WalletClass = tonweb.wallet.all.v4R2;
    const senderWallet = new WalletClass(tonweb.provider, {
      publicKey: keyPair.publicKey,
    });
    const senderWalletAddress = await senderWallet.getAddress();
    console.log(
      "Sender Wallet Address:",
      senderWalletAddress.toString(true, true, true)
    );

    const senderSeqNo = await senderWallet.methods.seqno().call();
    console.log("Sender Seq No:", senderSeqNo);

    const senderAccountInfo = await client.getContractState(
      senderWalletAddress
    );
    console.log("Sender Account Info:", senderAccountInfo);

    // Receiver information
    const receiverWalletAddress = new TonWeb.utils.Address(
      RECIPIENT_WALLET_ADDRESS
    );
    console.log(
      "Receiver Wallet Address:",
      receiverWalletAddress.toString(true, true, true)
    );

    const receiverAccountInfo = await client.getContractState(
      receiverWalletAddress
    );
    console.log("Receiver Account Info:", receiverAccountInfo);

    // // Prepare the transfer message
    // let transferMessage = {
    //   info: {
    //     type: "internal",
    //     to: receiverWalletAddress,
    //     value: { coins: TonWeb.utils.toNano("0.1") }, // Amount in TON
    //     bounce: true,
    //     ihrDisabled: true,
    //     bounced: false,
    //     ihrFee: 0n,
    //     forwardFee: 0n,
    //     createdAt: 0,
    //     createdLt: 0n,
    //   },
    //   init: undefined,
    //   body: beginCell()
    //     .storeBuffer(Buffer.from("USDT Transfer", "utf-8"))
    //     .endCell(),
    // };
    // console.log("Transfer Message:", transferMessage);

    // // Estimate fees
    // let estimatedFee = await client.estimateExternalMessageFee(
    //   senderWalletAddress,
    //   transferMessage
    // );
    // console.log("Estimated Fee:", estimatedFee);

    // // Transfer message with fee details before signing
    // let transferMsgWithFeeDetailsBefore = {
    //   ...transferMessage,
    //   estimatedFee,
    // };
    // console.log(
    //   "Transfer Message with Fee Details Before Signing:",
    //   transferMsgWithFeeDetailsBefore
    // );

    // // Manually serialize the transfer message
    // const serializedTransferMsgBefore = beginCell()
    //   .storeUint(0x18, 6) // Message header
    //   .storeAddress(transferMessage.info.dest)
    //   .storeCoins(transferMessage.info.value.coins)
    //   .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
    //   .storeRef(transferMessage.body)
    //   .endCell()
    //   .toBoc();
    // console.log(
    //   "Serialized Transfer Message with Fee Details Before Signing:",
    //   serializedTransferMsgBefore
    // );

    // // Deserialize the transfer message to verify
    // const deserializedTransferMsgBefore = Cell.fromBoc(
    //   serializedTransferMsgBefore
    // )[0];
    // console.log(
    //   "Deserialized Transfer Message with Fee Details Before Signing:",
    //   deserializedTransferMsgBefore
    // );

    // // Sign the message buffer
    // const messageBuffer = Buffer.from(serializedTransferMsgBefore);
    // const signature = sign(messageBuffer, keyPair.secretKey);
    // console.log("Signature:", signature);

    // // Transfer message with fee details after signing
    // let transferMsgWithFeeDetailsAfter = {
    //   ...transferMsgWithFeeDetailsBefore,
    //   signature,
    // };
    // console.log(
    //   "Transfer Message with Fee Details After Signing:",
    //   transferMsgWithFeeDetailsAfter
    // );

    // // Manually serialize the transfer message after signing
    // const signedTransferMessage = beginCell()
    //   .storeUint(0x18, 6) // Message header
    //   .storeAddress(transferMessage.info.dest)
    //   .storeCoins(transferMessage.info.value.coins)
    //   .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
    //   .storeRef(transferMessage.body)
    //   .endCell();

    // const serializedTransferMsgAfter = signedTransferMessage.toBoc();
    // console.log(
    //   "Serialized Transfer Message with Fee Details After Signing:",
    //   serializedTransferMsgAfter
    // );

    // // Deserialize the transfer message to verify
    // const deserializedTransferMsgAfter = Cell.fromBoc(
    //   serializedTransferMsgAfter
    // )[0];
    // console.log(
    //   "Deserialized Transfer Message with Fee Details After Signing:",
    //   deserializedTransferMsgAfter
    // );

    // Jetton related information
    const jettonMinter = new JettonMinter(tonweb.provider, {
      address: new TonWeb.utils.Address(JETTON_CONTRACT_ADDRESS),
    });
    const senderJettonWalletAddress = await jettonMinter.getJettonWalletAddress(
      senderWalletAddress
    );

    console.log(
      "Sender Jetton Wallet Address:",
      senderJettonWalletAddress.toString(true, true, true)
    );

    const receiverJettonWalletAddress =
      await jettonMinter.getJettonWalletAddress(receiverWalletAddress);
    console.log(
      "Receiver Jetton Wallet Address:",
      receiverJettonWalletAddress.toString(true, true, true)
    );

    const senderJettonWallet = new JettonWallet(tonweb.provider, {
      address: senderJettonWalletAddress,
    });

    const receiverJettonWallet = new JettonWallet(tonweb.provider, {
      address: receiverJettonWalletAddress,
    });

    const senderJettonBalanceBefore = await checkJettonBalance(
      senderJettonWallet
    );
    console.log(
      "Sender Jetton Balance Before:",
      senderJettonBalanceBefore,
      "USD₮"
    );

    const receiverJettonBalanceBefore = await checkJettonBalance(
      receiverJettonWallet
    );
    console.log(
      "Receiver Jetton Balance Before:",
      receiverJettonBalanceBefore,
      "USD₮"
    );

    const query_id = generateUniqueQueryId();
    const comment = new TextEncoder().encode("Jetton Transfer");
    console.log("Comment:", comment);

    // Create the transfer body for the Jetton transfer
    // This prepares the payload that will be included in the transaction
    const jettonTransferBody = await senderJettonWallet.createTransferBody({
      queryId: query_id, // A unique query ID for the transfer
      jettonAmount: TonWeb.utils.toNano("0.00001"), // Amount of Jetton to transfer (0.00001 USD₮)
      toAddress: receiverWalletAddress, // Address to send the Jetton to
      responseAddress: senderWalletAddress, // Address to receive any response
      forwardAmount: TonWeb.utils.toNano("0.00001"), // Amount to forward to the recipient
      forwardPayload: {
        is_right: true,
        value: {
          sum_type: "TextComment",
          op_code: 0,
          value: {
            text: "vm transfer",
          },
        },
      }, // Additional payload (comment) to include in the transfer
    });

    // Create and send the Jetton transfer transaction
    // const transferJettonResult = await senderWallet.methods
    //   .transfer({
    //     secretKey: keyPair.secretKey, // Sender's secret key to sign the transaction
    //     toAddress: senderJettonWalletAddress, // Address of the sender's Jetton wallet
    //     amount: TonWeb.utils.toNano("0.02"), // Fee for the transfer (TON tokens)
    //     seqno: senderSeqNo, // Sequence number for the transaction
    //     payload: jettonTransferBody, // Payload of the transaction (prepared transfer body)
    //   })
    //   .send(); // Send the transaction and get the result
    // // Wait for 5 seconds to ensure the transaction is processed
    // await new Promise((resolve) => setTimeout(resolve, 15000));

    // console.log("Jetton Transfer result:", transferJettonResult);

    const senderJettonBalanceAfter = await checkJettonBalance(
      senderJettonWallet
    );
    console.log(
      "Sender Jetton Balance After:",
      senderJettonBalanceAfter,
      "USD₮"
    );

    const receiverJettonBalanceAfter = await checkJettonBalance(
      receiverJettonWallet
    );
    console.log(
      "Receiver Jetton Balance After:",
      receiverJettonBalanceAfter,
      "USD₮"
    );
    let senderLastTxn = await client.getTransactions(senderWalletAddress, 1);
    // console.log("Sender Last Transaction:", senderLastTxn[0]);/
    // console.log("Sender Last Transaction 1:", senderLastTxn[1]);
    console.log("Sender Last Transaction 2:", senderLastTxn[1]);
    const outMessages = senderLastTxn[2].outMessages;
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
        const bodyHex = value.body;
        const hexString = bodyHex.toString();
        // Remove the 'x{' prefix and '}' suffix if they exist
        const trimmedHexString = hexString.startsWith("x{")
          ? hexString.slice(2, -1)
          : hexString;
        const bodyBuffer = Buffer.from(trimmedHexString, "hex");
        const decodedBody = bodyBuffer.toString("utf-8");
        console.log("Decoded Body:", decodedBody);
        // if (value.body) {
        //   const bodyHex = value.body;
        //   // Convert the hex string to a buffer and decode it
        //   const hexString = bodyHex.toString().slice(2, -1); // Remove 'x{' and '}'
        //   const bodyBuffer = Buffer.from(hexString, "hex");
        //   const decodedBody = bodyBuffer.toString("utf-8");
        //   console.log("Decoded Body:", decodedBody);
        // } else {
        //   console.log("No body in the value.");
        // }
      }
    } else {
      console.log("No outMessages available.");
    }

    // // Get last txn on receiver side
    // let receiverLastTxn = await client.getTransactions(
    //   receiverWalletAddress.toString(true, true, true),
    //   1
    // );
    // console.log("Receiver Last Transaction:", receiverLastTxn[0]);

    // const inMessage = receiverLastTxn[0].inMessage;
    // if (inMessage && inMessage.body) {
    //   // const bodyHex = inMessage.body;
    //   const value = inMessage.info;
    //   console.log("Receiver Value Body src:", value.src);
    //   console.log("Receiver Value Body dst:", value.dest);
    //   console.log(
    //     "Receiver Value Body amount:",
    //     formatBalance(value.value.coins)
    //   );
    //   console.log(" Body amount:", value.value.coins);

    //   const bodyHex = inMessage.body;
    //   const hexString = bodyHex.toString();
    //   // Remove the 'x{' prefix and '}' suffix if they exist
    //   const trimmedHexString = hexString.startsWith("x{")
    //     ? hexString.slice(2, -1)
    //     : hexString;
    //   const bodyBuffer = Buffer.from(trimmedHexString, "hex");
    //   const decodedBody = bodyBuffer.toString("utf-8");
    //   console.log("Decoded Body:", decodedBody);
    //   // if (typeof bodyHex === "object" && bodyHex.toString) {
    //   //   // Convert object to string
    //   //   const hexString = bodyHex.toString();
    //   //   // Remove the 'x{' prefix and '}' suffix if they exist
    //   //   const trimmedHexString = hexString.startsWith("x{")
    //   //     ? hexString.slice(2, -1)
    //   //     : hexString;
    //   //   const bodyBuffer = Buffer.from(trimmedHexString, "hex");
    //   //   const decodedBody = bodyBuffer.toString("utf-8");
    //   //   console.log("Decoded Body:", decodedBody);
    //   // } else {
    //   //   console.log("Body is not a string and cannot be converted.");
    //   // }
    // } else {
    //   console.log("No inMessage body available.");
    // }
  } catch (error) {
    console.error("Error during transaction:", error);
  }
};

main().catch(console.error);
