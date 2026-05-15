# What You Need for BitGo to Work

The code is already in place. To make BitGo execution work you only need **three things from BitGo** and to put them in `.env`.

## 1. BitGo test account

- Sign up at **https://app.bitgo-test.com**
- In test, the login OTP for API is always `0000000`

## 2. Long-lived access token

- In the BitGo test app: go to your account → **Developer options** → create an access token
- Or use the API: [BitGo – Create Access Tokens](https://developers.bitgo.com/docs/get-started-access-tokens)
- The token must have **wallet spend** (and view) permissions
- Use **test** environment only (production uses different URLs and config)

## 3. A **teth** (testnet Ethereum) wallet + passphrase

- The app uses **`teth`** (testnet Ethereum). The wallet ID in `.env` must be a **teth** wallet.
- In the BitGo test app: create a wallet → choose **Ethereum** → **Testnet**
- Note the **Wallet ID** (e.g. `69b53e70a7a2247f9c6cfbfbd3ba5f59`)
- Set a **wallet passphrase** for spending and use that same value in `.env`

## .env (in this folder: `trecc-frontend/trec-frontend/`)

```env
BITGO_ACCESS_TOKEN=<your_long_lived_token>
BITGO_WALLET_ID=<teth_wallet_id>
BITGO_WALLET_PASSPHRASE=<wallet_passphrase>
```

Restart the dev server after changing `.env` (`npm run dev`).

## If it still fails

- **503 / "BitGo is not configured"** → One of the three env vars is missing or empty.
- **500 / auth error** → Token expired or wrong; create a new token in BitGo test.
- **500 / wallet error** → Wallet ID must be for **teth** (testnet Ethereum), not mainnet `eth` or another coin.
- **500 / passphrase** → Use the exact passphrase you set for that wallet in BitGo.

## Chain note

This integration uses **BitGo testnet Ethereum (teth)**. Your frontend and contracts may be on Base Sepolia; for full same-chain E2E you’d need to align chains or use a production BitGo path later.
