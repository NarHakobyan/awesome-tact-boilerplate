import type { NetworkProvider } from '@ton/blueprint';
import { toNano } from '@ton/core';

import { BanksCrowdSaleV2 } from '../build/BanksCrowdSaleV2/tact_BanksCrowdSaleV2';

export async function run(provider: NetworkProvider) {
  const banksCrowdSaleV2 = provider.open(await BanksCrowdSaleV2.fromInit());

  await banksCrowdSaleV2.send(
    provider.sender(),
    {
      value: toNano('0.05'),
    },
    {
      $$type: 'Deploy',
      queryId: 0n,
    },
  );

  await provider.waitForDeploy(banksCrowdSaleV2.address);
}
