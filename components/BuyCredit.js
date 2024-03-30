"use client";

import useBuy from "@/hooks/useBuy";
import { Button, Input } from "@material-tailwind/react";
import { useState } from "react";

export default function BuyCredit() {
  const [domain, setDomain] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { buyNative } = useBuy();

  return (
    <>
      <h1 className="text-7xl font-bold mt-5 mb-5">Buy Credit</h1>
      <Input
        label="Enter Domain Name"
        size="lg"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
      />
      <Input
        label="Enter Password"
        size="lg"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        disabled={domain === "" || password === "" || loading}
        onClick={() => {
          buyNative(domain, password, setLoading);
        }}
      >
        {" "}
        Buy Credit{" "}
      </Button>
    </>
  );
}
