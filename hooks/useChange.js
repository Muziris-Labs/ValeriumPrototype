"use client";
import {
  PasswordVerifier,
  ValeriumForwarder,
  ValeriumProxyFactory,
} from "@/lib/contracts/AddressManager";
import { ethers } from "ethers";
import ValeriumFactoryABI from "@/lib/contracts/ValeriumFactoryABI.json";
import { Noir } from "@noir-lang/noir_js";
import { BarretenbergBackend } from "@noir-lang/backend_barretenberg";
import passwordHash from "@/lib/circuits/password_hash.json";
import passwordProve from "@/lib/circuits/password_prove.json";
import ValeriumABI from "@/lib/contracts/ValeriumABI.json";
import ValeriumForwarderABI from "@/lib/contracts/ValeriumForwarderABI.json";
import axios from "axios";

export default function useChange() {
  const change = async (domain, password, newPassword, setLoading) => {
    // Get Valerium
    const provider = new ethers.providers.JsonRpcProvider(
      "https://replicator.pegasus.lightlink.io/rpc/v1"
    );

    const factory = new ethers.Contract(
      ValeriumProxyFactory,
      ValeriumFactoryABI,
      provider
    );

    const valeriumAddress = await factory.getValeriumProxy(domain);
    console.log(valeriumAddress);

    // Generate Password Hash
    const backend = new BarretenbergBackend(passwordHash);
    const noir = new Noir(passwordHash, backend);

    const hash = (
      await noir.execute({
        password: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(password)),
      })
    ).returnValue;

    console.log(hash);

    const newPasswordHash = (
      await noir.execute({
        password: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(newPassword)),
      })
    ).returnValue;

    console.log(newPasswordHash);

    // Generate Password Prove
    const valerium = new ethers.Contract(
      valeriumAddress,
      ValeriumABI,
      provider
    );

    const nonce = (await valerium.getNonce()).toNumber();
    const messageHash = ethers.utils.hashMessage(nonce.toString());

    const proveBackend = new BarretenbergBackend(passwordProve);
    const proveNoir = new Noir(passwordProve, proveBackend);

    const inputs = {
      password: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(password)),
      flagged_message: Array.from(ethers.utils.arrayify(messageHash)),
      hashed_message: Array.from(ethers.utils.arrayify(messageHash)),
      password_hash: hash,
    };

    const proof = ethers.utils.hexlify(
      (await proveNoir.generateFinalProof(inputs)).proof
    );

    // Prepare Forwarder Payload
    const keypair = new ethers.Wallet(
      process.env.NEXT_PUBLIC_PRIVATE_KEY,
      provider
    );

    const forwarder = new ethers.Contract(
      ValeriumForwarder,
      ValeriumForwarderABI,
      provider
    );

    const message = {
      from: keypair.address,
      recipient: valeriumAddress,
      deadline: Number((Date.now() / 1000).toFixed(0)) + 2000,
      nonce: Number(await forwarder.nonces(keypair.address)),
      gas: 1000000,
      proof: proof,
      newRecoveryHash: newPasswordHash,
      newRecoveryVerifier: PasswordVerifier,
      publicStorage: "0x",
    };

    const data712 = {
      types: {
        ForwardChangeRecovery: [
          { name: "from", type: "address" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "gas", type: "uint256" },
          { name: "proof", type: "bytes" },
          { name: "newRecoveryHash", type: "bytes32" },
          { name: "newRecoveryVerifier", type: "address" },
          { name: "publicStorage", type: "bytes" },
        ],
      },
      domain: {
        name: "Valerium Forwarder",
        version: "1",
        chainId: 1891,
        verifyingContract: ValeriumForwarder,
      },
      message: message,
    };

    const signature = await keypair._signTypedData(
      data712.domain,
      data712.types,
      data712.message
    );
    console.log(signature);

    const forwardRequest = {
      from: keypair.address,
      recipient: valeriumAddress,
      deadline: message.deadline,
      gas: message.gas,
      proof: message.proof,
      newRecoveryHash: newPasswordHash,
      newRecoveryVerifier: PasswordVerifier,
      publicStorage: message.publicStorage,
      signature: signature,
    };

    const estimate = await axios.get(
      `http://localhost:8080/api/change/estimate/erc20/1891?forwardRequest=${JSON.stringify(
        forwardRequest
      )}&address=0x60d7966bdf03f0Ec0Ac6de7269CE0E57aAd6e9c2`
    );

    console.log(estimate.data);

    const response = await axios.post(
      "http://localhost:8080/api/change/erc20/1891?address=0x60d7966bdf03f0Ec0Ac6de7269CE0E57aAd6e9c2",
      {
        forwardRequest,
        mode: "password",
      }
    );

    console.log(response.data);

    // // Execute the transaction
    // const data = forwarder.interface.encodeFunctionData("changeRecovery", [
    //   forwardRequest,
    //   "0x60d7966bdf03f0Ec0Ac6de7269CE0E57aAd6e9c2",
    //   "1000000",
    //   "200000",
    //   "600000000000",
    // ]);

    // const unSignedTx = {
    //   to: forwarder.address,
    //   data,
    //   value: 0,
    //   gasLimit: 1000000,
    // };

    // const signedTx = await keypair.sendTransaction(unSignedTx);

    // const recipient = await signedTx.wait();

    // console.log(recipient);
  };

  return { change };
}
