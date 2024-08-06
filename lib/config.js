const FusionABI = require("./contracts/Fusion.json");
const FusionForwarderABI = require("./contracts/FusionForwarder.json");
const FactoryForwarderABI = require("./contracts/FactoryForwarder.json");
const FusionProxyFactoryABI = require("./contracts/FusionProxyFactory.json");
const FusionVaultABI = require("./contracts/FusionVault.json");
const UltraVerifierABI = require("./contracts/UltraVerifier.json");

const config = {
  name: "ValeriumProtocol",
  version: "0.1.0",
  author: "Anoy Roy Chowdhury",
  chains: [
    {
      name: "Optimism Sepolia",
      chainId: 11155420,
      isMainnet: false,
      rpcUrl: "https://public.stackup.sh/api/v1/node/optimism-sepolia",
      isBase: true,
      deployments: {
        Fusion: {
          address: "0x17DDF0820846565B5CF237E80Ad3D5A2bE3CCe3D",
          abi: FusionABI,
        },
        FusionForwarder: {
          address: "0x7FdBdEA39A0Ec5ac3c714dc2Dd530dc6ab37Db6e",
          abi: FusionForwarderABI,
        },
        FactoryForwarder: {
          address: "0xFA2d0B8DE8c95c49615eAd2CAb22D26CB9998445",
          abi: FactoryForwarderABI,
        },
        FusionProxyFactory: {
          address: "0x96a4983233D6F784Fc4fE24acbecd58E9093ede4",
          abi: FusionProxyFactoryABI,
        },
        FusionVault: {
          address: "0xDe45479eB204834f3Db76161bB8DE48a5A3B3D32",
          abi: FusionVaultABI,
        },
        UltraVerifier: {
          address: "0x0Ce655f9eE5AD99cF2dD1ABcB191951Cc3Ba5Cb9",
          abi: UltraVerifierABI,
        },
        GasTank: {
          address: "0xA2d6267B5b167Ee27174BfDa808408F90391D949",
          abi: null,
        },
      },
      utils: {
        baseGas: 0,
        cautionGas: 15000,
        eth_id: 1027,
        usd_id: 2781,
      },
      tokens: [
        {
          name: "Ethereum",
          symbol: "ETH",
          decimals: 18,
          address: "0x0000000000000000000000000000000000000000",
          id: "1027",
        },
        {
          name: "USDC",
          symbol: "USDC",
          decimals: 6,
          address: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
          convert_id: "3408",
        },
      ],
    },
  ],
};

export default config;
