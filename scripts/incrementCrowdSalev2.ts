import type { NetworkProvider } from '@ton/blueprint';
import { sleep } from '@ton/blueprint';
import { Address, toNano } from '@ton/core';

import { CrowdSalev2 } from '../build/CrowdSalev2/tact_CrowdSalev2';

export async function run(provider: NetworkProvider, args: string[]) {
  const ui = provider.ui();

  const address = Address.parse(process.env.CROWDSALEV2_ADDRESS!);

  if (!(await provider.isContractDeployed(address))) {
    ui.write(`Error: Contract at address ${address} is not deployed!`);

    return;
  }

  const crowdSalev2 = provider.open(CrowdSalev2.fromAddress(address));

  const counterBefore = await crowdSalev2.getCounter();

  await crowdSalev2.send(
    provider.sender(),
    {
      value: toNano('0.05'),
    },
    {
      $$type: 'Add',
      queryId: 0n,
      amount: 1n,
    },
  );

  ui.write('Waiting for counter to increase...');

  let counterAfter = await crowdSalev2.getCounter();
  let attempt = 1;

  while (counterAfter === counterBefore) {
    ui.setActionPrompt(`Attempt ${attempt}`);
    await sleep(2000);
    counterAfter = await crowdSalev2.getCounter();
    attempt++;
  }

  ui.clearActionPrompt();
  ui.write('Counter increased successfully!');
}
