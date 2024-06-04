import type { NetworkProvider } from '@ton/blueprint';
import { Address, toNano } from '@ton/core';

import { HRDroneJetton } from '../build/HRDroneJetton/tact_HRDroneJetton';
import { isContractDeployed } from '../utils/contract';

export async function run(provider: NetworkProvider, _args: string[]) {
  const ui = provider.ui();
  const address = Address.parse(process.env.HRDRONE_TOKEN_ADDRESS!);

  await isContractDeployed(provider, address);

  const amount = Number.parseInt(await ui.input('Amount: '), 10);

  const contract = provider.open(HRDroneJetton.fromAddress(address));

  const sender = provider.sender();

  await contract.send(
    sender,
    {
      value: toNano('0.5'),
    },
    {
      $$type: 'Mint',
      amount: toNano(amount),
      receiver: sender.address!,
    },
  );
  ui.write(`Minted: ${amount} to address ${sender.address!}`);
}
