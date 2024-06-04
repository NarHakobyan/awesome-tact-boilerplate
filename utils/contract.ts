import type { NetworkProvider } from '@ton/blueprint';
import { Address } from '@ton/core';

import { HRDroneJetton } from '../build/HRDroneJetton/tact_HRDroneJetton';

export async function isContractDeployed(provider: NetworkProvider, address: Address) {
  const isDeployed = await provider.isContractDeployed(address);

  if (!isDeployed) {
    throw new Error(`Error: Contract at address ${address} is not deployed!`);
  }
}

export function getHRDroneJetton(): HRDroneJetton {
  return HRDroneJetton.fromAddress(Address.parse(process.env.HRDRONE_TOKEN_ADDRESS!));
}
