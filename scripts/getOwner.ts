import type { NetworkProvider } from '@ton/blueprint';

import { getHRDroneJetton, isContractDeployed } from '../utils/contract';
import { printAddress } from '../utils/print';

export async function run(provider: NetworkProvider, _args: string[]) {
  const hRDroneJetton = getHRDroneJetton();

  await isContractDeployed(provider, hRDroneJetton.address);

  const openHRDroneJetton = provider.open(hRDroneJetton);

  const owner = await openHRDroneJetton.getOwner();

  printAddress(owner);
}
