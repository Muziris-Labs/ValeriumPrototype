"use client";

import { ethers } from "ethers";
import ValeriumFactoryABI from "@/lib/contracts/ValeriumFactoryABI.json";
import { ValeriumProxyFactory } from "@/lib/contracts/AddressManager";
import { Noir } from "@noir-lang/noir_js";
import { BarretenbergBackend } from "@noir-lang/backend_barretenberg";
import passwordHash from "@/lib/circuits/password_hash.json";
import ValeriumABI from "@/lib/contracts/ValeriumABI.json";
import passwordProve from "@/lib/circuits/password_prove.json";

export default function useVerify() {
  const verify = async (domain, password, hash, setLoading) => {
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

    const pHash = (
      await noir.execute({
        password: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(password)),
      })
    ).returnValue;

    console.log(pHash);

    // Generate Password Prove
    const valerium = new ethers.Contract(
      valeriumAddress,
      ValeriumABI,
      provider
    );

    const proveBackend = new BarretenbergBackend(passwordProve);
    const proveNoir = new Noir(passwordProve, proveBackend);

    const messageHash = ethers.utils.hashMessage(hash);

    const inputs = {
      password: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(password)),
      flagged_message: Array.from(ethers.utils.arrayify(messageHash)),
      hashed_message: Array.from(ethers.utils.arrayify(messageHash)),
      password_hash: pHash,
    };

    const proof = ethers.utils.hexlify(
      (await proveNoir.generateFinalProof(inputs)).proof
    );

    // Verify EIP-1271 based proof
    const verify = await valerium.isValidSignature(messageHash, proof);
    console.log(verify);
  };

  return { verify };
}
