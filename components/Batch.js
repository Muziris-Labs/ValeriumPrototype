"use client";

import useBatch from "@/hooks/useBatch";
import { Button, Input } from "@material-tailwind/react";
import { useState } from "react";

export default function Batch() {
  const [domain, setDomain] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { executeBatch } = useBatch();

  return (
    <>
      <h1 className="text-7xl font-bold mt-5 mb-5">Batch</h1>
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
          executeBatch(domain, password, setLoading);
        }}
      >
        {" "}
        Execute Batch{" "}
      </Button>
    </>
  );
}
