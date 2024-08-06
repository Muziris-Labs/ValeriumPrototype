"use client";

import useExecute from "@/hooks/useExecute";
import { Button, Input } from "@material-tailwind/react";
import { useState } from "react";

export default function Execute() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);

  const { execute } = useExecute();
  return (
    <>
      <h1 className="text-7xl font-bold mt-5 mb-5">Execute</h1>
      <Input
        label="Enter Domain Name"
        size="lg"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
      />
      <Button
        disabled={domain === "" || loading}
        onClick={() => {
          execute(domain, setLoading);
        }}
      >
        {" "}
        Execute{" "}
      </Button>
    </>
  );
}
