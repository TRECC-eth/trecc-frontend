/**
 * ABI for a subname registrar that exposes register(parentNode, label).
 * Matches ENS Labs ForeverSubdomainRegistrar and similar implementations.
 * https://docs.ens.domains/wrapper/creating-subname-registrar/
 */
export const SUBNAME_REGISTRAR_ABI = [
  {
    inputs: [
      { name: 'parentNode', type: 'bytes32' },
      { name: 'label', type: 'string' },
    ],
    name: 'register',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;
