# Transfer aras.haus funds to new Safe

A one-time script to calculate hash to sign funds transfer for aras.haus provider.

The script produces hashes for two transaction. First transaction sends 0.001 BTC
and the second transaction sends the rest.

Please verify the hash to be signed for the first and the second transaction
by looking at the code in `src/tasks/index.ts` and running the script manually:

```
❯ npx hardhat safe:getHash --network mainnet
first transfer data: 0xa9059cbb000000000000000000000000c3548be31952ff6a564bb593120d4f6e679152b400000000000000000000000000000000000000000000000000038d7ea4c68000
first hash to sign: 0xeaba8178efce80db82e3522464143458b3865c8befc36bb717c8eea418419060
first transfer data: 0xa9059cbb000000000000000000000000c3548be31952ff6a564bb593120d4f6e679152b40000000000000000000000000000000000000000000000004725f51c60890728
first hash to sign: 0xe35951987e9736a25806520876237de9dcd0feabee492e134827351ba8fadac3
```

Next, please download and unzip MyCrypto binary: keybase://public/piotrd/MyCrypto.zip

If your MacBook has an M1 chip, please execute  `xattr -r -d com.apple.quarantine MyCrypto.app`
from the console on the unzipped file.

You should be able to right-click on the MyCrypto application and open it. On
the left side, in the navigation menu, there is a "Sign & Verify Message" section.
Please go there and connect your Ledger. Use the same address you use for the Safe.
Note you will most likely have to choose the Default (ETH) derivation path
instead of the default Ledger (ETH) derivation path to see your address on the
list.

Please sign hashes for the first and the second transaction:
- `0xeaba8178efce80db82e3522464143458b3865c8befc36bb717c8eea418419060`,
- `0xe35951987e9736a25806520876237de9dcd0feabee492e134827351ba8fadac3`.