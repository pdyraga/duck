import { task } from "hardhat/config"

async function getTxHash(
  safeAddress: string,
  to: string,
  data: string,
  operation: number
): Promise<string> {
  const { ethers } = hre

  const safe = await ethers.getContractAt("Safe", safeAddress)
  const nonce = await safe.nonce()

  console.log("using nonce " + nonce)

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

    const amount = "5127773253058660136"
    const newSafe = "0xC3548BE31952fF6a564BB593120D4F6e679152b4"

    const abi = [
      "function transfer(address to, uint256 value) public returns (bool)",
    ]
    const iface = new ethers.Interface(abi)
    const data = iface.encodeFunctionData("transfer", [
      newSafe,
      amount,
    ])

    const oldSafe = "0x65e9B345b833ae8b59d88076010767BeE2396C7A"
    const token = "0x7b7C000000000000000000000000000000000000"
    const operation = 0 // Call

    const txHash = await getTxHash(oldSafe, token, data, operation)
    
    console.log(`transfer data: ${data}`)
    console.log(`hash to sign: ${txHash}`)
  })