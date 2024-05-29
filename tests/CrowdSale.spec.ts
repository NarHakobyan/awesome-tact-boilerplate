import '@ton/test-utils';

import type { SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Blockchain } from '@ton/sandbox';
// import { toNano } from '@ton/core';
import { toNano } from '@ton/ton';

import { CrowdSale } from '../build/CrowdSale/tact_CrowdSale';

describe('CrowdSale', () => {
  let blockchain: Blockchain;
  let deployer: SandboxContract<TreasuryContract>;
  let crowdSale: SandboxContract<CrowdSale>;
  const unlockDate = 0n; //UnixTime
  //   const owner = Address.parse('UQAsB6vBUeSPdQ_XnIrTt8psWXpxdcJmCKVgyuDQYr8B2HQg');

  beforeEach(async () => {
    blockchain = await Blockchain.create();

    crowdSale = blockchain.openContract(
      await CrowdSale.fromInit(
        unlockDate, //: Int,
        //  owner, //: Address */
      ),
    );

    deployer = await blockchain.treasury('deployer');

    const deployResult = await crowdSale.send(
      deployer.getSender(),
      {
        value: toNano('0.05'),
      },
      {
        $$type: 'Deploy',
        queryId: 0n,
      },
    );

    expect(deployResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: crowdSale.address,
      deploy: true,
      success: true,
    });
  });

  it('should deploy', async () => {
    // the check is done inside beforeEach
    // blockchain and crowdSale are ready to use
  });

  it('buy bank default', async () => {
    const counterBefore = await crowdSale.getSomeoneBanksBalance(deployer.address);

    await crowdSale.send(
      // provider.sender(),
      deployer.getSender(),
      {
        value: toNano('0.1'),
      },
      null,
    );

    const counterAfter = await crowdSale.getSomeoneBanksBalance(deployer.address);
    expect(counterAfter !== counterBefore);
    // let attempt = 1;
    // while (counterAfter === counterBefore) {
    //     ui.setActionPrompt(`Attempt ${attempt}`);
    //     await sleep(2000);
    //     counterAfter = await cs.getSomeoneBanksBalance(addressBuyer);
    //     attempt++;
  });

  it('buy bank  mess buyBank', async () => {
    const counterBefore = await crowdSale.getSomeoneBanksBalance(deployer.address);

    await crowdSale.send(
      // provider.sender(),
      deployer.getSender(),
      {
        value: toNano('0.1'),
      },
      'buyBank',
    );

    const counterAfter = await crowdSale.getSomeoneBanksBalance(deployer.address);
    expect(counterAfter !== counterBefore);
    // let attempt = 1;
    // while (counterAfter === counterBefore) {
    //     ui.setActionPrompt(`Attempt ${attempt}`);
    //     await sleep(2000);
    //     counterAfter = await cs.getSomeoneBanksBalance(addressBuyer);
    //     attempt++;
  });

  it('buy bank with referal', async () => {
    const counterBefore = await crowdSale.getSomeoneBanksBalance(deployer.address);

    await crowdSale.send(
      // provider.sender(),
      deployer.getSender(),
      {
        value: toNano('0.1'),
      },
      {
        $$type: 'ReferralAddress',
        referral: deployer.address,
        // queryId: 0n,
        // amount: 1n,
      },
    );

    const counterAfter = await crowdSale.getSomeoneBanksBalance(deployer.address);
    expect(counterAfter !== counterBefore);
    // let attempt = 1;
    // while (counterAfter === counterBefore) {
    //     ui.setActionPrompt(`Attempt ${attempt}`);
    //     await sleep(2000);
    //     counterAfter = await cs.getSomeoneBanksBalance(addressBuyer);
    //     attempt++;
  });
});
