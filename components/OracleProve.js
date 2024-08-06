"use client";

import useOracleProve from "@/hooks/useOracleProve";
import { Button } from "@material-tailwind/react";

export default function OracleProve() {
  const { prove } = useOracleProve();
  return (
    <>
      <h1 className="text-7xl font-bold mt-5 mb-5">Oracle Prove</h1>

      <Button
        onClick={() => {
          prove("sample");
        }}
      >
        {" "}
        Prove{" "}
      </Button>
    </>
  );
}
