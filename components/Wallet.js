"use client";
import { Button, Input } from "@material-tailwind/react";
import { useState } from "react";
import { Magic } from "magic-sdk";
import { WebAuthnExtension } from "@magic-ext/webauthn";
import { ethers } from "ethers";

export default function PasskeyWallet() {
  const createWallet = async () => {
    const magic = new Magic("pk_live_A683D9A6EB411C26", {
      extensions: [new WebAuthnExtension()],
    });

    const token = await magic.webauthn.login({
      username: "username",
    });

    const provider = new ethers.providers.Web3Provider(magic.rpcProvider);

    const signer = provider.getSigner();

    const address = await signer.getAddress();

    console.log(address);
  };

  return (
    <>
      <h1 className="text-7xl font-bold mt-5 mb-5">PasskeyWallet</h1>
      <Button
        onClick={() => {
          createWallet();
        }}
      >
        Create Wallet
      </Button>
    </>
  );
}
