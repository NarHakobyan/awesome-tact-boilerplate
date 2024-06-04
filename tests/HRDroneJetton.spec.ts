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
import { buildOnchainMetadata } from '../utils/jetton';
import { printSeparator } from '../utils/print';
import { JettonDefaultWallet } from './../build/HRDroneJetton/tact_JettonDefaultWallet';

describe('contract', () => {
  let blockchain: Blockchain;
  let hrdroneJetton: SandboxContract<HRDroneJetton>;
  let deployerWallet: SandboxContract<JettonDefaultWallet>;
  let deployer: SandboxContract<TreasuryContract>;
  let signer1: SandboxContract<TreasuryContract>;
  let signer2: SandboxContract<TreasuryContract>;

  const content = buildOnchainMetadata({
    name: 'HR Drone',
    description: 'HR Drone Token',
    symbol: 'HRD',
    image: 'https://hrdrone.am/favicon-180x180.png',
  });
  const totalSupply = toNano(1_000_000_000_000);

  function getDefaultWallet(address: Address) {
    return blockchain.openContract(JettonDefaultWallet.fromAddress(address));
  }

  beforeAll(async () => {
    blockchain = await Blockchain.create();
    deployer = await blockchain.treasury('deployer');
    signer1 = await blockchain.treasury('signer1');
    signer2 = await blockchain.treasury('signer2');

    hrdroneJetton = blockchain.openContract(await HRDroneJetton.fromInit(content, totalSupply, toNano('1000')));

    // Send Transaction
    const deployResult = await hrdroneJetton.send(
      deployer.getSender(),
      { value: toNano('0.5') },
      {
        $$type: 'Deploy',
        queryId: 0n,
      },
    );

    expect(deployResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: hrdroneJetton.address,
      deploy: true,
      success: true,
    });

    deployerWallet = getDefaultWallet(await hrdroneJetton.getGetWalletAddress(deployer.address));
  });

  it('Whether contract deployed successfully', async () => {
    // the check is done inside beforeEach, blockchain and token are ready to use
    const jettonData = await hrdroneJetton.getGetJettonData();
    expect(jettonData.owner).toEqualAddress(deployer.address);
  });

  it('Minting is successfully', async () => {
    let jettonData = await hrdroneJetton.getGetJettonData();

    const totalSupplyBefore = jettonData.totalSupply;
    const mintAmount = toNano(100);
    const mint: Mint = {
      $$type: 'Mint',
      amount: mintAmount,
      receiver: deployer.address,
    };
    const mintResult = await hrdroneJetton.send(deployer.getSender(), { value: toNano('0.5') }, mint);
    expect(mintResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: hrdroneJetton.address,
      success: true,
    });
    // printTransactionFees(mintResult.transactions);

    jettonData = await hrdroneJetton.getGetJettonData();
    const totalSupplyAfter = jettonData.totalSupply;
    expect(totalSupplyBefore + mintAmount).toEqual(totalSupplyAfter);
  });

  it('should transfer successfully', async () => {
    const sender = signer1;
    const receiver = signer2;
    const initMintAmount = toNano(1000);
    const transferAmount = toNano(80);

    const mintMessage: Mint = {
      $$type: 'Mint',
      amount: initMintAmount,
      receiver: sender.address,
    };
    await hrdroneJetton.send(deployer.getSender(), { value: toNano('0.25') }, mintMessage);

    const senderWallet = getDefaultWallet(await hrdroneJetton.getGetWalletAddress(sender.address));

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

    const receiverWallet = getDefaultWallet(await hrdroneJetton.getGetWalletAddress(receiver.address));

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
    let walletData = await deployerWallet.getGetWalletData();
    const deployerBalanceInit = walletData.balance;

    const initMintAmount = toNano(100);
    const mintMessage: Mint = {
      $$type: 'Mint',
      amount: initMintAmount,
      receiver: deployer.address,
    };
    await hrdroneJetton.send(deployer.getSender(), { value: toNano('0.5') }, mintMessage);

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

    await deployerWallet.send(deployer.getSender(), { value: toNano('0.5') }, burnMessage);

    walletData = await deployerWallet.getGetWalletData();
    const deployerBalanceAfterBurn = walletData.balance;
    expect(deployerBalanceAfterBurn).toEqual(deployerBalance - burnAmount);
  });

  it('Should return value', async () => {
    const mintAmount = 1_119_000n;
    const mint: Mint = {
      $$type: 'Mint',
      amount: mintAmount,
      receiver: signer1.address,
    };
    await hrdroneJetton.send(deployer.getSender(), { value: toNano('0.1') }, mint);

    let jettonData = await hrdroneJetton.getGetJettonData();

    const totalSupplyBase = jettonData.totalSupply;
    const messageResult = await hrdroneJetton.send(signer1.getSender(), { value: 10_033_460n }, mint);
    expect(messageResult.transactions).toHaveTransaction({
      from: signer1.address,
      to: hrdroneJetton.address,
    });

    jettonData = await hrdroneJetton.getGetJettonData();
    const totalSupplyLater = jettonData.totalSupply;
    expect(totalSupplyLater).toEqual(totalSupplyBase);
  });

  it('Convert Address Format', () => {
    console.log(`Example Address(Jetton Root Contract: ${hrdroneJetton.address}`);
    console.log(`Is Friendly Address: ${Address.isFriendly(hrdroneJetton.address.toString())}`);

    const testAddr = Address.parse(hrdroneJetton.address.toString());
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

    const jettonRoot = blkch.openContract(await HRDroneJetton.fromInit(content, totalSupply, toNano('0.5')));
    await jettonRoot.send(
      signer1.getSender(),
      { value: toNano('0.5') },
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
    const response = await factory.sendCreateVault(signer1.getSender(), {
      asset: SCALE,
    });
    printTransactionFees(response.transactions);

    // ------------------------------------------------------------------------------------------------
    // Step 2: 0x97d51f2f / 2547326767: Create a volatile pool)
    // https://docs.dedust.io/reference/tlb-schemes#message-create_volatile_pool
    const pool = blkch.openContract(await factory.getPool(PoolType.VOLATILE, [TON, SCALE]));

    const poolReadiness = await pool.getReadinessStatus();

    if (poolReadiness === ReadinessStatus.NOT_DEPLOYED) {
      const transferLiquidity = await factory.sendCreateVolatilePool(signer1.getSender(), {
        assets: [TON, SCALE],
      });
      printTransactionFees(transferLiquidity.transactions);
    }

    // ------------------------------------------------------------------------------------------------
    // Step 3-1: 0xd55e4686, Deposit / Adding Liquidity: Deposit TON to Vault
    // https://docs.dedust.io/reference/tlb-schemes#message-deposit_liquidity
    const tonVault = blkch.openContract(await factory.getNativeVault());
    console.log(`Native Vault Address: ${tonVault.address}`);
    const tx = await tonVault.sendDepositLiquidity(signer1.getSender(), {
      poolType: PoolType.VOLATILE,
      assets,
      targetBalances,
      amount: tonAmount,
    });
    printTransactionFees(tx.transactions);

    // Step 3-2: Deposit Jetton to Vault
    const scaleRoot = blkch.openContract(JettonRoot.createFromAddress(jettonRoot.address));
    const scaleWallet = blkch.openContract(await scaleRoot.getWallet(signer1.address));
    await jettonRoot.send(
      signer1.getSender(),
      { value: toNano('10') },
      {
        $$type: 'Mint',
        amount: toNano('100'),
        receiver: signer1.address,
      },
    );

    const jettonVault = blkch.openContract(await factory.getJettonVault(jettonRoot.address));
    const txJetton = await scaleWallet.sendTransfer(signer1.getSender(), toNano('0.5'), {
      amount: scaleAmount,
      destination: jettonVault.address,
      responseAddress: signer1.address,
      forwardAmount: toNano('0.4'),
      forwardPayload: VaultJetton.createDepositLiquidityPayload({
        poolType: PoolType.VOLATILE,
        assets,
        targetBalances,
      }),
    });
    console.log(`----- Deposit Jetton To Vault: -----${jettonVault.address}`);
    printTransactionFees(txJetton.transactions);
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
    const swapTx_result = await tonVault.sendSwap(signer1.getSender(), {
      poolAddress: pool.address,
      amount: amountIn,
      gasAmount: toNano('0.252'),
    });
    printTransactionFees(swapTx_result.transactions);

    // Swap 4-2: 0xf8a7ea5 Jetton to TON 0xf8a7ea5
    const jettonAmountIn = toNano('0.00000001'); // 50 SCALE
    const swapJettonResult = await scaleWallet.sendTransfer(signer1.getSender(), toNano('0.3030303'), {
      amount: jettonAmountIn,
      destination: jettonVault.address,
      responseAddress: signer1.address, // return gas to user
      forwardAmount: toNano('0.25'),
      forwardPayload: VaultJetton.createSwapPayload({
        poolAddress: pool.address,
        swapParams: { recipientAddress: deployer.address },
      }),
    });

    printTransactionFees(swapJettonResult.transactions);
    prettyLogTransactions(swapJettonResult.transactions);

    // ------------------------------------------------------------------------------------------------
    // Step 5: Remove Liquidity
    // https://docs.dedust.io/docs/liquidity-provisioning#withdraw-liquidity
    const lpWallet = blkch.openContract(await pool.getWallet(signer1.address));

    const removeTxResult = await lpWallet.sendBurn(signer1.getSender(), toNano('10'), {
      amount: await lpWallet.getBalance(),
    });
    console.log('removeTxResult: ');
    printTransactionFees(removeTxResult.transactions);

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
