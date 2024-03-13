"use client";

import useVerify from "@/hooks/useVerify";
import { Button, Input } from "@material-tailwind/react";
import { useState } from "react";

export default function Verify() {
  const [domain, setDomain] = useState("");
  const [password, setPassword] = useState("");
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);

  const { verify } = useVerify();

  return (
    <>
      <h1 className="text-7xl font-bold mt-5 mb-5">Verify</h1>
      <Input
        label="Enter Domain Name"
        size="lg"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
      />
      <Input
        label="Enter Recovery Password"
        size="lg"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        label="Enter Hash"
        size="lg"
        value={hash}
        onChange={(e) => setHash(e.target.value)}
      />
      <Button
        disabled={domain === "" || password === "" || hash === "" || loading}
        onClick={() => {
          verify(domain, password, hash, setLoading);
        }}
      >
        {" "}
        Verify{" "}
      </Button>
    </>
  );
}
