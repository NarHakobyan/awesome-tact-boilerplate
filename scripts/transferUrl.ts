import { Address, beginCell, Cell, contractAddress, toNano } from '@ton/core';

import { StakingContract, storeTokenTransfer } from './output/SampleJetton_StakingContract';
import { deploy } from './utils/deploy';
// import { ContractSystem, testAddress } from "ton-emulator";
// import { buildOnchainMetadata } from "./utils/jetton-helpers";
import { printAddress, printDeploy, printHeader, printURL_Address, printWrite } from './utils/print';

const deploy_address = Address.parse('EQD1ptyvitBi3JbHaDQt_6j-15ABn9BqdABTFA1vgzs3Ae6z'); // The deployer wallet address from mnemonics

(async () => {
  const client = new TonClient4({
    endpoint: 'https://sandbox-v4.tonhubapi.com',
  });

  // Get Staking Contract
  const jetton_masterWallet = Address.parse(''); // 🔴 Change to your own

  const staking_init = await StakingContract.init(jetton_masterWallet, deploy_address, 15_000n);
  const stakingContract_address = contractAddress(0, staking_init);

  // 🔴🔴🔴 The Wallet Address that preparing to send the Jetton for staking!
  const the_wallet_that_will_call_the_URL = Address.parse('');

  const client_jettonMaster = client.open(await new JettonMaster(jetton_masterWallet));
  const jetton_wallet = await client_jettonMaster.getWalletAddress(the_wallet_that_will_call_the_URL);

  console.log('================================================================');
  // let emptyCell = new Cell();
  const packed_stake = beginCell().storeUint(300, 64).endCell();
  const deployAmount = toNano('0.35');
  const packed = beginCell()
    .store(
      storeTokenTransfer({
        $$type: 'TokenTransfer',
        queryId: 0n,
        amount: toNano('500'),
        destination: stakingContract_address,
        response_destination: the_wallet_that_will_call_the_URL,
        custom_payload: null,
        forward_ton_amount: toNano('0.075'),
        forward_payload: packed_stake, // TimeStamp
      }),
    )
    .endCell();

  printHeader('Write Contract');
  console.log('💎Sending To: ' + the_wallet_that_will_call_the_URL + "\n |'s ✨ JettonWallet");
  printAddress(jetton_wallet);

  // printDeploy(init, deployAmount, packed);
  // await deploy(new_target_jettonWallet_init, deployAmount, packed);
  // printWrite(stakingContract_init, deployAmount, packed)
  printURL_Address(jetton_wallet, deployAmount, packed); // Get this wallet's Jetton Wallet, with this packed countent
})();
