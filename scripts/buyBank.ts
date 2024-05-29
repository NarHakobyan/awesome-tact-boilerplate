import type { NetworkProvider } from '@ton/blueprint';
import { sleep } from '@ton/blueprint';
import { Address, toNano } from '@ton/core';

import { CrowdSale } from '../build/CrowdSale/tact_CrowdSale';

export async function run(provider: NetworkProvider, _args: string[]) {
  const ui = provider.ui();

  const crowdSaleAddress = Address.parse(process.env.CROWD_SALE_ADDRESS!);

  if (!(await provider.isContractDeployed(crowdSaleAddress))) {
    ui.write(`Error: Contract at address ${crowdSaleAddress} is not deployed!`);

    return;
  }

  const addressBuyer = provider.sender().address!;
  // args.length > 0 ? args[0] : await ui.input('Buyer address'));

  const cs = provider.open(CrowdSale.fromAddress(crowdSaleAddress));

  const counterBefore = await cs.getSomeoneBanksBalance(addressBuyer);
  ui.write(`addressBuyer: ${addressBuyer}, counterBefore: ${counterBefore}`);

  await cs.send(
    provider.sender(),
    {
      value: toNano('0.1'),
    },
    {
      $$type: 'ReferralAddress',
      referral: Address.parse('UQDZgMyua0lf9WqEK1YRuMwH6vPnwDZ8i_i0XUtVwD2VvfnM'),
    },
  );

  ui.write('Waiting for counter to increase...');

  let counterAfter = await cs.getSomeoneBanksBalance(addressBuyer);
  let attempt = 1;

  while (counterAfter === counterBefore) {
    ui.setActionPrompt(`Attempt ${attempt}`);
    await sleep(2000);
    counterAfter = await cs.getSomeoneBanksBalance(addressBuyer);
    attempt++;
  }

  ui.write(`banks at address ${addressBuyer} = ${counterAfter}`);

  ui.clearActionPrompt();
  ui.write('Counter increased successfully!');
}
