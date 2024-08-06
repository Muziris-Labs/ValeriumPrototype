import { ethers } from "ethers";
import { Noir } from "@noir-lang/noir_js";
import { BarretenbergBackend } from "@noir-lang/backend_barretenberg";
import oracleProve from "@/lib/circuits/oracle_prove.json";
import { JSONRPCClient } from "json-rpc-2.0";
import axios from "axios";

const useOracleProve = () => {
  const client = new JSONRPCClient((jsonRPCRequest) => {
    return fetch("http://localhost:8080", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(jsonRPCRequest),
    }).then((response) => {
      if (response.status === 200) {
        return response
          .json()
          .then((jsonRPCResponse) => client.receive(jsonRPCResponse));
      } else if (jsonRPCRequest.id !== undefined) {
        return Promise.reject(new Error(response.statusText));
      }
    });
  });

  const foreignCallHandler = async (name, input) => {
    console.log(name, input);

    if (name === "print") {
      return [];
    }

    const oracleReturn = await client.request(name, [
      { Array: input[0].map((i) => i.toString("hex")) },
      { Array: input[1].map((i) => i.toString("hex")) },
      { Array: input[2].map((i) => i.toString("hex")) },
      { Array: input[3].map((i) => i.toString("hex")) },
    ]);

    return [oracleReturn.values[0].Single];
  };

  const prove = async (
    message,
    verifying_address = ethers.constants.AddressZero,
    signing_address = ethers.constants.AddressZero
  ) => {
    const wallet = new ethers.Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY);

    const signature = await wallet.signMessage(message);

    const pub_key_uncompressed = ethers.utils.recoverPublicKey(
      ethers.utils.hashMessage(message),
      signature
    );

    let pubKey = pub_key_uncompressed.slice(4);
    let pub_key_x = pubKey.substring(0, 64);
    let pub_key_y = pubKey.substring(64);

    const sig = Array.from(ethers.utils.arrayify(signature));
    sig.pop();

    const inputs = {
      pub_key_x: Array.from(ethers.utils.arrayify("0x" + pub_key_x)),
      pub_key_y: Array.from(ethers.utils.arrayify("0x" + pub_key_y)),
      signature: sig,
      hashed_message: Array.from(
        ethers.utils.arrayify(ethers.utils.hashMessage(message))
      ),
      tx_hash:
        "0x2c24be59a2c14937693f7fbb8683497551dc334b3d3ee67675bb03c1df699b66",
      verifying_address: ethers.utils.hexZeroPad(verifying_address, 32),
      signing_address: ethers.utils.hexZeroPad(signing_address, 32),
    };

    console.log(inputs);

    const backend = new BarretenbergBackend(oracleProve);
    const noir = new Noir(oracleProve, backend);

    const { witness } = await noir.execute(inputs, foreignCallHandler);
    const rawProof = await backend.generateProof(witness);

    console.log(rawProof);

    const proof = ethers.utils.hexlify(rawProof.proof);

    console.log(proof);

    return proof;
  };

  return { prove };
};

export default useOracleProve;
