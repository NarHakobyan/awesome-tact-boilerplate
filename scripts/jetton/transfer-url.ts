import { Address, beginCell, Cell, contractAddress, toNano, TonClient4 } from 'ton';
import { ContractSystem, testAddress } from 'ton-emulator';

import { JettonDefaultWallet, storeTokenTransfer } from './output/SampleJetton_JettonDefaultWallet';
import { SampleJetton } from './output/SampleJetton_SampleJetton';
import { deploy } from './utils/deploy';
import { buildOnchainMetadata } from './utils/jetton-helpers';
import { printAddress, printDeploy, printHeader, printSeparator } from './utils/print';

// 🔴 Jetton Root Address
const jetton_minter_root = Address.parse('');

// 🔴 the caller address that who wants to transfer the jetton(the person who will click the URL)
const caller_wallet_address = Address.parse('');

// 🔴 The Address of new Owner WalletV4 Address
const new_owner_Address = Address.parse('');

(async () => {
  const contract_address = await SampleJetton.fromAddress(jetton_minter_root);

  // Get the Jetton Wallet Address of the deployer
  const target_jetton_wallet_init = await JettonDefaultWallet.init(contract_address.address, caller_wallet_address);

  // Get the Jetton Wallet Address of the new owner
  const new_owner_jetton_wallet = await JettonDefaultWallet.fromInit(contract_address.address, new_owner_Address);
  printSeparator();

  // ✨Pack the forward message into a cell
  const test_message = beginCell()
    .storeBit(1)
    .storeRef(beginCell().storeUint(0, 32).storeBuffer(Buffer.from('Hello, GM. -- Right', 'utf-8')).endCell())
    .endCell();

  const deployAmount = toNano('0.3');
  const packed = beginCell()
    .store(
      storeTokenTransfer({
        $$type: 'TokenTransfer',
        query_id: 0n,
        amount: toNano(1),
        destination: new_owner_jetton_wallet.address,
        response_destination: caller_wallet_address, // Original Owner, aka. First Minter's Jetton Wallet
        custom_payload: null,
        forward_ton_amount: toNano('0.000000001'),
        forward_payload: test_message,
      }),
    )
    .endCell();
  printHeader('Write Contract');
  printAddress(contract_address.address);

  // printDeploy(init, deployAmount, packed);
  await deploy(target_jetton_wallet_init, deployAmount, packed);
})();
