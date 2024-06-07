import "./jetton-structs";


message Mint {
  amount: Int;
  receiver: Address;
}


message(0xf8a7ea5) TokenTransfer {
  query_id: Int as uint64;
  amount: Int as coins;
  destination: Address;
  response_destination: Address;
  custom_payload: Cell?;
  forward_ton_amount: Int as coins;
  forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}

message(0x178d4519) TokenTransferInternal {
  query_id: Int as uint64;
  amount: Int as coins;
  from: Address;
  response_destination: Address;
  forward_ton_amount: Int as coins;
  forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}

message(0x7362d09c) TokenNotification {
  query_id: Int as uint64;
  amount: Int as coins;
  from: Address;
  forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}

message(0x595f07bc) TokenBurn {
  query_id: Int as uint64;
  amount: Int as coins;
  owner: Address;
  response_destination: Address;
}

message(0x7bdd97de) TokenBurnNotification {
  query_id: Int as uint64;
  amount: Int as coins;
  owner: Address;
  response_destination: Address?;
}

message(0xd53276db) TokenExcesses {
  query_id: Int as uint64;
}

message TokenUpdateContent {
  content: Cell;
}
