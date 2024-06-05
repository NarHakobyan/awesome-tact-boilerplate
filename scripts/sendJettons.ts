import { JettonRoot } from '@dedust/sdk';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { Address, toNano, TonClient, WalletContractV4 } from '@ton/ton';

const apiKey = process.env.RPC_API_KEY;
const workchain = 0;

const client = new TonClient({ endpoint: process.env.RPC_URL, apiKey });

export async function sendJetton(
  amount: bigint,
  receiver: string,
  mnemonic?: string[],
  provider?: NetworkProvider,
): Promise<void> {
  let sender;

  if (mnemonic) {
    sender = provider!.sender();
  } else {
    const keys = await mnemonicToPrivateKey(process.env.MNEMONIC.split(' '));
    const wallet = WalletContractV4.create({ workchain, publicKey: keys.publicKey });
    const openedWallet = client.open(wallet);
    sender = openedWallet.sender(keys.secretKey);
  }

  const jettonRoot = client.open(JettonRoot.createFromAddress(Address.parse(process.env.JETTON)));
  const jettonWallet = client.open(await jettonRoot.getWallet(Address.parse(process.env.WALLET_ADDRESS)));

  await jettonWallet.sendTransfer(sender, toNano('0.3'), {
    amount,
    destination: Address.parse(receiver),
    responseAddress: sender.address, // return gas to user
    forwardAmount: toNano('0.25'),
  });
}

// for testing purposes
import type { NetworkProvider } from '@ton/blueprint';

const myAddress: Address = Address.parse('kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu');
const nftCollection: Address = Address.parse('EQCB47QNaFJ_Rok3GpoPjf98cKuYY1kQwgqeqdOyYJFrywUK');

export async function run(provider: NetworkProvider) {
  const transfer = await sendJetton(toNano('1'), myAddress.toString(), undefined, provider);

  console.log('Deposited!');
  console.log(transfer);
}
