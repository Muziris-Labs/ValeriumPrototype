"use client";

import { Button, Input } from "@material-tailwind/react";
import { useState } from "react";
import useDeploy from "../hooks/useDeploy";

export default function Deploy() {
  const [domain, setDomain] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { deploy } = useDeploy();

  return (
    <>
      <h1 className="text-7xl font-bold mb-5">Deploy</h1>
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
        onClick={() => deploy(domain, password, setLoading)}
      >
        {" "}
        Deploy{" "}
      </Button>
    </>
  );
}
