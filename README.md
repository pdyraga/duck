# Transfer aras.haus funds to new Safe

A one-time script to calculate hash to sign funds transfer for aras.haus provider.

Please verify the hash to be signed:

```
❯ npx hardhat safe:getHash --network mainnet
using nonce 0
transfer data: 0xa9059cbb000000000000000000000000c3548be31952ff6a564bb593120d4f6e679152b40000000000000000000000000000000000000000000000004729829b054f8728
hash to sign: 0xbed058f7a8eeceb2b1d3acd83c8fe51152de297932fd3042c90128d7799bdd6d
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

Please sign `0xbed058f7a8eeceb2b1d3acd83c8fe51152de297932fd3042c90128d7799bdd6d`.