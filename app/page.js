import Batch from "@/components/Batch";
import BuyCredit from "@/components/BuyCredit";
import BuyCreditERC20 from "@/components/BuyCreditERC20";
import Change from "@/components/Change";
import Deploy from "@/components/Deploy";
import DeployExternal from "@/components/DeployExternal";
import Execute from "@/components/Execute";
import Recovery from "@/components/Recovery";
import Verify from "@/components/Verify";
import PasskeyWallet from "@/components/Wallet";
import WebAuthn from "@/components/WebAuthn";

export default function Home() {
  return (
    <div className="flex flex-col p-10 gap-5">
      <Deploy />
      <DeployExternal />
      <BuyCredit />
      <BuyCreditERC20 />
      <Execute />
      <Recovery />
      <Change />
      <Batch />
      <Verify />
      <PasskeyWallet />
      <WebAuthn />
    </div>
  );
}
