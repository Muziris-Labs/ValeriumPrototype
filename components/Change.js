"use client";

import useChange from "@/hooks/useChange";
import { Button, Input } from "@material-tailwind/react";
import { useState } from "react";

export default function Change() {
  const [domain, setDomain] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const { change } = useChange();

  return (
    <>
      <h1 className="text-7xl font-bold mt-5 mb-5">Change</h1>
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
        label="Enter New Recovery Password"
        size="lg"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <Button
        disabled={
          domain === "" || password === "" || newPassword === "" || loading
        }
        onClick={() => {
          change(domain, password, newPassword, setLoading);
        }}
      >
        {" "}
        Change{" "}
      </Button>
    </>
  );
}
