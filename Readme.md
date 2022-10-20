![Preview](https://qwmttqyioqvlxgeq3uqps2pkve5vzndoyokufkkmia5xowudqftq.arweave.net/hZk5wwh0KruYkN0g-WnqqTtctG7DlUKpTEA7d1qDgWc)

# Image upload API for Wordcel DApp

This is an API that uploads user images to the permaweb using Bundlr.

### Install all the dependencies using:
```
yarn
```

### Development

Create a .env file in the directory and fill it with a Solana keypair:
```
BUNDLR_PRIVATE_KEY=[keypair]
```

Run this command to start the server
```
yarn dev
```

---

Note: this script authenticates all requests using message signature and checks whether the public key is a Wordcel user. To disable the check, comment the code from line 50-67 in https://github.com/Wordcel/wordcel-img-api/blob/master/src/upload.ts#L50

You will need to fund the wallet you provide in the env file with some SOL to fund the uploads using Bundlr.

[Bundlr](https://bundlr.network/) is a service that enables multichain uploads to the Arweave network.
