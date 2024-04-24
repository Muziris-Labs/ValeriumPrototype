"use client";

import useWebAuthn from "@/hooks/useWebAuthn";
import { Button, Input } from "@material-tailwind/react";
import { useState } from "react";
import { ethers } from "ethers";

export default function WebAuthn() {
  const [domain, setDomain] = useState("");
  const [authData, setAuthData] = useState("");
  const [clientData, setClientData] = useState("");
  const { register, login, parseAuthData, clientDataToJSON } = useWebAuthn();
  return (
    <>
      <h1 className="text-7xl font-bold mt-5 mb-5">WebAuthn</h1>
      <Input
        label="Enter Domain Name"
        size="lg"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
      />
      <Button
        disabled={domain === ""}
        onClick={() => {
          register(domain);
        }}
      >
        Register
      </Button>
      <Button
        onClick={() => {
          login();
        }}
      >
        Login
      </Button>
      <Input
        label="Auth Data"
        size="lg"
        value={authData}
        onChange={(e) => setAuthData(e.target.value)}
      />

      <Button
        disabled={authData === ""}
        onClick={() => {
          var encoder = new TextEncoder();

          parseAuthData(encoder.encode(authData).buffer);
        }}
      >
        Parse Auth Data
      </Button>

      <Input
        label="Client Data"
        size="lg"
        value={clientData}
        onChange={(e) => setClientData(e.target.value)}
      />
      <Button
        disabled={clientData === ""}
        onClick={() => {
          clientDataToJSON(clientData);
        }}
      >
        Parse Client Data
      </Button>
    </>
  );
}
