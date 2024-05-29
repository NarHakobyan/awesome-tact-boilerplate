import { HRDroneJetton } from './../../build/Jetton/tact_HRDroneJetton';
import { Address, beginCell, contractAddress, fromNano, internal, toNano } from '@ton/core';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { TonClient, TonClient4, WalletContractV4 } from '@ton/ton';

import { HRDroneJetton } from '../../build/Jetton/tact_HRDroneJetton';
import { buildOnchainMetadata } from './utils/jetton-helpers';

async function main() {
  //need changes for jetton

  //create client for testnet Toncenter API
  const client = new TonClient({
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    apiKey: 'bb38df0c2756c66e2ab49f064e2484ec444b01244d2bd49793bd5b58f61ae3d2',
  });

  //create client for testnet sandboxv4 API - alternative endpoint
  const client4 = new TonClient4({
    endpoint: 'https://sandbox-v4.tonhubapi.com',
  });

  // Insert your test wallet's 24 words, make sure you have some test Toncoins on its balance. Every deployment spent 0.5 test toncoin.
  const mnemonics =
    'multiply voice predict admit hockey fringe flat bike napkin child quote piano year cloud bundle lunch curtain flee crouch injury accuse leisure tray danger';
  // read more about wallet apps https://ton.org/docs/participate/wallets/apps#tonhub-test-environment

  const keyPair = await mnemonicToPrivateKey(mnemonics.split(' '));
  const secretKey = keyPair.secretKey;
  //workchain = 1 - masterchain (expensive operation cost, validator's election contract works here)
  //workchain = 0 - basechain (normal operation cost, user's contracts works here)
  const workchain = 0; //we are working in basechain.

  //Create deployment wallet contract
  const wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
  const contract = client4.open(wallet);

  // Get deployment wallet balance
  const balance: bigint = await contract.getBalance();

  // This is example data - Modify these params for your own jetton
  // - Data is stored on-chain (except for the image data itself)

  const jettonParams = {
    name: 'HRDroneJetton',
    description: 'HR Drone Jetton is a token for HR Drone services. It is used to pay for the services of HR Drone.',
    image: 'https://ipfs.io/ipfs/QmbPZjC1tuP6ickCCBtoTCQ9gc3RpkbKx7C1LMYQdcLwti', // Image url
  };

  // Owner should usually be the deploying wallet's address.
  const owner = Address.parse('EQDND6yHEzKB82ZGRn58aY9Tt_69Ie_uz73e2VuuJ3fVVXfV');

  // Create content Cell
  const content = buildOnchainMetadata(jettonParams);

  // Compute init data for deployment
  const init = await SampleJetton.init(owner, content);
  const destination_address = contractAddress(workchain, init);

  const deployAmount = toNano('1');
  const supply = toNano(500); // specify total supply in nano

  // send a message on new address contract to deploy it
  const seqno: number = await contract.getSeqno();

  //TL-B mint#01fb345b amount:int257 = Mint
  const msg = beginCell().storeBuffer(Buffer.from('01fb345b', 'hex')).storeInt(supply, 257).endCell();

  console.log('🛠️Preparing new outgoing massage from deployment wallet. Seqno =', seqno);
  console.log('Current deployment wallet balance =', fromNano(balance).toString(), '💎TON');
  console.log('Total supply for the deployed jetton =', fromNano(supply));
  await contract.sendTransfer({
    seqno,
    secretKey,
    messages: [
      internal({
        value: deployAmount,
        to: destination_address,
        init: {
          code: init.code,
          data: init.data,
        },
        body: msg,
      }),
    ],
  });
  console.log('======deployment message sent to', destination_address, '======');
}

main();
