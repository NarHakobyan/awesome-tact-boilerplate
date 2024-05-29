import type { NetworkProvider } from '@ton/blueprint';
import { Address } from '@ton/core';

import { BanksCrowdSaleV2 } from '../build/BanksCrowdSaleV2/tact_BanksCrowdSaleV2';

export async function run(provider: NetworkProvider, args: string[]) {
  console.log('USE DEEPLINK TO TRANZACT!');
  const ui = provider.ui();

  const address = Address.parse(process.env.BANKS_CROWDSALE_ADDRESS!);

  if (!(await provider.isContractDeployed(address))) {
    ui.write(`Error: Contract at address ${address} is not deployed!`);

    return;
  }

  const cs = provider.open(BanksCrowdSaleV2.fromAddress(address));
  const ownBefore = await cs.getOwner();

  console.log('owner', ownBefore);

  const addressBuyer = Address.parse(args.length > 0 ? args[0] : await ui.input('Buyer address'));

  const counterBefore = await cs.getBanks(addressBuyer);

  console.log('counterBefore', counterBefore);

  // await cs.send(
  //     provider.sender(),
  //     {
  //         value: toNano('0.005'),
  //     },
  //     {
  //         $$type: 'Bonus',
  //         // queryId: 0n,
  //         to: addressBuyer,
  //         amount: 1n
  //     }
  // );

  const after = await cs.getBanks(addressBuyer);

  console.log('counterafter', after);
}
