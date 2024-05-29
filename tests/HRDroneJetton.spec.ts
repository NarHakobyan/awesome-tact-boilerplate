import '@ton/test-utils';

// -------- DeDust.io SDK --------
import {
  Asset,
  Factory,
  JettonRoot,
  LiquidityDeposit,
  MAINNET_FACTORY_ADDR,
  PoolType,
  ReadinessStatus,
  VaultJetton,
} from '@dedust/sdk';
import { DEX, pTON } from '@ston-fi/sdk';
import { Address, beginCell, toNano } from '@ton/core';
import type { SandboxContract, TreasuryContract } from '@ton/sandbox';
import {
  Blockchain,
  prettyLogTransactions,
  printTransactionFees,
  RemoteBlockchainStorage,
  wrapTonClient4ForRemote,
} from '@ton/sandbox';
import { TonClient4 } from '@ton/ton';
// ------------ STON.fi SDK ------------
import TonWeb from 'tonweb';

import type { Mint, TokenBurn, TokenTransfer } from '../build/HRDroneJetton/tact_HRDroneJetton';
import { HRDroneJetton } from '../build/HRDroneJetton/tact_HRDroneJetton';
import { buildOnchainMetadata } from '../scripts/utils/jetton';
import { printSeparator } from '../scripts/utils/print';
import { JettonDefaultWallet } from './../build/HRDroneJetton/tact_JettonDefaultWallet';

describe('contract', () => {
  let blockchain: Blockchain;
  let token: SandboxContract<HRDroneJetton>;
  let deployerWallet: SandboxContract<JettonDefaultWallet>;
  let deployer: SandboxContract<TreasuryContract>;
  let player: SandboxContract<TreasuryContract>;

  const content = buildOnchainMetadata({
    name: 'HR Drone',
    description: 'HR Drone Token',
    symbol: 'HRD',
    image: 'https://hrdrone.am/favicon-180x180.png',
  });
  const totalSupply = toNano(1_000_000_000_000);

  beforeAll(async () => {
    // Create content Cell
    blockchain = await Blockchain.create();
    deployer = await blockchain.treasury('deployer');
    player = await blockchain.treasury('player');

    token = blockchain.openContract(await HRDroneJetton.fromInit(content, totalSupply, toNano('1000')));

    // Send Transaction
    const deployResult = await token.send(
      deployer.getSender(),
      { value: toNano('0.5') },
      {
        $$type: 'Deploy',
        queryId: 0n,
      },
    );

    expect(deployResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: token.address,
      deploy: true,
      success: true,
    });

    const deployerWalletAddress = await token.getGetWalletAddress(deployer.address);
    deployerWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(deployerWalletAddress));
  });

  it('Test: whether contract deployed successfully', async () => {
    // the check is done inside beforeEach, blockchain and token are ready to use
    const jettonData = await token.getGetJettonData();
    expect(jettonData.owner).toEqualAddress(deployer.address);
  });

  it('Test: Minting is successfully', async () => {
    let jettonData = await token.getGetJettonData();

    const totalSupplyBefore = jettonData.totalSupply;
    const mintAmount = toNano(100);
    const mint: Mint = {
      $$type: 'Mint',
      amount: mintAmount,
      receiver: deployer.address,
    };
    const mintResult = await token.send(deployer.getSender(), { value: toNano('10') }, mint);
    expect(mintResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: token.address,
      success: true,
    });
    // printTransactionFees(mintResult.transactions);

    jettonData = await token.getGetJettonData();
    const totalSupplyAfter = jettonData.totalSupply;
    expect(totalSupplyBefore + mintAmount).toEqual(totalSupplyAfter);

    const walletData = await deployerWallet.getGetWalletData();
    expect(walletData.owner).toEqualAddress(deployer.address);
    expect(walletData.balance).toBeGreaterThanOrEqual(mintAmount);
  });

  it('should transfer successfully', async () => {
    const sender = await blockchain.treasury('sender');
    const receiver = await blockchain.treasury('receiver');
    const initMintAmount = toNano(1000);
    const transferAmount = toNano(80);

    const mintMessage: Mint = {
      $$type: 'Mint',
      amount: initMintAmount,
      receiver: sender.address,
    };
    await token.send(deployer.getSender(), { value: toNano('0.25') }, mintMessage);

    const senderWalletAddress = await token.getGetWalletAddress(sender.address);
    const senderWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(senderWalletAddress));

    // Transfer tokens from sender's wallet to receiver's wallet // 0xf8a7ea5
    const transferMessage: TokenTransfer = {
      $$type: 'TokenTransfer',
      queryId: 0n,
      amount: transferAmount,
      destination: receiver.address,
      response_destination: sender.address,
      custom_payload: null,
      forward_ton_amount: toNano('0.1'),
      forward_payload: beginCell().storeUint(0, 1).storeUint(0, 32).endCell(),
    };
    const transferResult = await senderWallet.send(sender.getSender(), { value: toNano('0.5') }, transferMessage);
    expect(transferResult.transactions).toHaveTransaction({
      from: sender.address,
      to: senderWallet.address,
      success: true,
    });
    // printTransactionFees(transferResult.transactions);
    // prettyLogTransactions(transferResult.transactions);

    const receiverWalletAddress = await token.getGetWalletAddress(receiver.address);
    const receiverWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(receiverWalletAddress));

    const senderWalletDataAfterTransfer = await senderWallet.getGetWalletData();
    const receiverWalletDataAfterTransfer = await receiverWallet.getGetWalletData();

    // check that the sender transferred the right amount of tokens
    expect(senderWalletDataAfterTransfer.balance).toEqual(initMintAmount - transferAmount);

    // check that the receiver received the right amount of tokens
    expect(receiverWalletDataAfterTransfer.balance).toEqual(transferAmount);
    // const balance1 = (await receiverWallet.getGetWalletData()).balance;
    // console.log(fromNano(balance1));
  });

  it('Mint tokens then Burn tokens', async () => {
    // const sender = await blockchain.treasury("sender");
    // const deployerWalletAddress = await token.getGetWalletAddress(deployer.address);
    // const deployerWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(deployerWalletAddress));

    let walletData = await deployerWallet.getGetWalletData();
    const deployerBalanceInit = walletData.balance;

    const initMintAmount = toNano(100);
    const mintMessage: Mint = {
      $$type: 'Mint',
      amount: initMintAmount,
      receiver: deployer.address,
    };
    await token.send(deployer.getSender(), { value: toNano('10') }, mintMessage);

    walletData = await deployerWallet.getGetWalletData();
    const deployerBalance = walletData.balance;
    expect(deployerBalance).toEqual(deployerBalanceInit + initMintAmount);

    const burnAmount = toNano(10);
    const burnMessage: TokenBurn = {
      $$type: 'TokenBurn',
      queryId: 0n,
      amount: burnAmount,
      owner: deployer.address,
      response_destination: deployer.address,
    };

    await deployerWallet.send(deployer.getSender(), { value: toNano('10') }, burnMessage);

    walletData = await deployerWallet.getGetWalletData();
    const deployerBalanceAfterBurn = walletData.balance;
    expect(deployerBalanceAfterBurn).toEqual(deployerBalance - burnAmount);
  });

  it('Should return value', async () => {
    const mintAmount = 1_119_000n;
    const mint: Mint = {
      $$type: 'Mint',
      amount: mintAmount,
      receiver: player.address,
    };
    await token.send(deployer.getSender(), { value: toNano('1') }, mint);

    let jettonData = await token.getGetJettonData();

    const totalSupplyBase = jettonData.totalSupply;
    const messageResult = await token.send(player.getSender(), { value: 10_033_460n }, mint);
    expect(messageResult.transactions).toHaveTransaction({
      from: player.address,
      to: token.address,
    });

    jettonData = await token.getGetJettonData();
    const totalSupplyLater = jettonData.totalSupply;
    expect(totalSupplyLater).toEqual(totalSupplyBase);

    // printTransactionFees(messateResult.transactions);
    // prettyLogTransactions(messateResult.transactions);
  });

  it('Convert Address Format', () => {
    console.log(`Example Address(Jetton Root Contract: ${token.address}`);
    console.log(`Is Friendly Address: ${Address.isFriendly(token.address.toString())}`);

    const testAddr = Address.parse(token.address.toString());
    console.log('✓ Address: ' + testAddr.toString({ bounceable: false }));
    console.log('✓ Address: ' + testAddr.toString());
    console.log('✓ Address(urlSafe: true): ' + testAddr.toString({ urlSafe: true }));
    console.log('✓ Address(urlSafe: false): ' + testAddr.toString({ urlSafe: false }));
    console.log('✓ Raw Address: ' + testAddr.toRawString());
  });

  it('Onchian Testing: DeDust', async () => {
    const blkch = await Blockchain.create({
      storage: new RemoteBlockchainStorage(
        wrapTonClient4ForRemote(
          new TonClient4({
            endpoint: 'https://mainnet-v4.tonhubapi.com',
          }),
        ),
      ),
    });

    const jettonRoot = blkch.openContract(await HRDroneJetton.fromInit(content, totalSupply, toNano('1000')));
    await jettonRoot.send(
      player.getSender(),
      { value: toNano('10') },
      {
        $$type: 'Deploy',
        queryId: 0n,
      },
    );

    const tonAmount = toNano('0.1'); // 1 TON
    const scaleAmount = toNano('0.000000001'); // 10 SCALE

    const TON = Asset.native();
    const SCALE = Asset.jetton(jettonRoot.address);

    const assets: [Asset, Asset] = [TON, SCALE];
    const targetBalances: [bigint, bigint] = [tonAmount, scaleAmount];
    console.log(`DeDust Factory Address: ${MAINNET_FACTORY_ADDR}`);

    // Step 1: 0x21cfe02b / 567271467: Create Vault
    // https://docs.dedust.io/reference/tlb-schemes#message-create_vault
    const factory = blkch.openContract(Factory.createFromAddress(MAINNET_FACTORY_ADDR));
    const response = await factory.sendCreateVault(player.getSender(), {
      asset: SCALE,
    });
    printTransactionFees(response.transactions);

    // ------------------------------------------------------------------------------------------------
    // Step 2: 0x97d51f2f / 2547326767: Create a volatile pool)
    // https://docs.dedust.io/reference/tlb-schemes#message-create_volatile_pool
    const pool = blkch.openContract(await factory.getPool(PoolType.VOLATILE, [TON, SCALE]));

    const poolReadiness = await pool.getReadinessStatus();

    if (poolReadiness === ReadinessStatus.NOT_DEPLOYED) {
      const transferLiquidity = await factory.sendCreateVolatilePool(player.getSender(), {
        assets: [TON, SCALE],
      });
      printTransactionFees(transferLiquidity.transactions);
    }

    // ------------------------------------------------------------------------------------------------
    // Step 3-1: 0xd55e4686, Deposit / Adding Liquidity: Deposit TON to Vault
    // https://docs.dedust.io/reference/tlb-schemes#message-deposit_liquidity
    const tonVault = blkch.openContract(await factory.getNativeVault());
    console.log(`Native Vault Address: ${tonVault.address}`);
    const tx = await tonVault.sendDepositLiquidity(player.getSender(), {
      poolType: PoolType.VOLATILE,
      assets,
      targetBalances,
      amount: tonAmount,
    });
    printTransactionFees(tx.transactions);

    // Step 3-2: Deposit Jetton to Vault
    const scaleRoot = blkch.openContract(JettonRoot.createFromAddress(jettonRoot.address));
    const scaleWallet = blkch.openContract(await scaleRoot.getWallet(player.address));
    await jettonRoot.send(
      player.getSender(),
      { value: toNano('10') },
      {
        $$type: 'Mint',
        amount: toNano('100'),
        receiver: player.address,
      },
    );

    const jettonVault = blkch.openContract(await factory.getJettonVault(jettonRoot.address));
    const tx_jetton = await scaleWallet.sendTransfer(player.getSender(), toNano('0.5'), {
      amount: scaleAmount,
      destination: jettonVault.address,
      responseAddress: player.address,
      forwardAmount: toNano('0.4'),
      forwardPayload: VaultJetton.createDepositLiquidityPayload({
        poolType: PoolType.VOLATILE,
        assets,
        targetBalances,
      }),
    });
    console.log(`----- Deposit Jetton To Vault: -----${jettonVault.address}`);
    printTransactionFees(tx_jetton.transactions);
    printSeparator();

    // ------------------------------------------------------------------------------------------------
    console.log('----- Swap: -----');

    if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
      throw new Error('Pool (TON, Jetton) does not exist.');
    }

    // Check if vault exits:
    if ((await tonVault.getReadinessStatus()) !== ReadinessStatus.READY) {
      throw new Error('Vault (TON) does not exist.');
    }

    // Step 4-1: 0xea06185d Swap TON to Jetton
    const amountIn = toNano('0.0001'); // 5 TON
    const swapTx_result = await tonVault.sendSwap(player.getSender(), {
      poolAddress: pool.address,
      amount: amountIn,
      gasAmount: toNano('0.252'),
    });
    printTransactionFees(swapTx_result.transactions);

    // Swap 4-2: 0xf8a7ea5 Jetton to TON 0xf8a7ea5
    const jettonAmountIn = toNano('0.00000001'); // 50 SCALE
    const swapJetton_result = await scaleWallet.sendTransfer(player.getSender(), toNano('0.3030303'), {
      amount: jettonAmountIn,
      destination: jettonVault.address,
      responseAddress: player.address, // return gas to user
      forwardAmount: toNano('0.25'),
      forwardPayload: VaultJetton.createSwapPayload({
        poolAddress: pool.address,
        swapParams: { recipientAddress: deployer.address },
      }),
    });
    // await printTransactionFees(await swapJetton_result.transactions);
    // await prettyLogTransactions(await swapJetton_result.transactions);

    // ------------------------------------------------------------------------------------------------
    // Step 5: Remove Liquidity
    // https://docs.dedust.io/docs/liquidity-provisioning#withdraw-liquidity
    const lpWallet = blkch.openContract(await pool.getWallet(player.address));

    const removeTx_Result = await lpWallet.sendBurn(player.getSender(), toNano('10'), {
      amount: await lpWallet.getBalance(),
    });
    console.log('removeTx_Result: ');
    printTransactionFees(removeTx_Result.transactions);

    console.log(`JettonWallet: ${scaleWallet.address}`);
    // await prettyLogTransactions(await removeTx_Result.transactions);
  }, 10_000);

  it('Onchian Testing: STON.fi', async () => {
    const blkch = await Blockchain.create({
      storage: new RemoteBlockchainStorage(
        wrapTonClient4ForRemote(
          new TonClient4({
            endpoint: 'https://mainnet-v4.tonhubapi.com',
          }),
        ),
      ),
    });

    const provider = new TonWeb.HttpProvider();

    const router = new DEX.v1.Router({
      tonApiClient: provider,
    });

    // const router = new Router(blkch, {
    //     revision: ROUTER_REVISION.V1,
    //     address: ROUTER_REVISION_ADDRESS.V1,
    // });

    console.log(`Router Address: ${router.address}`);

    // const JETTON0 = "EQDQoc5M3Bh8eWFephi9bClhevelbZZvWhkqdo80XuY_0qXv";
    // const JETTON1 = "EQC_1YoM8RBixN95lz7odcF3Vrkc_N8Ne7gQi7Abtlet_Efi";
    // const pool = await router.getPool({ jettonAddresses: [JETTON0, JETTON1] });
    // console.log((await pool!!.getData()).protocolFeeAddress);

    const OWNER_ADDRESS = '';
    const JETTON0 = 'EQDQoc5M3Bh8eWFephi9bClhevelbZZvWhkqdo80XuY_0qXv';
    const JETTON1 = 'EQC_1YoM8RBixN95lz7odcF3Vrkc_N8Ne7gQi7Abtlet_Efi';

    const routerData = await router.getData();
    const { isLocked, adminAddress, tempUpgrade, poolCode, jettonLpWalletCode, lpAccountCode } = routerData;

    const pool = await router.getPool({ token0: JETTON0, token1: JETTON1 });

    if (!pool) {
      throw new Error(`Pool for ${JETTON0}/${JETTON1} not found`);
    }

    const poolAddress = await pool.getAddress();

    const poolData = await pool.getData();
    const {
      reserve0,
      reserve1,
      token0WalletAddress,
      token1WalletAddress,
      lpFee,
      protocolFee,
      refFee,
      protocolFeeAddress,
      collectedToken0ProtocolFee,
      collectedToken1ProtocolFee,
    } = poolData;

    const expectedLiquidityData = await pool.getExpectedLiquidity({
      jettonAmount: new TonWeb.utils.BN(500_000_000),
    });

    const { amount0, amount1 } = expectedLiquidityData;

    const expectedLpTokensAmount = await pool.getExpectedTokens({
      amount0: new TonWeb.utils.BN(500_000_000),
      amount1: new TonWeb.utils.BN(200_000_000),
    });

    if (token0WalletAddress) {
      const expectedOutputsData = await pool.getExpectedOutputs({
        amount: new TonWeb.utils.BN(500_000_000),
        jettonWallet: token0WalletAddress,
      });
      const { jettonToReceive, protocolFeePaid, refFeePaid } = expectedOutputsData;
    }

    const lpAccountAddress = await pool.getLpAccountAddress({
      ownerAddress: OWNER_ADDRESS,
    });

    const lpAccount = await pool.getLpAccount({ ownerAddress: OWNER_ADDRESS });

    if (lpAccount) {
      const lpAccountData = await lpAccount.getData();
      const { userAddress, poolAddress, amount0, amount1 } = lpAccountData;
    }
  });
});

// it("should interact with STON.fi router and pool contracts", async () => {
//     const OWNER_ADDRESS = "YOUR WALLET ADDRESS HERE";
//     const JETTON0 = "EQDQoc5M3Bh8eWFephi9bClhevelbZZvWhkqdo80XuY_0qXv";
//     const JETTON1 = "EQC_1YoM8RBixN95lz7odcF3Vrkc_N8Ne7gQi7Abtlet_Efi";

//     const routerData = await router.getData();
//     const pool = await router.getPool({ jettonAddresses: [JETTON0, JETTON1] });

//     if (!pool) {
//         throw new Error(`Pool for ${JETTON0}/${JETTON1} not found`);
//     }

//     const poolData = await pool.getData();
//     const expectedLiquidityData = await pool.getExpectedLiquidity({
//         jettonAmount: new tonWeb.utils.BN(toNano("1")),
//     });

//     const { amount0, amount1 } = expectedLiquidityData;

//     const lpAccountAddress = await pool.getLpAccountAddress({ ownerAddress: OWNER_ADDRESS });
//     const lpAccount = await pool.getLpAccount({ ownerAddress: OWNER_ADDRESS });

//     if (lpAccount) {
//         const lpAccountData = await lpAccount.getData();
//     }

//     // Assertions to verify the data received from STON.fi SDK
//     expect(poolData).toBeDefined();
//     expect(expectedLiquidityData).toBeDefined();
//     expect(lpAccountAddress).toBeDefined();

//     if (lpAccount) {
//         expect(lpAccountData).toBeDefined();
//     }
// });
// });
