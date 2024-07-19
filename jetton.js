const TonWeb = require("tonweb");
const tonMnemonic = require("tonweb-mnemonic");
const { JettonMinter, JettonWallet } = TonWeb.token.jetton;
const crypto = require("crypto");

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

    // Custom message for Jetton transfer
    const comment = new TextEncoder().encode("Jetton Transfer");

    const transferBody = await jettonWallet.createTransferBody({
      queryId: query_id,
      jettonAmount: TonWeb.utils.toNano("0.00001"), // Amount of Jetton to transfer (0.00001 USD₮)
      toAddress: new TonWeb.utils.Address(WALLET2_ADDRESS),
      responseAddress: walletAddress,
      forwardAmount: TonWeb.utils.toNano("0.000001"), // Forward amount
      forwardPayload: comment, // Custom message
    });

    // const transferResult = await wallet.methods
    //   .transfer({
    //     secretKey: keyPair.secretKey,
    //     toAddress: jettonWalletAddress,
    //     amount: TonWeb.utils.toNano("0.01"), // Fee for the transfer
    //     seqno: seqno,
    //     payload: transferBody,
    //     sendMode: 3,
    //   })
    //   .send();

    // console.log("Transfer result:", transferResult);

    // Wait for 5 seconds to ensure the transaction is processed
    await new Promise((resolve) => setTimeout(resolve, 5000));

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
          const bodyHex = inMessage.msg_data.body;
          console.log("Type of bodyHex:", typeof bodyHex);
          console.log("Body content:", bodyHex);
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
