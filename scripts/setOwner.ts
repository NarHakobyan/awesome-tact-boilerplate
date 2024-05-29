import type { NetworkProvider } from '@ton/blueprint';
import { Address, toNano } from '@ton/core';

import { BanksCrowdSaleV2 } from '../build/BanksCrowdSaleV2/tact_BanksCrowdSaleV2';

export async function run(provider: NetworkProvider, args: string[]) {
  const ui = provider.ui();

  const address = Address.parse(process.env.BANKS_CROWDSALE_ADDRESS!);

  if (!(await provider.isContractDeployed(address))) {
    ui.write(`Error: Contract at address ${address} is not deployed!`);

    return;
  }

  // const addressBuyer = Address.parse('EQDOQbS74Sn-sGojYfUK6Uknlg8t1CdNjG-5VJx5VIO2zNms');
  // const addressBuyer = Address.parse(args.length > 0 ? args[0] : await ui.input('Buyer address'));

  const cs = provider.open(BanksCrowdSaleV2.fromAddress(address));
  const ownBefore = await cs.getOwner();
  console.log('ownBefore', ownBefore);

  const newOwner = Address.parse(args.length > 0 ? args[0] : await ui.input('NewOwner  address'));

  await cs.send(
    provider.sender(),
    {
      value: toNano('0.005'),
    },
    {
      $$type: 'ChangeOwner',
      queryId: 0n,
      newOwner,
    },
  );

  const newOwns = await cs.getOwner();
  console.log('newOwns', newOwns);
  // ui.write('banks at address ${addressBuyer} = ${counterBefore}');
}
