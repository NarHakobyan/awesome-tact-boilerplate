import { beginCell } from '@ton/core';

export function keyToInt(publicKey: Buffer) {
  return beginCell().storeBuffer(publicKey).endCell().beginParse().loadUintBig(256);
}
