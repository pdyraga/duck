import "@nomicfoundation/hardhat-toolbox"
import "@keep-network/hardhat-helpers"

import type { HardhatUserConfig } from "hardhat/config"

import dotenv from "dotenv-safe"

import "./src/tasks"

dotenv.config({
  allowEmptyValues: true,
  example: ".env.example",
})

const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL
  ? process.env.MAINNET_RPC_URL
  : ""

const config: HardhatUserConfig = {
  networks: {
    mainnet: {
      url: MAINNET_RPC_URL,
      chainId: 31612,
    },
  },
  paths: {
    artifacts: "./artifacts",
  },
}

export default config