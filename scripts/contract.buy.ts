import { Address, beginCell, fromNano, internal, toNano } from '@ton/core';
import { mnemonicToPrivateKey } from '@ton/crypto';
import * as dotenv from 'dotenv';

dotenv.config();

import { TonClient4, WalletContractV4 } from '@ton/ton';

import { Main } from '../build/Contract/tact_Main';
import { storeBuyShares } from '../build/Contract/tact_Role';

const admin = Address.parse(''); // 🔴 Change to your own, by creating .env file!

async function main() {
  //create client for testnet sandboxv4 API - alternative endpoint
  const client4 = new TonClient4({
    endpoint: 'https://sandbox-v4.tonhubapi.com',
  });

  const mnemonics = (process.env.mnemonics ?? '').toString(); // 🔴 Change to your own, by creating .env file!
  const keyPair = await mnemonicToPrivateKey(mnemonics.split(' '));
  const secretKey = keyPair.secretKey;
  const workchain = 0;
  const wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
  const walletContract = client4.open(wallet);

  // Preparing the Factory contract parameters
  const init = await Main.fromInit(admin);
  const contract = client4.open(init);

  const targetUserProfileIndex = 0n;
  const getUserProfileAddress = await contract.getGetRoleAddress(targetUserProfileIndex);

  const packed = beginCell()
    .store(
      storeBuyShares({
        $$type: 'BuyShares',
        query_id: 0n,
        amount: 10n,
      }),
    )
    .endCell();

  const deployAmount = toNano('2');
  const seqno: number = await walletContract.getSeqno();
  const balance: bigint = await walletContract.getBalance();

  console.info('Current deployment wallet balance:', fromNano(balance).toString(), '💎TON');
  console.info('Wallet:', wallet.address.toString());
  console.info('===========================================');
  console.info('Calling to Role[' + targetUserProfileIndex + ']' + getUserProfileAddress.toString());

  await walletContract.sendTransfer({
    seqno,
    secretKey,
    messages: [
      internal({
        to: getUserProfileAddress,
        value: deployAmount,
        bounce: true,
        body: packed,
      }),
    ],
  });
}

void main();
