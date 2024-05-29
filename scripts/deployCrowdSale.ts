import type { NetworkProvider } from '@ton/blueprint';
import { toNano } from '@ton/ton';

import { CrowdSale } from '../build/CrowdSale/tact_CrowdSale';

export async function run(provider: NetworkProvider) {
  const unlockDate = 0n; //UnixTime
  const crowdSale = provider.open(await CrowdSale.fromInit(unlockDate));

  await crowdSale.send(
    provider.sender(),
    {
      value: toNano('0.05'),
    },
    {
      $$type: 'Deploy',
      queryId: 0n,
    },
  );

  await provider.waitForDeploy(crowdSale.address);
}
