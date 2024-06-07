struct JettonData {
  total_supply: Int as coins;
  mintable: Bool;
  owner: Address;
  content: Cell;
  wallet_code: Cell;
}

struct JettonWalletData {
  balance: Int;
  owner: Address;
  master: Address;
  wallet_code: Cell;
}
