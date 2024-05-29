import type { NetworkProvider } from '@ton/blueprint';
import { toNano } from '@ton/core';

import { CrowdSalev2 } from '../build/CrowdSalev2/tact_CrowdSalev2';

export async function run(provider: NetworkProvider) {
  const ui = provider.ui();
  const crowdSalev2 = provider.open(await CrowdSalev2.fromInit(BigInt(Math.floor(Math.random() * 10_000))));

  await crowdSalev2.send(
    provider.sender(),
    {
      value: toNano('0.05'),
    },
    {
      $$type: 'Deploy',
      queryId: 0n,
    },
  );

  await provider.waitForDeploy(crowdSalev2.address);

  ui.write(`Address: ${crowdSalev2.address}`);

  const senderAddress = provider.sender().address!;

  ui.write(`getBanker: ${await crowdSalev2.getBanker(senderAddress)}`);
  ui.write(`getBanks: ${await crowdSalev2.getBanks(senderAddress)}`);
  ui.write(`getCoins: ${await crowdSalev2.getCoins(senderAddress)}`);
  ui.write(`getOwner: ${await crowdSalev2.getOwner()}`);

  ui.write(`getAccounts: ${JSON.stringify(await crowdSalev2.getAccounts())}`);
}
