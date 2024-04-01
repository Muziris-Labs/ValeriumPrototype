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
  ValeriumVault,
} from "@/lib/contracts/AddressManager";
import ValeriumVaultABI from "@/lib/contracts/ValeriumVaultABI.json";
import axios from "axios";

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

    const erc20Contract = new ethers.Contract(
      "0x60d7966bdf03f0Ec0Ac6de7269CE0E57aAd6e9c2",
      [
        "function transfer(address to, uint256 value) external returns (bool success)",
        "function approve(address spender, uint256 amount) external returns (bool success)",
      ],
      provider
    );

    const transferData = erc20Contract.interface.encodeFunctionData("approve", [
      ValeriumVault,
      Number(ethers.utils.parseEther("0.1")).toString(),
    ]);

    const ValeriumVaultContract = new ethers.Contract(
      ValeriumVault,
      ValeriumVaultABI,
      provider
    );

    const deposit = ValeriumVaultContract.interface.encodeFunctionData(
      "deposit",
      [
        "0x60d7966bdf03f0Ec0Ac6de7269CE0E57aAd6e9c2",
        Number(ethers.utils.parseEther("0.1")).toString(),
      ]
    );

    const message = {
      from: keypair.address,
      recipient: valeriumAddress,
      deadline: Number((Date.now() / 1000).toFixed(0)) + 2000,
      nonce: Number(await forwarder.nonces(keypair.address)),
      gas: 1000000,
      proof: proof,
      to: keypair.address,
      value: 0,
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

    // const estimate = await axios.get(
    //   `http://localhost:8080/api/execute/estimate/native/1891?forwardRequest=${JSON.stringify(
    //     forwardRequest
    //   )}&address=0x60d7966bdf03f0Ec0Ac6de7269CE0E57aAd6e9c2`
    // );

    // console.log(estimate.data);

    // const response = await axios.post(
    //   "http://localhost:8080/api/execute/erc20/1891?address=0x60d7966bdf03f0Ec0Ac6de7269CE0E57aAd6e9c2",
    //   {
    //     forwardRequest,
    //     mode: "password",
    //   }
    // );

    // console.log(response.data);

    const response = await axios.post(
      `http://localhost:8080/api/execute/gasless/${domain}/1891`,
      {
        forwardRequest,
        mode: "password",
      }
    );

    console.log(response.data);

    const balance = await axios.get(
      `http://localhost:8080/api/gasCredit/balance/${domain}`
    );

    console.log(balance.data);
  };

  return { execute };
}
