// Deploys NFT Collection contract + deploys Nexton core contract, funds it + changes NFT contract owner address

import type { NetworkProvider } from '@ton/blueprint';
import { compile } from '@ton/blueprint';
import { Address, toNano } from '@ton/core';

import { NexTon } from '../wrappers/NexTon';
import { NftCollection } from '../wrappers/NftCollection';
import { buildCollectionContentCell } from './collectionContent/onChain';

const myAddress: Address = Address.parse('kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu');
const NextonOwner = Address.parse('UQABinqGRk8nJQcyRJqRI_ae4Wr9QW4SPoDQaTEy7TSmn0Yd');

export async function run(provider: NetworkProvider) {
  const randomSeed = Math.floor(Math.random() * 10_000);
  const ui = provider.ui();

  // Deploying Collection !!!

  const collection = provider.open(
    NftCollection.createFromConfig(
      {
        ownerAddress: provider.sender().address!,
        nextItemIndex: 0,
        collectionContent: buildCollectionContentCell({
          name: 'NexTon Liquid Derivatives',
          description: 'Collection of liquidity staking derivatives, issued by NexTon',
          image: 'https://raw.githubusercontent.com/Nex-TON/Nexton_Contracts/main/Nexton_Logo.jpg',
          social_links: [
            'https://twitter.com/NextonNode',
            'https://www.nexton.solutions/',
            'https://t.me/nextonglobal',
          ],
        }),
        nftItemCode: await compile('NftItem'),
        royaltyParams: {
          royaltyFactor: 50,
          royaltyBase: 1000,
          royaltyAddress: myAddress,
        },
      },
      await compile('NftCollection'),
    ),
  );

  await collection.sendDeploy(provider.sender(), toNano('0.2'));

  await provider.waitForDeploy(collection.address);

  // Deploying Nexton !!!

  const nexton = provider.open(await NexTon.fromInit(await compile('NftItem'), collection.address));

  await nexton.send(
    provider.sender(),
    {
      value: toNano('0.1'),
    },
    {
      $$type: 'Deploy',
      queryId: 0n,
    },
  );

  await provider.waitForDeploy(nexton.address);

  // Funding
  await nexton.send(
    provider.sender(),
    {
      value: toNano('0.5'),
    },
    null,
  );
  ui.write('Nexton funded !!!');

  // Changing owner !!!

  await collection.sendChangeOwner(provider.sender(), {
    value: toNano('0.11'),
    newOwnerAddress: nexton.address,
    queryId: BigInt(Date.now()),
  });

  ui.write('Collection owner changed !!!');

  //const collectionData = await collection.getData(provider.sender());
}
