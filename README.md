# cs251-splitwise-dapp

## Start the app

0. Install the required dependency.

```bash
$ npm install --save-dev hardhat
$ npm install --save-dev @nomiclabs/hardhat-ethers
```

1. Start the ethereum virtual node.

```bash
$ npx hardhat node --hostname 127.0.0.1
```

2. Deploy the smartcontract

```bash
$ npx hardhat run --network localhost scripts/deploy.js
```

3. Update the smart contract address and abi.

- abi - artifacts/contracts/mycontract.sol/Splitwise.json
- contract address - (From the deployment command in the previous step)

Update at
`web_app/script.js`

- variable: abi, contractAddress
