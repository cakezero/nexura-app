import { API_URL_PROD, API_URL_DEV } from "@0xintuition/graphql"
import { network } from "./env.utils";
import { checksumAddress } from "viem";

export const RELIC_CONTRACT = checksumAddress("0x7ab2f10cac6e27971fa93a5d5470bb84126bb734");

export const GRAPHQL_API_URL = network === "testnet" ? API_URL_DEV : API_URL_PROD;

export const atomIds: Record<string, `0x${string}`> = {
  "i-trust": "0x3a73f3b1613d166eea141a25a2adc70db9304ab3c4e90daecad05f86487c3ee9",
  "i-collaborated": "0x314e6d36910ee516b9fc5f20470b0bca0e36137f5dbcb38e30356fc5396cccdc",
  "i-follow": "0xffd07650dc7ab341184362461ebf52144bf8bcac5a19ef714571de15f1319260",
  "i-interacted": "0x6e4659631eae2d115a8d2a557a1705dead1b0d8e8987b5f7a0f567d8cc676b8a"
}

export const NexonsAddress: Record<string, `0x${string}`> = {
  "1": "0x28D5405dA0E2e2476e8EddA08775c61b3B4FeB7d",
  "2": "0xcB5cF742a846AcABba0BE1a85676358C7D4b23De",
  "3": "0x404b507a362d3D57Dc83528832499D710F97F5A5",
  "4": "0xDe0c57E2d9A5e0364C17aE0Fc78d3DBFd9810892",
  "5": "0x4424685e92Dad94A175BFF57e2854D3EEA90345b",
  "6": "0xc1Da18E2FbE40E644015a651C5F02e6cf05A303E",
  "7": "0x83804749daEb236372056235620A4100fD33C426",
  "8": "0x07C66482ED8Ff74931D737684EE0466801891078",
  "9": "0x231835B2438A1a2a6E0B51aD70EFE954BCB2eF4E",
  "10": "0x9215920DD5d1E5f2F23E148e2735476892269C6A",
};

export const STUDIO_ABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_fee",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "ContractIsEmpty",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "FeeNotSent",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "OnlyOwnerCanCallThis",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "fee",
				"type": "uint256"
			}
		],
		"name": "SendTheRequiredFeeAmount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalCampaigns",
				"type": "uint256"
			}
		],
		"name": "FeePaid",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "feeBalance",
				"type": "uint256"
			}
		],
		"name": "FeeWithdrawn",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "checkFeeBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "fee",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "payFee",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "totalCampaignsCreated",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "newFee",
				"type": "uint256"
			}
		],
		"name": "updateFee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdrawFee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];
