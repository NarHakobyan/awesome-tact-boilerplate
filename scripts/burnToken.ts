import type { NetworkProvider } from '@ton/blueprint';
import { Address, toNano } from '@ton/core';

import { CrowdSale } from '../build/CrowdSale/tact_CrowdSale';
import { HRDroneJetton } from '../build/HRDroneJetton/tact_HRDroneJetton';
import { getHRDroneJetton, isContractDeployed } from '../utils/contract';

export async function run(provider: NetworkProvider, _args: string[]) {
  const ui = provider.ui();

  const hRDroneJetton = getHRDroneJetton();

  await isContractDeployed(provider, hRDroneJetton.address);
  const owner = provider.sender();

  const openedHRDroneJetton = provider.open(hRDroneJetton);

  await openedHRDroneJetton.send(
    owner,
    {
      value: toNano('0.05'),
    },
    {
      $$type: 'TokenBurnNotification',
      amount: 1n,
      queryId: 1n,
      owner: owner.address!,
      response_destination: owner.address!,
    },
  );
}
