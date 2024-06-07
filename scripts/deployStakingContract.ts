import type { NetworkProvider } from '@ton/blueprint';
import { getHRDroneJetton, isContractDeployed } from '../utils/contract';
import { StakingContract } from '../build/StakingContract/tact_StakingContract';
import { Address, contractAddress, fromNano, toNano } from '@ton/core';
import { JettonMaster } from '@ton/ton';

export async function run(provider: NetworkProvider, _args: string[]) {
  // const ui = provider.ui();

  const deployer = provider.sender();
  const deployAmount = toNano('0.1');

  const stakingInit = provider.open(await StakingContract.fromInit(deployer.address!, 15_000n));
  const jetton_client = provider.open(getHRDroneJetton());
  const jettonWallet_stakingContract = await jetton_client.getGetWalletAddress(stakingInit.address);

  // send a message on new address contract to deploy it
  const seqno: number = await deployer_contract.getSeqno();
  const balance: bigint = await deployer_contract.getBalance();
  console.log('Current deployment wallet balance =', fromNano(balance).toString(), '💎TON');
  printSeparator();
  console.log('Deploying the Staking Contract:');
  console.log('1) Jetton Minter: ' + jettonMaster_address);
  console.log('\n');
  console.log('2) Owner(aka. Deployer): ' + deployer.address);
  console.log('\n');

  // the TL-B Message that we are preparing to pass to the contract
  const packed = beginCell()
    .store(
      storeAddingJettonAddress({
        $$type: 'AddingJettonAddress',
        this_contract_jettonWallet: jettonWallet_stakingContract,
      }),
    )
    .endCell();

  await deployer_contract.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        to: stakingContract,
        value: deployAmount,
        init: {
          code: stakingInit.code,
          data: stakingInit.data,
        },
        body: packed,
      }),
    ],
  });
  console.log('====== Message sending to Staking Contract=======');
  console.log('\n' + stakingContract);


  await isContractDeployed(provider, hRDroneJetton.address);
  const owner = provider.sender();

  const openedHRDroneJetton = provider.open(hRDroneJetton);

  await openedHRDroneJetton.send(
    owner,
    {
      value: toNano('0.05'),
    },
    {
      $$type: 'TokenBurnNotification',
      amount: 1n,
      queryId: 1n,
      owner: owner.address!,
      response_destination: owner.address!,
    },
  );
}
