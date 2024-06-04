import { DEX, pTON } from '@ston-fi/sdk';
import type { NetworkProvider } from '@ton/blueprint';
import { Address } from '@ton/core';
import TonWeb from 'tonweb';

import { BanksCrowdSaleV2 } from '../build/BanksCrowdSaleV2/tact_BanksCrowdSaleV2';

export async function run(provider: NetworkProvider, _args: string[]) {
  console.log('USE DEEPLINK TO TRANZACT!');
  const ui = provider.ui();

  const address = Address.parse(process.env.BANKS_CROWD_SALE_ADDRESS!);

  if (!(await provider.isContractDeployed(address))) {
    ui.write(`Error: Contract at address ${address} is not deployed!`);

    return;
  }

  const router = new DEX.v1.Router({
    tonApiClient: new TonWeb.HttpProvider(),
  });

  // swap 1 TON to STON but not less than 1 nano STON
  const txParams = await router.buildSwapTonToJettonTxParams({
    userWalletAddress: provider.sender().address!, // ! replace with your address
    proxyTonAddress: pTON.v1.address,
    offerAmount: new TonWeb.utils.BN('1000000000'),
    askJettonAddress: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO', // STON
    minAskAmount: new TonWeb.utils.BN('1'),
    queryId: 12_345,
  });

  // To execute the transaction, you need to send a transaction to the blockchain.
  // This code will be different based on the wallet you are using to send the tx from
  // logging is used for demonstration purposes
  console.log({
    to: txParams.to,
    amount: txParams.gasAmount,
    payload: txParams.payload,
  });

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
