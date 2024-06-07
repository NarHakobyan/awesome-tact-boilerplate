struct CollectionData {
  next_item_index: Int;
  content: Cell;
  owner: Address;
}

struct RoyaltyParams {
  numerator: Int as uint16;
  denominator: Int as uint16;
  destination: Address;
}

struct GetNftData {
  is_initialized: Bool;
  index: Int;
  collection_address: Address;
  owner: Address;
  individual_content: Cell;
  level: Int;
}
struct Info {
  sender: Address;
  weight: Int;
  unlock_time: Int;
}

struct StakeData {
  totalWeight: Int;
}


struct NftCollectionData {
  owner: Address;
  next_item_index: Int as uint64;
  content: Cell;
  royalty_params: RoyaltyParams;
}

struct NftItemData {
  is_initialized: Bool;
  item_index: Int as uint64;
  collection_address: Address;
  owner: Address;
  individual_content: Cell;
}

struct StakeInfo {
  lock_time: Int as uint64;
  unlock_time: Int as uint64;
  body: Int as coins;
  redeem: Int as coins;
}
