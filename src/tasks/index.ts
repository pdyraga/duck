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

task("safe:execute", "Execute a Safe transaction with provided signatures")
  .addParam("safe", "The Safe contract address")
  .addParam("signatures", "The signatures to use for execution")
  .addParam("nonce", "The nonce for the transaction")
  .addOptionalParam("to", "Target address (defaults to 0x7b7C000000000000000000000000000000000000)", "0x7b7C000000000000000000000000000000000000")
  .addOptionalParam("data", "Transaction data (defaults to transfer call)", "0xa9059cbb000000000000000000000000c3548be31952ff6a564bb593120d4f6e679152b40000000000000000000000000000000000000000000000004725f51c60890728")
  .addOptionalParam("value", "ETH value to send", "0")
  .addOptionalParam("operation", "Operation type (0=Call, 1=DelegateCall)", "0")
  .addOptionalParam("simulate", "Simulate only, don't execute", "true")
  .setAction(async (args, hre) => {
    const { ethers } = hre
    const { 
      safe: safeAddress, 
      signatures, 
      nonce,
      to,
      data,
      value,
      operation,
      simulate
    } = args
    
    // Show current signer
    const [signer] = await ethers.getSigners()
    console.log(`Current signer: ${signer ? await signer.getAddress() : 'No signer configured'}`)

    try {
      // Get Safe contract instance
      const safe = await ethers.getContractAt("Safe", safeAddress)
      
      // Fixed parameters as specified
      const safeTxGas = 0
      const baseGas = 0
      const gasPrice = 0
      const gasToken = ethers.ZeroAddress
      const refundReceiver = ethers.ZeroAddress
      
      console.log(`\n=== Safe Transaction Details ===`)
      console.log(`Safe: ${safeAddress}`)
      console.log(`To: ${to}`)
      console.log(`Value: ${value}`)
      console.log(`Data: ${data}`)
      console.log(`Operation: ${operation} (${operation === "0" ? "Call" : "DelegateCall"})`)
      console.log(`Nonce: ${nonce}`)
      console.log(`Signatures: ${signatures}`)
      
      // Try to get current Safe state (optional - may fail if not deployed)
      let owners = []
      try {
        const threshold = await safe.getThreshold()
        owners = await safe.getOwners()
        console.log(`\nSafe threshold: ${threshold}`)
        console.log(`Safe owners: ${owners}`)
      } catch (e) {
        console.log(`\nWarning: Could not fetch Safe state (Safe may not be deployed yet)`)
      }
      
      // Calculate transaction hash
      const txHash = await safe.getTransactionHash(
        to,
        value,
        data,
        operation,
        safeTxGas,
        baseGas,
        gasPrice,
        gasToken,
        refundReceiver,
        nonce
      )
      console.log(`\nTransaction hash: ${txHash}`)
      
      // Verify and adjust signatures
      console.log(`\nProcessing signatures...`)
      
      // Parse and fix signatures for Safe format
      const sigBytes = ethers.getBytes(signatures)
      const sigCount = sigBytes.length / 65
      console.log(`Number of signatures: ${sigCount}`)
      
      let adjustedSigs = []
      let signerAddresses = []
      
      for (let i = 0; i < sigCount; i++) {
        const start = i * 65
        const sig = sigBytes.slice(start, start + 65)
        const r = ethers.hexlify(sig.slice(0, 32))
        const s = ethers.hexlify(sig.slice(32, 64))
        let v = sig[64]
        
        console.log(`\nSignature ${i + 1}:`)
        console.log(`  v (raw): ${v}`)
        
        // Safe v1.1.1 supports Ethereum Signed Message format when v > 30
        // It will use v-4 and apply Ethereum message prefix automatically
        const recoveryV = v === 31 ? 27 : v === 32 ? 28 : v
        const sigObj = { r, s, v: recoveryV }
        
        // Verify recovery matches what Safe v1.1.1 will do
        const ethSignedHash = ethers.hashMessage(ethers.getBytes(txHash))
        const recovered = ethers.recoverAddress(ethSignedHash, sigObj)
        console.log(`  Recovered address (ETH prefix): ${recovered}`)
        signerAddresses.push(recovered)
        const isOwner = owners.includes(recovered)
        console.log(`  Is owner: ${isOwner ? '✓' : '✗'}`)
        
        // Keep v=31/32 for Safe v1.1.1 (it expects v > 30 for ETH signed messages)
        console.log(`  Using v=${v} for Safe v1.1.1 (v > 30 = ETH signed message)`)
        
        // Reconstruct signature with adjusted v
        const adjustedSig = ethers.concat([r, s, ethers.toBeHex(v, 1)])
        adjustedSigs.push(adjustedSig)
      }
      
      // Sort signatures by signer address (ascending)
      const sortedPairs = signerAddresses.map((addr, idx) => ({ 
        addr: addr.toLowerCase(), 
        sig: adjustedSigs[idx] 
      })).sort((a, b) => a.addr.localeCompare(b.addr))
      
      console.log(`\nSigners (sorted):`)
      sortedPairs.forEach(p => console.log(`  ${p.addr}`))
      
      // Combine sorted signatures
      const sortedSignatures = ethers.concat(sortedPairs.map(p => p.sig))
      console.log(`\nSorted adjusted signatures: ${ethers.hexlify(sortedSignatures)}`)
      
      let finalSignatures = signatures
      try {
        await safe.checkSignatures(txHash, data, sortedSignatures)
        console.log(`\n✅ Signatures are valid`)
        finalSignatures = sortedSignatures
      } catch (error) {
        console.log(`\n❌ Signature verification failed: ${error.message}`)
        console.log(`\nTrying unsorted adjusted signatures...`)
        try {
          const unsortedAdjusted = ethers.concat(adjustedSigs)
          await safe.checkSignatures(txHash, data, unsortedAdjusted)
          console.log(`✅ Unsorted adjusted signatures are valid`)
          finalSignatures = unsortedAdjusted
        } catch (error2) {
          console.log(`❌ Also failed: ${error2.message}`)
          console.log(`\nTrying original signatures...`)
          try {
            await safe.checkSignatures(txHash, data, signatures)
            console.log(`✅ Original signatures are valid`)
          } catch (error3) {
            console.log(`❌ Original signatures also failed: ${error3.message}`)
            throw new Error("Invalid signatures")
          }
        }
      }
      
      if (simulate === "true" || simulate === true) {
        // Simulate the transaction
        console.log(`\n=== Simulating Transaction ===`)
        try {
          // First check the token contract exists
          const tokenCode = await ethers.provider.getCode(to)
          if (tokenCode === '0x') {
            throw new Error(`No contract found at token address ${to}`)
          }
          console.log(`Token contract exists at ${to}`)
          
          // Check Safe balance for this token
          try {
            const tokenContract = new ethers.Contract(to, [
              "function balanceOf(address) view returns (uint256)",
              "function symbol() view returns (string)",
              "function decimals() view returns (uint8)"
            ], ethers.provider)
            
            const balance = await tokenContract.balanceOf(safeAddress)
            const symbol = await tokenContract.symbol().catch(() => "UNKNOWN")
            const decimals = await tokenContract.decimals().catch(() => 18)
            
            console.log(`Safe token balance: ${ethers.formatUnits(balance, decimals)} ${symbol}`)
            
            if (data.startsWith("0xa9059cbb")) {
              const iface = new ethers.Interface(["function transfer(address to, uint256 value)"])
              const decoded = iface.parseTransaction({ data })
              const transferAmount = ethers.formatUnits(decoded.args.value, decimals)
              console.log(`Transfer amount: ${transferAmount} ${symbol}`)
              console.log(`Sufficient balance: ${balance >= decoded.args.value ? '✓' : '✗'}`)
            }
          } catch (e) {
            console.log(`Could not check token details: ${e.message}`)
          }
          
          // Try the simulation
          await safe.execTransaction.staticCall(
            to,
            value,
            data,
            operation,
            safeTxGas,
            baseGas,
            gasPrice,
            gasToken,
            refundReceiver,
            finalSignatures
          )
          console.log(`✅ Simulation successful - transaction would execute successfully`)
          
        } catch (error) {
          console.log(`❌ Simulation failed: ${error.message}`)
          console.log(`Error details:`, error)
          
          // Try to provide more specific error information
          if (error.message.includes('Invalid owner provided')) {
            console.log(`\nThis error typically means:`)
            console.log(`1. The token contract has owner restrictions`)
            console.log(`2. The Safe doesn't have permission to transfer`)
            console.log(`3. The recipient address is invalid for this token`)
          }
          
          throw error
        }
      } else {
        // Execute the transaction
        console.log(`\n=== Executing Transaction ===`)
        const tx = await safe.execTransaction(
          to,
          value,
          data,
          operation,
          safeTxGas,
          baseGas,
          gasPrice,
          gasToken,
          refundReceiver,
          finalSignatures
        )
        
        console.log(`Transaction sent: ${tx.hash}`)
        console.log(`Waiting for confirmation...`)
        
        const receipt = await tx.wait()
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`)
        console.log(`Gas used: ${receipt.gasUsed.toString()}`)
        
        return receipt.transactionHash
      }
    } catch (error) {
      console.error(`\nError executing Safe transaction: ${error.message}`)
      throw error
    }
  })
