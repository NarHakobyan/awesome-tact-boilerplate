import "./nft-structs";

message(0x693d3950) GetRoyaltyParams {
  query_id: Int as uint64;
}

message(0xa8cb00ad) ReportRoyaltyParams {
  query_id: Int as uint64;
  numerator:  Int as uint16;
  denominator: Int as uint16;
  destination: Address;
}

message Stake {
  duration: Int as uint256;
}

message(0x5fcc3d14) Transfer {
  query_id: Int as uint64;
  new_owner: Address;
  response_destination: Address;
  custom_payload: Cell?;
  forward_amount: Int as coins;
  forward_payload: Slice as remaining;
}
message(0x05138d91) OwnershipAssigned{
  query_id: Int as uint64;
  prev_owner: Address;
  forward_payload: Slice as remaining;
}
message(0xd53276db) Excesses {
  query_id: Int as uint64;
}
message(0x2fcb26a2) GetStaticData {
  query_id: Int as uint64;
}
message(0x8b771735) ReportStaticData{
  query_id: Int as uint64;
  index_id: Int;
  collection: Address;
}

message StakeNFT {
  sender_nft_item_address: Address;
  nftId: Int as uint32; // NFT ID
  duration: Int as uint256;
  level: Int;
}

message ClaimNFT {
  nftId: Int as uint32; // NFT ID
}


message(0xd136d3b3) TakeExcess {
  query_id: Int as uint64;
}

message NftDeploy {
  query_id: Int as uint64;
  item_index: Int as uint64;
  item_owner: Address;
  individual_content: Cell;
}

message(0x1f04537a) NftDestroy {
  query_id: Int as uint64;
}

message RequestNftDeploy {
  query_id: Int as uint64;
  item_index: Int as uint64;
  item_owner: Address;
  item_value: Int as coins;
  item_content: Cell;
}

message RequestGrant {
  query_id: Int as uint64;
  ungranted_transfers: Int as uint16;
  current_owner: Address;
  new_owner: Address;
  response_destination: Address;
  custom_payload: Cell?;
  forward_amount: Int as coins;
  forward_payload: Slice as remaining;
}

message ItemGranted {
  query_id: Int as uint64;
  new_owner: Address;
  response_destination: Address;
  custom_payload: Cell?;
  forward_amount: Int as coins;
  forward_payload: Slice as remaining;
}

message GrantedTransfer {
  query_id: Int as uint64;
  new_owner: Address;
  response_destination: Address;
  custom_payload: Cell?;
  forward_amount: Int as coins;
  forward_payload: Slice as remaining;
}

message GetGrantData {
  query_id: Int as uint64;
}

message ReportGrantData{
  query_id: Int as uint64;
  is_granted: Bool;
  ungranted_transfers: Int as uint16;
  prev_owners: map<Address, Int>;
  current_owner: Address;
}

message DeployItem {
  owner: Address;
  stake_info: StakeInfo;
  content: Cell?;
  authority: Address;
}

// prove_ownership#04ded148 query_id:uint64 destination:MsgAddress
// forward_payload:^Cell with_content:Bool = InternalMsgBody;

message(0x04ded148) ProveOwnership {
  query_id: Int as uint64;
  destination: Address;
  forward_payload: Cell;
  with_content: Bool;
}

// ownership_proof#0524c7ae query_id:uint64 item_index:uint256 owner:MsgAddress
// forward_payload:^Cell revoked_at:uint64 content:(Maybe ^Cell) = InternalMsgBody;

message(0x0524c7ae) OwnershipProof {
  query_id: Int as uint64;
  item_index: Int as uint256;
  owner: Address;
  forward_payload: Cell;
  revoked_at: Int as uint64;
  content: Cell?;
}

message(0xc18e86d2) OwnershipProofBounced {
  query_id: Int as uint64;
}

// request_owner#d0c3bfea query_id:uint64 destination:MsgAddress
// forward_payload:^Cell with_content:Bool = InternalMsgBody;

message(0xd0c3bfea) RequestOwner {
  query_id: Int as uint64;
  destination: Address;
  forward_payload: Cell;
  with_content: Bool;
}

// owner_info#0dd607e3 query_id:uint64 item_id:uint256 initiator:MsgAddress owner:MsgAddress
// forward_payload:^Cell revoked_at:uint64 content:(Maybe ^Cell) = InternalMsgBody;

message(0x0dd607e3) OwnerInfo {
  query_id: Int as uint64;
  item_index: Int as uint256;
  initiator: Address;
  owner: Address;
  forward_payload: Cell;
  revoked_at: Int as uint64;
  content: Cell?;
}

// revoke#6f89f5e3 query_id:uint64 = InternalMsgBody;
message(0x6f89f5e3) Revoke {
  query_id: Int as uint64;
}
