import type { NetworkProvider } from '@ton/blueprint';
import { beginCell, toNano } from '@ton/core';

import { NftCollection } from '../build/NftCollection/tact_NftCollection';
import { NftItem } from '../build/NftCollection/tact_NftItem';

export async function run(provider: NetworkProvider) {
  const OFFCHAIN_CONTENT_PREFIX = 0x01;
  const stringFirst = 'https://s.getgems.io/nft-staging/c/628f6ab8077060a7a8d52d63/'; // Change to the content URL you prepared
  const newContent = beginCell().storeInt(OFFCHAIN_CONTENT_PREFIX, 8).storeStringRefTail(stringFirst).endCell();

  // ===== Parameters =====
  // Replace owner with your address
  const owner = provider.sender();

  // Prepare the initial code and data for the contract
  const init = await NftCollection.init(owner, newContent, {
    $$type: 'RoyaltyParams',
    numerator: 350n, // 350n = 35%
    denominator: 1000n,
    destination: owner,
  });

  const address = contractAddress(0, init);
  const deployAmount = toNano('0.15');
  const testnet = true;

  // The Transaction body we want to pass to the smart contract
  const body = beginCell().storeUint(0, 32).storeStringTail('Mint').endCell();

  // Do deploy
  await deploy(init, deployAmount, body, testnet);
  printHeader('sampleNFT_Contract');
  printAddress(address);

  const nftItem = provider.open(await NftCollection.fromInit());

  await nftItem.send(
    provider.sender(),
    {
      value: toNano('0.05'),
    },
    {
      $$type: 'RoyaltyParams',
      numerator: 350n, // 350n = 35%
      denominator: 1000n,
      destination: owner,
    },
  );

  await provider.waitForDeploy(nftItem.address);

  // run methods on `nftItem`
}
