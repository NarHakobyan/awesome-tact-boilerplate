import type { NetworkProvider } from '@ton/blueprint';
import { toNano } from '@ton/core';
import { NftCollection } from '../build/NftCollection/tact_NftCollection';

export async function run(provider: NetworkProvider) {
  const nftCollection = provider.open(await NftCollection.fromInit());

  await nftCollection.send(
    provider.sender(),
    {
      value: toNano('0.05'),
    },
    {
      $$type: 'Deploy',
      queryId: 0n,
    },
  );

  await provider.waitForDeploy(nftCollection.address);

  // run methods on `nftCollection`
}
