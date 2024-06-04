import type { Address, Cell } from '@ton/core';
import { beginCell, contractAddress, storeStateInit } from '@ton/core';
import base64url from 'base64url';
import qs from 'qs';

export function printSeparator() {
  console.log('========================================================================================');
}

export function printHeader(name: string) {
  printSeparator();
  console.log('Contract: ' + name);
  printSeparator();
}

export function printAddress(address: Address, testnet = true) {
  console.log(`Address: ${address.toString({ testOnly: testnet })}`);
  console.log(
    `Explorer: https://${testnet ? 'testnet.' : ''}tonscan.org/address/${address.toString({ testOnly: testnet })}`,
  );
  printSeparator();
}

export function printDeploy(init: { code: Cell; data: Cell }, value: bigint, command: Cell | string, testnet = true) {
  // Resolve target address
  const to = contractAddress(0, init);

  // Resovle init
  const initStr = base64url(beginCell().store(storeStateInit(init)).endCell().toBoc({ idx: false }));

  const link =
    typeof command === 'string'
      ? `https://${testnet ? 'test.' : ''}tonhub.com/transfer/` +
        to.toString({ testOnly: testnet }) +
        '?' +
        qs.stringify({
          text: command,
          amount: value.toString(10),
          init: initStr,
        })
      : `https://${testnet ? 'test.' : ''}tonhub.com/transfer/` +
        to.toString({ testOnly: testnet }) +
        '?' +
        qs.stringify({
          text: 'Deploy contract',
          amount: value.toString(10),
          init: initStr,
          bin: base64url(command.toBoc({ idx: false })),
        });

  console.log('Deploy: ' + link);
  printSeparator();
}
