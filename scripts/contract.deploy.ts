import { Address, beginCell, contractAddress, toNano } from '@ton/core';

// ================================================================= //
import { Main, storeCreate } from '../build/Contract/tact_Main';
import { deploy } from './utils/deploy';
import { printAddress, printHeader } from './utils/print';
// ================================================================= //

const admin = Address.parse(''); // 🔴 Change to your own, by creating .env file!

async function main() {
  // The Transaction body we want to pass to the smart contract
  const body = beginCell()
    .store(
      storeCreate({
        $$type: 'Create',
        owner: admin,
      }),
    )
    .endCell();

  // ===== Parameters =====
  // Replace owner with your address

  const init = await Main.init(admin);
  const address = contractAddress(0, init);
  const deployAmount = toNano('0.1');
  const isTestnet = true;

  // Do deploy
  await deploy(init, deployAmount, body, isTestnet);
  printHeader('sampleNFT_Contract');
  printAddress(address);
}

main();
