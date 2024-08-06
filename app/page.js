import Deploy from "@/components/Deploy";
import Execute from "@/components/Execute";
import OracleProve from "@/components/OracleProve";

export default function Home() {
  return (
    <div className="flex flex-col p-10 gap-5">
      <Deploy />
      <OracleProve />
      <Execute />
    </div>
  );
}
