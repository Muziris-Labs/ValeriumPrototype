"use client";

import { ethers } from "ethers";
import ValeriumFactoryABI from "@/lib/contracts/ValeriumFactoryABI.json";
import {
  ValeriumForwarder,
  ValeriumProxyFactory,
  ValeriumVault,
} from "@/lib/contracts/AddressManager";
import { Noir } from "@noir-lang/noir_js";
import { BarretenbergBackend } from "@noir-lang/backend_barretenberg";
import passwordHash from "@/lib/circuits/password_hash.json";
import passwordProve from "@/lib/circuits/password_prove.json";
import ValeriumABI from "@/lib/contracts/ValeriumABI.json";
import ValeriumForwarderABI from "@/lib/contracts/ValeriumForwarderABI.json";
import ValeriumVaultABI from "@/lib/contracts/ValeriumVaultABI.json";

export default function useBatch() {
  const executeBatch = async (domain, password, setLoading) => {
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

    const to = ["0x60d7966bdf03f0Ec0Ac6de7269CE0E57aAd6e9c2", ValeriumVault];
    let toHash = ethers.constants.HashZero;
    for (let i = 0; i < to.length; i++) {
      toHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(["bytes32", "address"], [toHash, to[i]])
      );
    }
    console.log("ToHash:", toHash);

    const value = [0, 0];
    let valueHash = ethers.constants.HashZero;
    for (let i = 0; i < value.length; i++) {
      valueHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(["bytes32", "uint256"], [valueHash, value[i]])
      );
    }
    console.log("ValueHash:", valueHash);

    const erc20Contract = new ethers.Contract(
      "0x60d7966bdf03f0Ec0Ac6de7269CE0E57aAd6e9c2",
      [
        "function approve(address spender, uint256 amount) public returns (bool)",
      ],
      provider
    );

    const approveData = erc20Contract.interface.encodeFunctionData("approve", [
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

    const dataArray = [approveData, deposit];

    let dataHash = ethers.constants.HashZero;
    for (let i = 0; i < dataArray.length; i++) {
      dataHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(
          ["bytes32", "bytes32"],
          [dataHash, ethers.utils.keccak256(dataArray[i])]
        )
      );
    }
    console.log("DataHash:", dataHash);

    const message = {
      from: keypair.address,
      recipient: valeriumAddress,
      deadline: Number((Date.now() / 1000).toFixed(0)) + 2000,
      nonce: Number(await forwarder.nonces(keypair.address)),
      gas: 1000000,
      proof: proof,
      to: toHash,
      value: valueHash,
      data: dataHash,
    };

    const data712 = {
      types: {
        ForwardExecuteBatch: [
          { name: "from", type: "address" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "gas", type: "uint256" },
          { name: "proof", type: "bytes" },
          { name: "to", type: "bytes32" },
          { name: "value", type: "bytes32" },
          { name: "data", type: "bytes32" },
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
      to: to,
      value: value,
      data: dataArray,
      signature: signature,
    };

    // Execute the transaction
    const data = forwarder.interface.encodeFunctionData("executeBatch", [
      forwardRequest,
      "0x60d7966bdf03f0Ec0Ac6de7269CE0E57aAd6e9c2",
      "1000000",
      "200000",
      "600000000000",
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

  return { executeBatch };
}
