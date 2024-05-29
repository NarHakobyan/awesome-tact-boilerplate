import { Address } from '@ton/core';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { TonClient4, WalletContractV4 } from '@ton/ton';

// ================================================================= //
import { Main } from '../build/Contract/tact_Main';
import { Role } from '../build/Contract/tact_Role';
import { printHeader } from '../utils/print';

// ================================================================= //
const admin = Address.parse(''); // 🔴 Change to your own, by creating .env file!

async function main() {
  const client = new TonClient4({
    // endpoint: "https://mainnet-v4.tonhubapi.com", // 🔴 Main-net API endpoint
    endpoint: 'https://sandbox-v4.tonhubapi.com', // 🔴 Test-net API endpoint
  });

  const mnemonics = (process.env.mnemonics ?? '').toString(); // 🔴 Change to your own, by creating .env file!
  const keyPair = await mnemonicToPrivateKey(mnemonics.split(' '));
  const secretKey = keyPair.secretKey;
  const workchain = 0;
  const wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
  const walletContract = client.open(wallet);

  const contractAddress = await Main.fromInit(admin);
  const clientOpen = client.open(contractAddress);

  const index = 0n;
  const roleAddressByIndex = await clientOpen.getGetRoleAddress(index);
  printHeader('Printing Role Address by Index');
  console.log(`Index ID[${index}]: ${roleAddressByIndex}`);

  // let role = client.open(await Role.fromAddress(roleAddress_by_index));
  const role = client.open(await Role.fromInit(contractAddress.address, 0n, admin));
  console.log('Role Address(2):' + role.address.toString());
}

void main();
