import type { NetworkProvider } from '@ton/blueprint';
import { toNano } from '@ton/core';

import { HRDroneJetton } from '../build/HRDroneJetton/tact_HRDroneJetton';
import { buildOnchainMetadata } from './utils/jetton';

export async function run(provider: NetworkProvider) {
  const maxSupply = toNano('1000000000');

  //   const owner = Address.parse('UQAsB6vBUeSPdQ_XnIrTt8psWXpxdcJmCKVgyuDQYr8B2HQg');

  const content = {
    name: 'HR Drone',
    description: 'HR Drone Token',
    symbol: 'HRD',
    // decimals: 0,
    image: 'https://hrdrone.am/favicon-180x180.png',
    //image_data:""
  };
  const jetton = provider.open(await HRDroneJetton.fromInit(buildOnchainMetadata(content), maxSupply, toNano('1000')));

  await jetton.send(
    provider.sender(),
    {
      value: toNano('0.05'),
    },
    {
      $$type: 'Deploy',
      queryId: 0n,
    },
  );

  await provider.waitForDeploy(jetton.address);
}
