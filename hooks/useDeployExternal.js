"use client";

import { ethers } from "ethers";
import {
  PasswordVerifier,
  ValeriumForwarder,
  ValeriumProxyFactory,
} from "@/lib/contracts/AddressManager";
import ValeriumFactoryABI from "@/lib/contracts/ValeriumFactoryABI.json";
import ValeriumABI from "@/lib/contracts/ValeriumABI.json";
import passwordHash from "@/lib/circuits/password_hash.json";
import passwordProve from "@/lib/circuits/password_prove.json";
import { Noir } from "@noir-lang/noir_js";
import { BarretenbergBackend } from "@noir-lang/backend_barretenberg";
import axios from "axios";

export default function useDeployExternal() {
  const deploy = async (domain, password, setLoading) => {
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

    const providerExternal = new ethers.providers.JsonRpcProvider(
      "https://sepolia.optimism.io/"
    );

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

    const publicInputs = (await proveNoir.generateFinalProof(inputs))
      .publicInputs;

    const valeriumExternal = new ethers.Contract(
      "0x2fAF5856C60C14730fd7594684C2C7d52097f440",
      ValeriumABI,
      providerExternal
    );

    const initializer = valeriumExternal.interface.encodeFunctionData(
      "setupValerium",
      [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(domain)),
        "0x2ef41ec23021bd5aba53c6599d763e89a897acad",
        "0x2ef41ec23021bd5aba53c6599d763e89a897acad",
        "0x50F1bbb486D62921eD9cE411c6b85Ec0B73D9130",
        "0x51781cc1439BD05a85185C8c8CEc979b263236e3",
        hash,
        hash,
        "0x",
      ]
    );

    const chainDeployRequest = {
      domain,
      proof,
      initializer,
    };

    const response = await axios.post(
      "http://localhost:8080/api/deploy/11155420",
      {
        chainDeployRequest,
      }
    );

    console.log(response.data);
  };

  return { deploy };
}
