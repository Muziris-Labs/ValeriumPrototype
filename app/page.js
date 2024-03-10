import Change from "@/components/Change";
import Deploy from "@/components/Deploy";
import Execute from "@/components/Execute";
import Recovery from "@/components/Recovery";

export default function Home() {
  return (
    <div className="flex flex-col p-10 gap-5">
      <Deploy />
      <Execute />
      <Recovery />
      <Change />
    </div>
  );
}
