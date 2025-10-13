import { task } from "hardhat/config"

async function getTxHash(
  safeAddress: string,
  to: string,
  data: string,
  operation: number,
  nonce: number
): Promise<string> {
  const { ethers } = hre

  const safe = await ethers.getContractAt("Safe", safeAddress)

  const txData = {
    to,
    value: 0,
    data,
    operation,
    safeTxGas: 0,
    baseGas: 0,
    gasPrice: 0,
    gasToken: ethers.ZeroAddress,
    refundReceiver: ethers.ZeroAddress,
    nonce,
  }

  // https://github.com/safe-global/safe-smart-account/blob/v1.1.1/contracts/GnosisSafe.sol#L398
  return safe.getTransactionHash(
    txData.to,
    txData.value,
    txData.data,
    txData.operation,
    txData.safeTxGas,
    txData.baseGas,
    txData.gasPrice,
    txData.gasToken,
    txData.refundReceiver,
    nonce,
  )
}

task("safe:getHash", "Calculates hash to sign for the transfer function")
  .setAction(async (args, hre) => {
    const { ethers } = hre

    const operation = 0 // Call

    const oldSafe = "0x65e9B345b833ae8b59d88076010767BeE2396C7A"
    const newSafe = "0xC3548BE31952fF6a564BB593120D4F6e679152b4"

    const token = "0x7b7C000000000000000000000000000000000000"

    const amount1 =    "1000000000000000"
    const amount2 = "5126773253058660136"

    const abi = [
      "function transfer(address to, uint256 value) public returns (bool)",
    ]
    const iface = new ethers.Interface(abi)

    const data1 = iface.encodeFunctionData("transfer", [
      newSafe,
      amount1,
    ])
    const txHash1 = await getTxHash(oldSafe, token, data1, operation, 0)
    
    console.log(`first transfer data: ${data1}`)
    console.log(`first hash to sign: ${txHash1}`)

    const data2 = iface.encodeFunctionData("transfer", [
      newSafe,
      amount2,
    ])
    const txHash2 = await getTxHash(oldSafe, token, data2, operation, 1)
    
    console.log(`first transfer data: ${data2}`)
    console.log(`first hash to sign: ${txHash2}`)
  })