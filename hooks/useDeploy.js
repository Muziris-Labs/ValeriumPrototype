"use client";
import { Noir } from "@noir-lang/noir_js";
import { BarretenbergBackend } from "@noir-lang/backend_barretenberg";
import passwordHash from "@/lib/circuits/password_hash.json";
import { ethers } from "ethers";
import {
  FactoryForwarder,
  PasswordVerifier,
  ValeriumForwarder,
  ValeriumMasterCopy,
  ValeriumProxyFactory,
} from "@/lib/contracts/AddressManager";
import ValeriumABI from "@/lib/contracts/ValeriumABI.json";
import FactoryForwarderABI from "@/lib/contracts/FactoryForwarderABI.json";

export default function useDeploy() {
  const deploy = async (domain, password, setLoading) => {
    setLoading(true);
    try {
      // Generate Password Hash
      const backend = new BarretenbergBackend(passwordHash);
      const noir = new Noir(passwordHash, backend);

      const inputs = {
        password: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(password)),
      };

      const hash = (await noir.execute(inputs)).returnValue;
      console.log(hash);

      // Build the initializer
      const provider = new ethers.providers.JsonRpcProvider(
        "https://replicator.pegasus.lightlink.io/rpc/v1"
      );
      const masterCopy = new ethers.Contract(
        ValeriumMasterCopy,
        ValeriumABI,
        provider
      );
      const initializer = masterCopy.interface.encodeFunctionData(
        "setupValerium",
        [
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes(domain)),
          PasswordVerifier,
          PasswordVerifier,
          ValeriumForwarder,
          "0x51781cc1439BD05a85185C8c8CEc979b263236e3",
          hash,
          hash,
          "0x",
        ]
      );
      console.log(initializer);

      // Prepare the forwarder payload
      const keypair = new ethers.Wallet(
        process.env.NEXT_PUBLIC_PRIVATE_KEY,
        provider
      );

      const forwarder = new ethers.Contract(
        FactoryForwarder,
        FactoryForwarderABI,
        provider
      );

      const message = {
        from: keypair.address,
        recipient: ValeriumProxyFactory,
        deadline: Number((Date.now() / 1000).toFixed(0)) + 2000,
        nonce: Number(await forwarder.nonces(keypair.address)),
        gas: 1000000,
        domain: domain,
        initializer: initializer,
        salt: 1,
      };

      const data712 = {
        types: {
          ForwardDeploy: [
            { name: "from", type: "address" },
            { name: "recipient", type: "address" },
            { name: "deadline", type: "uint48" },
            { name: "nonce", type: "uint256" },
            { name: "gas", type: "uint256" },
            { name: "domain", type: "string" },
            { name: "initializer", type: "bytes" },
            { name: "salt", type: "uint256" },
          ],
        },
        domain: {
          name: "Factory Forwarder",
          version: "1",
          chainId: 1891,
          verifyingContract: FactoryForwarder,
        },
        message: message,
      };

      const signature = await keypair._signTypedData(
        data712.domain,
        data712.types,
        data712.message
      );

      console.log(signature);

      // Forward the payload using Forwarder
      const forwardRequest = {
        from: message.from,
        recipient: message.recipient,
        deadline: message.deadline,
        gas: message.gas,
        domain: message.domain,
        initializer: message.initializer,
        salt: message.salt,
        signature: signature,
      };

      const fundingWallet = new ethers.Wallet(
        process.env.NEXT_PUBLIC_PRIVATE_KEY,
        provider
      );

      const data = forwarder.interface.encodeFunctionData("execute", [
        forwardRequest,
      ]);

      const unSignedTx = {
        to: FactoryForwarder,
        data,
        value: 0,
        gasLimit: 1000000,
      };

      const signedTx = await fundingWallet.sendTransaction(unSignedTx);

      const recipient = await signedTx.wait();

      console.log(recipient);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return { deploy };
}
