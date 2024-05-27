import {mnemonicToWalletKey} from "ton-crypto";
import {fromNano, internal, TonClient, WalletContractV4} from "ton";
import {getHttpEndpoint} from "@orbs-network/ton-access";

async function main() {
    const mnemonic = "more place episode often young cruise shock torch awesome place umbrella wide mean upgrade picture grid draft pudding snow tree vintage weasel crime cruise"
    const key = await mnemonicToWalletKey(mnemonic.split(" "))
    console.log("Wallet key:", key)

    const wallet = WalletContractV4.create({publicKey: key.publicKey, workchain: 0})
    const endpoint = await getHttpEndpoint({network: "testnet"})
    console.log("Endpoint:", endpoint)

    const client = new TonClient({endpoint})
    console.log("Client:", client)

    if (!await client.isContractDeployed(wallet.address)) {
        return console.log("Wallet is not deployed")
    }

    console.log("Wallet is deployed")
    console.log("Wallet:", {
        address: wallet.address,
        balance: fromNano(await client.getBalance(wallet.address)),
    })

    //
    const walletContract = client.open(wallet)
    const seqno = await walletContract.getSeqno()

    await walletContract.sendTransfer({
        secretKey: key.secretKey,
        seqno: seqno,
        messages: [
            internal({
                to: "EQA4V9tF4lY2S_J-sEQR7aUj9IwW-Ou2vJQlCn--2DLOLR5e",
                value: "0.05",
                body: "Hello from crypto enthusiasts!",
                bounce: false
            })
        ]
    })

    let currentSeqno = seqno
    while (currentSeqno===seqno) {
        console.log("Waiting for seqno to change")
        await sleep(1000)
        currentSeqno = await walletContract.getSeqno()
    }

    console.log("Seqno changed. Transaction confirmed")
}

main()

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))