import Deploy from "@/components/Deploy";
import Execute from "@/components/Execute";

export default function Home() {
  return (
    <div className="flex flex-col p-10 gap-5">
      <Deploy />
      <Execute />
    </div>
  );
}
