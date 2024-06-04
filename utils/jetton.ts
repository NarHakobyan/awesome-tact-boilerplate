import { Sha256 } from '@aws-crypto/sha256-js';
import type { Cell } from '@ton/core';
import { beginCell, Dictionary } from '@ton/core';

const ONCHAIN_CONTENT_PREFIX = 0x00;
const SNAKE_PREFIX = 0x00;
const CELL_MAX_SIZE_BYTES = Math.floor((1023 - 8) / 8);

function bufferToChunks(buff: Buffer, chunkSize: number) {
  const chunks: Buffer[] = [];

  while (buff.byteLength > 0) {
    chunks.push(buff.subarray(0, chunkSize));
    buff = buff.subarray(chunkSize);
  }

  return chunks;
}

export function makeSnakeCell(data: Buffer) {
  const chunks = bufferToChunks(data, CELL_MAX_SIZE_BYTES);

  let curCell = beginCell();

  for (const chunk of chunks) {
    const index = chunks.indexOf(chunk);

    if (index === 0) {
      curCell.storeInt(SNAKE_PREFIX, 8);
    }

    curCell.storeBuffer(chunk);

    if (index > 0) {
      const cell = curCell.endCell();

      curCell = beginCell().storeRef(cell);
    }
  }

  return curCell.endCell();
}

const sha256 = (str: string) => {
  const sha = new Sha256();
  sha.update(str);

  return Buffer.from(sha.digestSync());
};

const toKey = (key: string) => BigInt(`0x${sha256(key).toString('hex')}`);

export function buildOnchainMetadata(data: { name: string; description: string; image: string; symbol: string }): Cell {
  const dict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());

  for (const [key, value] of Object.entries(data)) {
    dict.set(toKey(key), makeSnakeCell(Buffer.from(value, 'utf8')));
  }

  return beginCell().storeInt(ONCHAIN_CONTENT_PREFIX, 8).storeDict(dict).endCell();
}
