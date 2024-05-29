import * as dotenv from 'dotenv';
import { Address, beginCell, contractAddress, fromNano, internal, toNano, TonClient4, WalletContractV4 } from 'ton';
import { mnemonicToPrivateKey } from 'ton-crypto';

import { deploy } from './utils/deploy';
import { buildOnchainMetadata } from './utils/jetton-helpers';
import { printAddress, printDeploy, printHeader, printSeparator } from './utils/print';

dotenv.config();
// ========================================
import { SampleJetton, storeTokenTransfer } from './output/SampleJetton_SampleJetton';
// ========================================

const NewOnwer_Address = Address.parse(''); // 🔴 Owner should usually be the deploying wallet's address.

(async () => {
  const client4 = new TonClient4({
    //create client for testnet sandboxv4 API - alternative endpoint
    endpoint: 'https://sandbox-v4.tonhubapi.com',
  });

  const mnemonics = (process.env.mnemonics || '').toString(); // 🔴 Change to your own, by creating .env file!
  const keyPair = await mnemonicToPrivateKey(mnemonics.split(' '));
  const secretKey = keyPair.secretKey;
  const workchain = 0;
  const wallet = WalletContractV4.create({
    workchain,
    publicKey: keyPair.publicKey,
  });

  const wallet_contract = client4.open(wallet);
  const jettonParams = {
    name: 'Test Token Name',
    description: 'This is description of Test Jetton Token in Tact-lang',
    symbol: 'TTN',
    image: 'https://avatars.githubusercontent.com/u/104382459?s=200&v=4',
  };

  // Create content Cell
  const content = buildOnchainMetadata(jettonParams);
  const max_supply = toNano('666.123456789'); // 🔴 Set the specific total supply in nano

  // Compute init data for deployment
  // NOTICE: the parameters inside the init functions were the input for the contract address
  // which means any changes will change the smart contract address as well.
  const init = await SampleJetton.init(wallet_contract.address, content, max_supply);
  const jetton_masterWallet = contractAddress(workchain, init);
  const contract_dataFormat = SampleJetton.fromAddress(jetton_masterWallet);
  const contract = client4.open(contract_dataFormat);
  const jetton_wallet = await contract.getGetWalletAddress(wallet_contract.address);
  console.log('✨ ' + wallet_contract.address + "'s JettonWallet ==> ");

  // ✨Pack the forward message into a cell
  const test_message_left = beginCell()
    .storeBit(0) // 🔴  whether you want to store the forward payload in the same cell or not. 0 means no, 1 means yes.
    .storeUint(0, 32)
    .storeBuffer(Buffer.from('Hello, GM -- Left.', 'utf-8'))
    .endCell();

  // const test_message_right = beginCell()
  //     .storeBit(1) // 🔴 whether you want to store the forward payload in the same cell or not. 0 means no, 1 means yes.
  //     .storeRef(beginCell().storeUint(0, 32).storeBuffer(Buffer.from("Hello, GM. -- Right", "utf-8")).endCell())
  //     .endCell();

  // ========================================
  const forward_string_test = beginCell().storeBit(1).storeUint(0, 32).storeStringTail('EEEEEE').endCell();
  const packed = beginCell()
    .store(
      storeTokenTransfer({
        $$type: 'TokenTransfer',
        query_id: 0n,
        amount: toNano(20_000),
        destination: NewOnwer_Address,
        response_destination: wallet_contract.address, // Original Owner, aka. First Minter's Jetton Wallet
        custom_payload: forward_string_test,
        forward_ton_amount: toNano('0.000000001'),
        forward_payload: test_message_left,
      }),
    )
    .endCell();

  const deployAmount = toNano('0.3');
  const seqno: number = await wallet_contract.getSeqno();
  const balance: bigint = await wallet_contract.getBalance();
  // ========================================
  printSeparator();
  console.log('Current deployment wallet balance:', fromNano(balance).toString(), '💎TON');
  console.log('\n🛠️ Calling To JettonWallet:\n' + jetton_wallet + '\n');
  await wallet_contract.sendTransfer({
    seqno,
    secretKey,
    messages: [
      internal({
        to: jetton_wallet,
        value: deployAmount,
        init: {
          code: init.code,
          data: init.data,
        },
        bounce: true,
        body: packed,
      }),
    ],
  });
})();
