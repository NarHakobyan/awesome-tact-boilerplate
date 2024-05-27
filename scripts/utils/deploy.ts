import type { Cell } from '@ton/core';
import { beginCell, contractAddress, storeStateInit } from '@ton/core';
import base64url from 'base64url';
import { prompt } from 'enquirer';
import open from 'open';
import qs from 'qs';

import { printSeparator } from './print';

function getLink(
  prefix: string,
  init: { code: Cell; data: Cell },
  value: bigint,
  command: Cell | string,
  testnet: boolean,
) {
  // Resolve target address
  const to = contractAddress(0, init);

  // Resovle init
  const initStr = base64url(beginCell().store(storeStateInit(init)).endCell().toBoc({ idx: false }));

  let link: string;

  link =
    typeof command === 'string'
      ? prefix +
        `transfer/` +
        to.toString({ testOnly: testnet }) +
        '?' +
        qs.stringify({
          text: command,
          amount: value.toString(10),
          init: initStr,
        })
      : prefix +
        `transfer/` +
        to.toString({ testOnly: testnet }) +
        '?' +
        qs.stringify({
          text: 'Deploy contract',
          amount: value.toString(10),
          init: initStr,
          bin: base64url(command.toBoc({ idx: false })),
        });

  return link;
}

export function getTonhubLink(
  init: { code: Cell; data: Cell },
  value: bigint,
  command: Cell | string,
  testnet: boolean,
) {
  return getLink(`https://${testnet ? 'test.' : ''}tonhub.com/`, init, value, command, testnet);
}

export function getTonkeeperLink(
  init: { code: Cell; data: Cell },
  value: bigint,
  command: Cell | string,
  testnet: boolean,
) {
  return getLink(`https://app.tonkeeper.com/`, init, value, command, testnet);
}

export function getLocalLink(
  init: { code: Cell; data: Cell },
  value: bigint,
  command: Cell | string,
  testnet: boolean,
) {
  return getLink(`ton://`, init, value, command, testnet);
}

export function get(init: { code: Cell; data: Cell }, value: bigint, command: Cell | string, testnet: boolean) {
  // Resolve target address
  const to = contractAddress(0, init);

  // Resovle init
  const initStr = base64url(beginCell().store(storeStateInit(init)).endCell().toBoc({ idx: false }));

  let link: string;

  link =
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

  return link;
}

export async function deploy(init: { code: Cell; data: Cell }, value: bigint, command: Cell | string, testnet = true) {
  const { kind } = await prompt<{ kind: 'tonhub' | 'tonkeeper' | 'local' }>([
    {
      type: 'select',
      name: 'kind',
      message: 'Way to deploy',
      initial: 0,
      choices: [
        {
          message: 'Tonhub/Sandbox',
          name: 'tonhub',
        },
        {
          message: 'Tonkeeper',
          name: 'tonkeeper',
        },
        {
          message: 'Open local link',
          name: 'local',
        },
      ],
    },
  ]);

  // Show tonhub link
  if (kind === 'tonhub') {
    printSeparator();
    console.log('Deploy: ' + getTonhubLink(init, value, command, testnet));
    printSeparator();

    return;
  }

  // Show tonkeeper link
  if (kind === 'tonkeeper') {
    printSeparator();
    console.log('Deploy: ' + getTonkeeperLink(init, value, command, testnet));
    printSeparator();

    return;
  }

  // Show tonkeeper link
  if (kind === 'local') {
    // Create a link and display to the user
    const l = getLocalLink(init, value, command, testnet);
    printSeparator();
    console.log('Deploy: ' + l);
    printSeparator();

    // Open link
    open(l);
  }
}
