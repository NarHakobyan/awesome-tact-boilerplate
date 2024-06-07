import type { NetworkProvider } from '@ton/blueprint';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { beginCell, contractAddress, fromNano, internal, toNano, TonClient4, WalletContractV4 } from '@ton/ton';

import { NftCollection } from '../build/NftCollection/tact_NftCollection';
import { isContractDeployed } from '../utils/contract';

export async function run(provider: NetworkProvider, _args: string[]) {
  // const ui = provider.ui();

  // Create client for testnet sandboxv4 API - alternative endpoint
  const client4 = new TonClient4({
    endpoint: 'https://sandbox-v4.tonhubapi.com', // Test-net
  });

  // Parameters for NFTs
  const OFFCHAIN_CONTENT_PREFIX = 0x01;
  const stringFirst = 'https://s.getgems.io/nft-staging/c/628f6ab8077060a7a8d52d63/'; // Change to the content URL you prepared
  const newContent = beginCell().storeInt(OFFCHAIN_CONTENT_PREFIX, 8).storeStringRefTail(stringFirst).endCell();

  const owner = provider.sender().address!;

  // Prepare the initial code and data for the contract
  const init = await NftCollection.fromInit({
    $$type: 'NftCollectionData',
    owner,
    next_item_index: 0n,
    content: newContent,
    royalty_params: {
      $$type: 'RoyaltyParams',
      numerator: 350n, // 350n = 35%
      denominator: 1000n,
      destination: owner,
    },
  });
  const deployContract = contractAddress(0, init);
  // ========================================
  const packed = beginCell().storeUint(0, 32).storeStringTail('Mint').endCell();
  // ========================================
  const deployAmount = toNano('0.3');
  const seqno: number = await wallet_contract.getSeqno();
  const balance: bigint = await wallet_contract.getBalance();
  // ========================================
  console.log('Current deployment wallet balance:', fromNano(balance).toString(), '💎TON');
  printSeparator();
  console.log('Deploying contract to address:', deployContract);
  await wallet_contract.sendTransfer({
    seqno,
    secretKey,
    messages: [
      internal({
        to: deployContract,
        value: deployAmount,
        init: { code: init.code, data: init.data },
        bounce: true,
        body: packed,
      }),
    ],
  });

  const collection_client = client4.open(NftCollection.fromAddress(deployContract));
  const latest_indexId = (await collection_client.getGetCollectionData()).next_item_index;
  console.log('Latest indexID:[', latest_indexId, ']');
  const item_address = await collection_client.getGetNftAddressByIndex(latest_indexId);
  console.log('Minting NFT Item:', item_address);

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
