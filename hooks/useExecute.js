"use client";

import { BarretenbergBackend } from "@noir-lang/backend_barretenberg";
import { ethers } from "ethers";
import { Noir } from "@noir-lang/noir_js";
import config from "@/lib/config";
import axios from "axios";
import useOracleProve from "./useOracleProve";

export default function useExecute() {
  const { prove } = useOracleProve();

  const execute = async (domain, setLoading) => {
    try {
      const chain = config.chains[0];

      const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrl);

      const factory = new ethers.Contract(
        chain.deployments.FusionProxyFactory.address,
        chain.deployments.FusionProxyFactory.abi,
        provider
      );

      const fusionAddress = await factory.getFusionProxy(domain);

      console.log(fusionAddress);

      const fusion = new ethers.Contract(
        fusionAddress,
        chain.deployments.Fusion.abi,
        provider
      );

      const nonce = Number(await fusion.getNonce());

      console.log(nonce);

      const txData = {
        to: "0xA2d6267B5b167Ee27174BfDa808408F90391D949",
        value: ethers.utils.parseEther("0.0001"),
        data: "0x",
        operation: 0,
      };

      const abiCoder = new ethers.utils.AbiCoder();

      const message = abiCoder.encode(
        ["address", "uint256", "bytes", "uint8", "uint256"],
        [txData.to, txData.value, txData.data, txData.operation, nonce]
      );

      const txHash = ethers.utils.keccak256(message);

      const signerResponse = await axios.get(
        "http://localhost:8080/api/v1/misc/signer"
      );

      console.log(signerResponse.data.signer);

      const checkingWallet = new ethers.Wallet(
        process.env.NEXT_PUBLIC_PRIVATE_KEY,
        provider
      );

      const proof =
        "0x09414b94ba16c397fb147c524532eebe03ea15abe27f1c7cc003243c96e0f3532ce7729a1f0747909fd7b9b9a5f619a5ea57f8dc2396269de23d5973d06ad1bf1018639f24511729c4833b5eb0a1337eaee5484b6efd6847aae3603e73f21f520b98e745f14790171f373753e1bf19cfe2f1a22f78dda542ef0d1eba63011dc20ef2673beba75b6834eef98309fb3e2695527b4ef780ebf6009c1a40243412bb1c51a80ae0cc322eef30d5be5001112360128d9156a5a55fc6f2d1d022830c3a1f6835852bdc7f57758359c310f79437509d11539acbca00ce2e20a2dd5a7ba111a54b0b88f9c1d961860d6b4be5c0335d408e5f9929de41aa0f586dbf679b8f07beb67cbc1f7c37af1a71a36b06f69d9aac3ec0081ef6675d8c8ee7e30ba99e019723766ae3b60a1d4a4996e4287b433bbcbd313e7e113daf2b545a83dc5086024f27f63aaef92b0c8cc51c26910e33c92a2f9af20ad3dcc9f61845cb5390ff0d2e9806d498c56d1fc8ffd8762ac6f316a5dfac8d966fd08dda637fe96d0dd6291072d8c5bcce05522710e528049ba0741320d3b2785967327620066aa2da181438de382cfac44b738beca670e32fe64c9df115602f44cc1d49b7f40fcfbf83031f80332f8c83f5174cd66613bd57f9462b1cb7cf407cab325e1577d2d97ba4255bbba49aa739720aaba26d4cd041e65b01e7cc48f6e9a7573c31e3f2ac315c17cb7ec003dae1b5404c4cdc25dc0e0ac1f5a1ecb995dc4be11c18c4a96ab8762a7f62fff8db668bbad997f4753473c952328528080b097a69592eb5aeea4d6704630560f8466b8f045e2db8c7be6bbfab1af7ee5d40e80813170c356e449b010083964b874352d610d1318f2306c9d1ce255124d1d90f917f9566becab754561376dd57ce11a2e5de20771529db43e73c7a752ec0623ad4e911663071e563f219cd54f4daa12192ed7c7c80b28e81ddac3882dba0ab03a0cccc2a096e77cb120e561a20a355d0ccdee8429d2efb34f152c10ae1c93796da3b187fb5820a170f11acd4ea48ff6bbd7ab70228d4c0a1e76fd5c8008088b2a993b821e98cceee1e2bcf5cf72ebf8003c226f52781242fcbba49026916854ab58c09587d1cdfc2451e7c3fee8f5165904df588629814b62610c3be00bc16f1769802a01e5dee15a91973d2c3306d665689f049c3d00aa4d1ed8381172aa821bd3b65d8585ba87b63099e6dbe4d5d4cf0e6ccaedf4222ce2118c577ed9275a26135c8ad28edd83798083639eed041b0dcd540cfb9a7582f4d4943114706a8adec57ed1fdc648ad29c234369933cdbe8bceba6a897f8fef5d039f111756d9ec7285f575f1773e42c8c1c6be7e822082fcfa087cef6a93be05536695362976ae8e9e91fc15cf335e316229180b1bc8154fe4f8ab868e8ba4f97ccdd1798a17bfb6f5bea6ce221b9543c1c19a7401c694d70e86b11575fd3dae0b5172cf046c127ab44a22320807537d1083487084b26d9a662bc136eedf581a873d491955bacd4e8ec6404f3ae2fba922d098c840d41bd15c45e7a25490e0680a6c9f62c9266fb0388d07a857eab76ce2f2ece8e46d6d7df25ddde2b618f2d92b0b182964e14e64e7f37df08627a7ab405e1fafd227f01bcd4bb44aa690927584f534c6f4cd9e01f21d8dc929953344d256dba43258714ef14b538a09d68eb7bb97ea49ac69c67900a1bf7f1b8d02447018c48a4e3922ccc5f7bc87d87f2520ab60886e550020bead1d82b6c2ffee5d1274bb49fc320f53cef8b71a2cd6570d00bced6e012cf8d3ed3423ac4d85166ec1c9a75f0e788cb28ba1242b7725b3f3a1a9f2234f553d0406a3389040155db43213182b9afadeff6f418e25325036aca795be12e3dc7e0eda06a45ace16967e629e4b05d2fd3246fcff1a4eaa6472665e0f3ee3bd88d90f178ecde92b8807efe12827d6bf1f20a0cebcee7a693bb857519dd2dd4590542d7c4e8417776f8da1f20f43e83dae87bf54b48aa2d32894213430df9d106cea997555aab79dc5431ff08f7a7dc395e4140caf39f1f8b42b2137eea9ae40638747c5284c3529ea192602c0442cb9da88645c43f25e175134c372bde6b0ebb2d95f1aec6766d8d356bb92da94123e95b751fda075796d379fbf5a72b2233b7b56bca269cfa9c9d1c0c081ddaf99729f6da3b3d540b6720be4aef64d5a5a0f55f5958329753cbe85ed57d26cdb670a09bc850755379c1ac793d40080f5d339ddb89fbddeee3a085f82ffd1406ed5df0b23c9921d67463db655b01ddab2c4aec84ebb1da0c6da1d92d6da416c0a5d765ec2b7dd16e4b7f5f815478fb1d3c9e6edb606eb62a536de02450c71fdeda8adf50503b499e56d2da37e4f12f47ee8023f26502f4855f71c7a5ea840c4d2380db62c3469581e15ef8201ce0a9f1c45ba5e4f2c55ff2b65bf28fcb3b2dc995779681640ac01a8cbed922adb81f145e69559558c80078c35805c7b96117ecc9b92b80cce3e7a91d9654a1c6bbde913a03b9fdf6d3b7625aab3ada2ec507089259a38d449f95918e32edb169f07018e1b5f1fc0bc0dc7fa27ca08acf9a09cc055188634eb8228ffdd9447e95f78436ca3e01a876b9d045323f23bd21d52d41d30aa206b246672847ec18238f09c8dc688ecb758da8fa4c3cd74cf498ac237bd80e8f9f558be19c8e9adc22a6a42f8a6d12cae787c313c66b20b76c3ba106dd650241f4077f2c5ea42011c6bae9f90633f23c96be70c4822fb43fe21fb723d29612c67ffb5ec21c2a3ed1b198df4623d6626ef765ef3af061aa60970d922c0aec88220293aa1a17f7ec09db08d4513143973be29a512979a850b38a1f18182d57cafe4772b944e03b684fd018fdc2dc1d54e267ed051720b9fa7786301c17d6c811892077e6f5dedba92d0f30686574c60b90f7f17108362b8f723527ff14dc065dbb1740d2af88b2696953284a91aa678921713ca27070cb7e715c94220fcf8f24fbe50a9939919ab29b8afe6e3a6a2664156b32ba0292e14013c36fd7";

      const FusionForwarder = new ethers.Contract(
        chain.deployments.FusionForwarder.address,
        chain.deployments.FusionForwarder.abi,
        provider
      );

      const rawForwardExexuteData = {
        from: checkingWallet.address,
        recipient: fusionAddress,
        deadline: Number((Date.now() / 1000).toFixed(0)) + 2000,
        nonce: Number(await FusionForwarder.nonces(checkingWallet.address)),
        gas: 2000000,
        proof: proof,
        txData: txData,
      };

      // const tx = fusion.interface.encodeFunctionData("executeTx", [
      //   proof,
      //   txData,
      // ]);

      // console.log(tx);

      // const unSignedTx = {
      //   to: fusionAddress,
      //   value: 0,
      //   data: tx,
      // };

      // const gas = await checkingWallet.call(unSignedTx);

      // console.log(abiCoder.decode(["bool"], gas));

      // return;

      const data712 = {
        types: {
          Transaction: [
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "data", type: "bytes" },
            { name: "operation", type: "uint8" },
          ],
          ForwardExecute: [
            { name: "from", type: "address" },
            { name: "recipient", type: "address" },
            { name: "deadline", type: "uint256" },
            { name: "gas", type: "uint256" },
            { name: "proof", type: "bytes" },
            { name: "txData", type: "Transaction" },
          ],
        },
        domain: {
          name: "Fusion Forwarder",
          version: "1",
          chainId: chain.chainId,
          verifyingContract: chain.deployments.FusionForwarder.address,
        },
        message: rawForwardExexuteData,
      };

      const signature = await checkingWallet._signTypedData(
        data712.domain,
        data712.types,
        data712.message
      );

      const forwardRequest = {
        from: rawForwardExexuteData.from,
        recipient: rawForwardExexuteData.recipient,
        deadline: rawForwardExexuteData.deadline,
        gas: rawForwardExexuteData.gas,
        proof: rawForwardExexuteData.proof,
        txData: rawForwardExexuteData.txData,
        signature: signature,
      };

      console.log(forwardRequest);

      const payloadResponse = await axios.post(
        "http://localhost:8080/api/v1/execute/native/" + chain.chainId,
        {
          forwardRequest,
        }
      );

      console.log(payloadResponse.data);
    } catch (error) {
      console.error(error);
    }
  };

  return { execute };
}
