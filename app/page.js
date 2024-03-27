import Batch from "@/components/Batch";
import Change from "@/components/Change";
import Deploy from "@/components/Deploy";
import DeployExternal from "@/components/DeployExternal";
import Execute from "@/components/Execute";
import Recovery from "@/components/Recovery";
import Verify from "@/components/Verify";

export default function Home() {
  return (
    <div className="flex flex-col p-10 gap-5">
      <Deploy />
      <DeployExternal />
      <Execute />
      <Recovery />
      <Change />
      <Batch />
      <Verify />
    </div>
  );
}
