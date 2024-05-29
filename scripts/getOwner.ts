import type { NetworkProvider } from '@ton/blueprint';
import { Address } from '@ton/core';

import { CrowdSale } from '../build/CrowdSale/tact_CrowdSale';

export async function run(provider: NetworkProvider, _args: string[]) {
  const ui = provider.ui();

  const address = Address.parse(process.env.CROWDSALE_ADDRESS!);

  if (!(await provider.isContractDeployed(address))) {
    ui.write(`Error: Contract at address ${address} is not deployed!`);

    return;
  }
  // const addressBuyer = Address.parse('EQDOQbS74Sn-sGojYfUK6Uknlg8t1CdNjG-5VJx5VIO2zNms');
  // const addressBuyer = Address.parse(args.length > 0 ? args[0] : await ui.input('Buyer address'));

  const cs = provider.open(CrowdSale.fromAddress(address));

  const counterBefore = await cs.getOwner();
  console.log(counterBefore);
  // ui.write('banks at address ${addressBuyer} = ${counterBefore}');
}
