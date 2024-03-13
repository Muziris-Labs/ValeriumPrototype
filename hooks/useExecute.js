"use client";

import { BarretenbergBackend } from "@noir-lang/backend_barretenberg";
import { ethers } from "ethers";
import passwordHash from "@/lib/circuits/password_hash.json";
import passwordProve from "@/lib/circuits/password_prove.json";
import { Noir } from "@noir-lang/noir_js";
import ValeriumFactoryABI from "@/lib/contracts/ValeriumFactoryABI.json";
import ValeriumABI from "@/lib/contracts/ValeriumABI.json";
import ValeriumForwarderABI from "@/lib/contracts/ValeriumForwarderABI.json";
import {
  ValeriumForwarder,
  ValeriumProxyFactory,
} from "@/lib/contracts/AddressManager";

export default function useExecute() {
  const execute = async (domain, password, setLoading) => {
    //Get Valerium
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

    // Prepare the forwarder payload
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
      to: keypair.address,
      value: Number(ethers.utils.parseEther("0.00098")).toString(),
      data: "0x",
    };

    const data712 = {
      types: {
        ForwardExecute: [
          { name: "from", type: "address" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "gas", type: "uint256" },
          { name: "proof", type: "bytes" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes" },
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

    // Execute the transaction
    const forwardRequest = {
      from: keypair.address,
      recipient: valeriumAddress,
      deadline: message.deadline,
      gas: message.gas,
      proof: message.proof,
      to: message.to,
      value: message.value,
      data: message.data,
      signature: signature,
    };

    const data = forwarder.interface.encodeFunctionData("execute", [
      forwardRequest,
      "0x60d7966bdf03f0Ec0Ac6de7269CE0E57aAd6e9c2",
      "0",
      "0",
      "0",
    ]);

    console.log(data);

    const unSignedTx = {
      to: forwarder.address,
      data,
      value: 0,
      gasLimit: 1000000,
    };

    const signedTx = await keypair.sendTransaction(unSignedTx);

    const recipient = await signedTx.wait();

    console.log(recipient);
  };

  return { execute };
}
