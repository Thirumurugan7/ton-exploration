const TonWeb = require("tonweb");
const tonMnemonic = require("tonweb-mnemonic");
const { JettonMinter, JettonWallet } = TonWeb.token.jetton;
const crypto = require("crypto");
const { sign, signVerify } = require("@ton/crypto");
const { internal } = require("@ton/core");

const mnemonic = [

];
const JETTON_CONTRACT_ADDRESS =
  "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs";
const WALLET2_ADDRESS = "UQDOvT4VeNNUq3ibvviqkIcqyu_75SH_MBSN4VJYqDulhEly";
const API_KEY =
  "4228a35e740e0041639fdbc8dd46edc38c817b3a3bc3938ff2f8f13fa38afa33";
const tonCenterPoint = "https://toncenter.com";

const tonweb = new TonWeb(
  new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
    apiKey: API_KEY,
  })
);

const generateUniqueQueryId = () => {
  const buffer = crypto.randomBytes(8);
  return buffer.readBigUInt64BE().toString();
};

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
    const wallet = new WalletClass(tonweb.provider, {
      publicKey: keyPair.publicKey,
    });
    const walletAddress = await wallet.getAddress();
    console.log("Wallet address:", walletAddress.toString(true, true, true));

    const jettonMinter = new JettonMinter(tonweb.provider, {
      address: new TonWeb.utils.Address(JETTON_CONTRACT_ADDRESS),
    });
    const jettonWalletAddress = await jettonMinter.getJettonWalletAddress(
      walletAddress
    );
    console.log(
      "Jetton wallet address:",
      jettonWalletAddress.toString(true, true, true)
    );

    const jettonWallet = new JettonWallet(tonweb.provider, {
      address: jettonWalletAddress,
    });

    const balanceBefore = await checkJettonBalance(jettonWallet);
    console.log("Balance before transfer:", balanceBefore, "USD₮");

    const seqno = (await wallet.methods.seqno().call()) || 0;
    console.log("Seqno:", seqno);

    const query_id = generateUniqueQueryId();
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
    const comment = new TextEncoder().encode("Jetton Transfer");
    console.log("Comment:", comment);

    const transferBody = await jettonWallet.createTransferBody({
      queryId: query_id,
      jettonAmount: TonWeb.utils.toNano("0.00001"), // Amount of Jetton to transfer (0.00001 USD₮)
      toAddress: new TonWeb.utils.Address(WALLET2_ADDRESS),
      responseAddress: walletAddress,
      forwardAmount: TonWeb.utils.toNano("0.000001"), // Forward amount
      forwardPayload: comment,
    });

    // Get and print the Jetton wallet address for the destination
    const destinationWalletAddress = new TonWeb.utils.Address(WALLET2_ADDRESS);
    const destinationJettonWalletAddress =
      await jettonMinter.getJettonWalletAddress(destinationWalletAddress);
    console.log(
      "Destination Jetton wallet address:",
      destinationJettonWalletAddress.toString(true, true, true)
    );
    const isOfflineSign = false; // Some services sign transactions on one server and send signed transactions from another server
    const transfer = await wallet.methods.transfer({
      secretKey: keyPair.secretKey,
      toAddress: jettonWalletAddress,
      amount: TonWeb.utils.toNano("0.02"), // Increased fee for the transfer
      seqno: seqno,
      payload: transferBody,
      sendMode: 3,
    });
    if (isOfflineSign) {
      const query = await transfer.getQuery(); // transfer query
      const boc = await query.toBoc(false); // serialized transfer query in binary BoC format
      const bocBase64 = TonWeb.utils.bytesToBase64(boc); // in base64 format

      const signed = await tonweb.provider.sendBoc(bocBase64); // send transfer request to network
      console.log("Signed transaction:", signed);
    } else {
      const transferResult = await transfer.send();
      console.log("Transfer result:", transferResult);
    }

    // Wait for 5 seconds to ensure the transaction is processed
    await new Promise((resolve) => setTimeout(resolve, 20000));

    const balanceAfter = await checkJettonBalance(jettonWallet);
    console.log("Balance after transfer:", balanceAfter, "USD₮");

    await tonweb.getTransactions(walletAddress, 1).then(async (resp) => {
      const transactionDetails = resp[0];
      console.log("Transaction Details:", transactionDetails);

      const inMessage = transactionDetails.in_msg;
      if (inMessage) {
        console.log("Source:", inMessage.source);
        console.log("Destination:", inMessage.destination);

        if (inMessage.msg_data && inMessage.msg_data.body) {
          const bodyBase64 = inMessage.msg_data.body;
          const bodyBuffer = Buffer.from(bodyBase64, "base64"); // Decode from base64

          // Convert buffer to a human-readable format
          const decodedBody = bodyBuffer.toString("utf-8"); // Convert buffer to utf-8 string

          console.log("Body content (base64):", bodyBase64);
          console.log("Decoded Body content:", decodedBody);

          // Check if the decoded body matches the original comment
          if (decodedBody === "Jetton Transfer") {
            console.log("Original Comment: Jetton Transfer");
          }
        } else {
          console.log("No inMessage body available.");
        }
      }

      const outMessages = transactionDetails.out_msgs;

      if (outMessages.length > 0) {
        for (const outMessage of outMessages) {
          console.log("OutMessage:", outMessage);

          if (outMessage.msg_data && outMessage.msg_data.body) {
            const bodyHex = outMessage.msg_data.body;
            console.log("Body content:", bodyHex);
          } else {
            console.log("No body in the out message.");
          }
        }
      } else {
        console.log("No outMessages available.");
      }
    });
  } catch (error) {
    console.error("Error during transaction:", error);
  }
};

main().catch(console.error);
