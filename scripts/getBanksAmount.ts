import type { NetworkProvider } from '@ton/blueprint';
import { Address } from '@ton/core';

import { CrowdSale } from '../build/CrowdSale/tact_CrowdSale';

export async function run(provider: NetworkProvider, _args: string[]) {
  const ui = provider.ui();

  // const address = Address.parse('EQByVJjaA9EM8SzoApOuF0eE2USMNB2kT8ZlMV1TmWLfhgLe');
  const address = Address.parse(process.env.CROWD_SALE_ADDRESS!);

  if (!(await provider.isContractDeployed(address))) {
    ui.write(`Error: Contract at address ${address} is not deployed!`);

    return;
  }

  // const addressBuyer = Address.parse('EQDOQbS74Sn-sGojYfUK6Uknlg8t1CdNjG-5VJx5VIO2zNms');
  const addressBuyer = provider.sender().address!;

  const cs = provider.open(CrowdSale.fromAddress(address));

  const counterBefore = await cs.getSomeoneBanksBalance(addressBuyer);
  ui.write(`banks at address ${addressBuyer} = ${counterBefore}`);
}
