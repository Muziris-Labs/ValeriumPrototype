"use client";
import { Noir } from "@noir-lang/noir_js";
import { BarretenbergBackend } from "@noir-lang/backend_barretenberg";

import { ethers } from "ethers";

import axios from "axios";
import { TOTP } from "totp-generator";
import config from "@/lib/config";

export default function useDeploy() {
  const deploy = async (domain, setLoading) => {
    setLoading(true);
    try {
      const wallet = new ethers.Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY);

      const signature = await wallet.signMessage("demo");

      const pubKey_uncompressed = ethers.utils.recoverPublicKey(
        ethers.utils.hashMessage("demo"),
        signature
      );

      let pubKey = pubKey_uncompressed.slice(4);
      let pub_key_x = pubKey.substring(0, 64);
      let pub_key_y = pubKey.substring(64);

      const hashresponse = await axios.post(
        "http://localhost:8080/api/v1/misc/getPubkeyHash",
        {
          pub_key_x: Array.from(ethers.utils.arrayify("0x" + pub_key_x)),
          pub_key_y: Array.from(ethers.utils.arrayify("0x" + pub_key_y)),
        }
      );

      console.log(hashresponse.data.pubkeyHash);

      const txVerifier = config.chains[0].deployments.UltraVerifier.address;

      // Keys provided must be base32 strings, ie. only containing characters matching (A-Z, 2-7, =).
      const { otp, expires } = TOTP.generate(
        process.env.NEXT_PUBLIC_AUTH_SECRET
      );

      console.log(otp, expires); // prints a 6-digit time-based token based on provided key and current time

      const response = await axios.post(
        "http://localhost:8080/api/v1/deploy/base",
        {
          domain,
          txHash: hashresponse.data.pubkeyHash,
          txVerifier,
        },
        {
          headers: {
            "x-auth": otp,
          },
        }
      );

      console.log(response.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return { deploy };
}
