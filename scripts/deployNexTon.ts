// Deploys NFT Collection contract + deploys Nexton core contract, funds it + changes NFT contract owner address

import type { NetworkProvider } from '@ton/blueprint';
import { compile } from '@ton/blueprint';
import { Address, toNano } from '@ton/core';

import { NexTon } from '../build/NexTon/tact_NexTon';
import { NftCollection } from '../build/NftCollection/tact_NftCollection';
import { buildCollectionContentCell } from './collectionContent/onChain';

const myAddress: Address = Address.parse('kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu');

export async function run(provider: NetworkProvider) {
  const ui = provider.ui();

  const collection = provider.open(
    await NftCollection.fromInit({
      $$type: 'NftCollectionData',
      owner: provider.sender().address!,
      next_item_index: 0n,
      content: buildCollectionContentCell({
        name: 'NexTon Liquid Derivatives',
        description: 'Collection of liquidity staking derivatives, issued by NexTon',
        image: 'https://raw.githubusercontent.com/Nex-TON/Nexton_Contracts/main/Nexton_Logo.jpg',
        social_links: ['https://twitter.com/NextonNode', 'https://www.nexton.solutions/', 'https://t.me/nextonglobal'],
      }),
      royalty_params: {
        $$type: 'RoyaltyParams',
        denominator: 1000n,
        destination: myAddress,
        numerator: 350n,
      },
    }),
  );

  await collection.send(
    provider.sender(),
    {
      value: toNano('0.2'),
    },
    {
      $$type: 'Deploy',
      queryId: 0n,
    },
  );

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
      queryId: 1n,
    },
  );

  await provider.waitForDeploy(nexton.address);

  // Funding
  await nexton.send(
    provider.sender(),
    {
      value: toNano('15'),
    },
    null,
  );
  ui.write('Nexton funded !!!');

  // Changing owner !!!

  await collection.send(
    provider.sender(),
    {
      value: toNano('0.11'),
    },
    {
      $$type: 'ChangeOwner',
      newOwner: nexton.address,
      queryId: 2n,
    },
  );

  ui.write('Collection owner changed !!!');

  //const collectionData = await collection.getData(provider.sender());
}
