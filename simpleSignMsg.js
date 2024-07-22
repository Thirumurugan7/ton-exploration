const TonWeb = require("tonweb");
const tonMnemonic = require("tonweb-mnemonic");
const crypto = require("crypto");
const {
  mnemonicNew,
  sign,
  signVerify,
} = require("@ton/crypto");
require("dotenv").config()

const API_KEY =
  "4228a35e740e0041639fdbc8dd46edc38c817b3a3bc3938ff2f8f13fa38afa33";

const tonweb = new TonWeb(
  new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
    apiKey: API_KEY,
  })
);

const main = async () => {
  try {
    console.log("Starting process...");

    // Generate new key
    let mnemonics = await mnemonicNew();
    console.log("Generated mnemonics:", mnemonics);
    // Replace with your mnemonics if needed
    let secret = process.env.mnemonics
    console.log(secret);
    mnemonics = secret.split(/\s+/);
    console.log(mnemonics);

    const keyPair = await tonMnemonic.mnemonicToKeyPair(mnemonics);
    const WalletClass = tonweb.wallet.all.v4R2;
    const wallet = new WalletClass(tonweb.provider, {
      publicKey: keyPair.publicKey,
    });
    const walletAddress = await wallet.getAddress();
    console.log("signer Wallet address:", walletAddress.toString(true, true, true));

    // Signing and verifying a custom message
    const message = "Hello world, okto supports ton";
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

  } catch (error) {
    console.error("Error during singing:", error);
  }
};

main().catch(console.error);
