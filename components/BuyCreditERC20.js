"use client";

import useBatch from "@/hooks/useBatch";
import useBuyERC20 from "@/hooks/useBuyERC20";
import { Button, Input } from "@material-tailwind/react";
import { useState } from "react";

export default function BuyCreditERC20() {
  const [domain, setDomain] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { buyERC20 } = useBuyERC20();

  return (
    <>
      <h1 className="text-7xl font-bold mt-5 mb-5">Buy Credit (ERC-20)</h1>
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
          buyERC20(domain, password, setLoading);
        }}
      >
        {" "}
        Buy Credit ERC-20{" "}
      </Button>
    </>
  );
}
