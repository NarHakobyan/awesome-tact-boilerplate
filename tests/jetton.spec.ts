import { ContractSystem } from '@tact-lang/emulator';

describe('jetton', () => {
  it('should deploy', async () => {
    // Create jetton
    const system = await ContractSystem.create();
    const owner = system.treasure('owner');

    const contract = system.open(await SampleJetton.fromInit(owner.address, null));
    const tracker = system.track(contract.address);

    // Mint
    await contract.send(owner, { value: toNano(1) }, { $$type: 'Mint', amount: toNano(1_000_000) });
    await system.run();
    expect(tracker.events()).toMatchSnapshot();

    // Check owner
    expect((await contract.getOwner()).toString()).toEqual(owner.address.toString());

    // Data
    const data = await contract.getGetJettonData();
    // console.warn(data);
  });
});
