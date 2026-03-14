import { NextRequest, NextResponse } from "next/server";
import {
  createWalletClient,
  getContract,
  http,
  isAddress,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { namehash, normalize } from "viem/ens";

const NAME_WRAPPER_SEPOLIA = "0x0635513f179D50A207757E05759CbD106d7dFcE8";
const PUBLIC_RESOLVER_SEPOLIA = "0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5";
const TRECC_ENS_PARENT = "trecc.eth";

const LABEL_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

const NAME_WRAPPER_ABI = [
  {
    inputs: [
      { name: "parentNode", type: "bytes32" },
      { name: "label", type: "string" },
      { name: "owner", type: "address" },
      { name: "resolver", type: "address" },
      { name: "ttl", type: "uint64" },
      { name: "fuses", type: "uint32" },
      { name: "expiry", type: "uint64" },
    ],
    name: "setSubnodeRecord",
    outputs: [{ name: "node", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "id", type: "uint256" }],
    name: "getData",
    outputs: [
      { name: "owner", type: "address" },
      { name: "fuses", type: "uint32" },
      { name: "expiry", type: "uint64" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Register a subname under trecc.eth on Sepolia.
 * The server wallet (owner of wrapped trecc.eth) signs the tx on behalf of the user.
 *
 * POST body: { username: string, ownerAddress: string }
 * Returns:   { txHash: string, ensName: string }
 *
 * Requires TRECC_ENS_OWNER_PRIVATE_KEY in .env (the wallet that owns wrapped trecc.eth).
 */
export async function POST(request: NextRequest) {
  let body: { username?: string; ownerAddress?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { username: rawUsername, ownerAddress } = body;

  if (!rawUsername || typeof rawUsername !== "string") {
    return NextResponse.json(
      { error: "username is required" },
      { status: 400 }
    );
  }
  if (!ownerAddress || typeof ownerAddress !== "string" || !isAddress(ownerAddress)) {
    return NextResponse.json(
      { error: "ownerAddress must be a valid Ethereum address" },
      { status: 400 }
    );
  }

  const normalizedLabel = rawUsername.trim().toLowerCase();
  if (normalizedLabel.length < 3 || normalizedLabel.length > 63) {
    return NextResponse.json(
      { error: "Username must be 3–63 characters" },
      { status: 400 }
    );
  }
  if (!LABEL_REGEX.test(normalizedLabel)) {
    return NextResponse.json(
      {
        error:
          "Username can only contain lowercase letters, numbers, and hyphens (no hyphen at start or end)",
      },
      { status: 400 }
    );
  }

  const privateKey = process.env.TRECC_ENS_OWNER_PRIVATE_KEY;
  if (!privateKey || !privateKey.startsWith("0x")) {
    return NextResponse.json(
      {
        error: "ENS subname registration not configured",
        hint: "Set TRECC_ENS_OWNER_PRIVATE_KEY (the wallet that owns wrapped trecc.eth on Sepolia) in .env",
      },
      { status: 501 }
    );
  }

  let parentNode: `0x${string}`;
  try {
    parentNode = namehash(normalize(TRECC_ENS_PARENT)) as `0x${string}`;
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to compute parent namehash", details: String(e) },
      { status: 500 }
    );
  }

  try {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const client = createWalletClient({
      account,
      chain: sepolia,
      transport: http(),
    });

    const nameWrapper = getContract({
      address: NAME_WRAPPER_SEPOLIA as Address,
      abi: NAME_WRAPPER_ABI,
      client,
    });

    // Resolve subExpiry from parent; fall back to year 2106.
    let subExpiry: bigint;
    try {
      const [, , parentExpiry] = await nameWrapper.read.getData([
        BigInt(parentNode),
      ]);
      subExpiry = parentExpiry > BigInt(0) ? parentExpiry : BigInt(4102444800);
    } catch {
      subExpiry = BigInt(4102444800);
    }

    // Guard against overwriting a subname already owned by someone else.
    const fullSubname = `${normalizedLabel}.${TRECC_ENS_PARENT}`;
    const childNode = namehash(normalize(fullSubname));
    try {
      const [existingOwner] = await nameWrapper.read.getData([
        BigInt(childNode),
      ]);
      const zero = "0x0000000000000000000000000000000000000000";
      if (
        existingOwner &&
        existingOwner !== zero &&
        existingOwner.toLowerCase() !== ownerAddress.toLowerCase()
      ) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 }
        );
      }
    } catch {
      // Subdomain does not exist yet — that's fine.
    }

    const txHash = await nameWrapper.write.setSubnodeRecord([
      parentNode,
      normalizedLabel,
      ownerAddress as Address,
      PUBLIC_RESOLVER_SEPOLIA as Address,
      BigInt(0),
      0,
      subExpiry,
    ]);

    return NextResponse.json({ txHash, ensName: fullSubname });
  } catch (e) {
    const err = e as Error & { shortMessage?: string; details?: string; cause?: unknown };
    const message = err.shortMessage || err.message || String(e);
    const details =
      err.details ??
      (err.cause instanceof Error ? err.cause.message : undefined);
    console.error("ENS register-subname error:", e);
    return NextResponse.json(
      { error: "Failed to register subname", details: details || message },
      { status: 500 }
    );
  }
}
