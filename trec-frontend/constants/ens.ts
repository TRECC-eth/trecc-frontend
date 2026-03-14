import { namehash } from 'viem/ens';

/** Parent ENS name for the app (already registered by you). */
export const TRECC_ENS_PARENT = 'trecc.eth';

/** Namehash of trecc.eth for contract calls. */
export const TRECC_ENS_PARENT_NODE = namehash(TRECC_ENS_PARENT);

/** ENS contract addresses on Sepolia (https://docs.ens.domains/learn/deployments/#sepolia) */
export const ENS_SEPOLIA = {
  /** Name Wrapper – creates subnames; parent must be wrapped and approve a registrar. */
  nameWrapper: '0x0635513f179D50A207757E05759CbD106d7dFcE8' as const,
  /** Public Resolver – used when creating subnames with setSubnodeRecord. */
  publicResolver: '0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5' as const,
} as const;

/**
 * Subname Registrar contract address (Sepolia).
 * Deploy the ENS Labs ForeverSubdomainRegistrar (or similar), wrap trecc.eth,
 * call setApprovalForAll(nameWrapper, thisRegistrar), then set this address.
 * Leave as zero to use direct Name Wrapper flow (only works if connected wallet owns trecc.eth).
 */
export const TRECC_ENS_SUBNAME_REGISTRAR =
  (process.env.NEXT_PUBLIC_TRECC_ENS_REGISTRAR as `0x${string}`) ||
  ('0x0000000000000000000000000000000000000000' as const);

export const SEPOLIA_CHAIN_ID = 11155111;
