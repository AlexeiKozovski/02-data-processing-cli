import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { Writable } from 'stream';
import { OPERATION_FAILED_ERROR_MESSAGE } from '../shared/errors.js';

function createCountTransform() {
  let lines = 0;
  let words = 0;
  let characters = 0;
  let lastCharWasWhitespace = true;

  return new Transform({
    objectMode: false,
    transform(chunk, encoding, callback) {
      const str = chunk.toString();
      characters += str.length;

      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (ch === '\n') lines++;
        if (/\s/.test(ch)) {
          lastCharWasWhitespace = true;
        } else {
          if (lastCharWasWhitespace) words++;
          lastCharWasWhitespace = false;
        }
      }

      callback();
    },
    flush(callback) {
      const out = `Lines: ${lines}\nWords: ${words}\nCharacters: ${characters}\n`;
      this.push(out);
      callback();
    },
  });
}

export const count = async (inputPath) => {
  const cwd = process.cwd();
  const resolvedInput = path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(cwd, inputPath);

  try {
    await fs.access(resolvedInput);
  } catch {
    console.log(OPERATION_FAILED_ERROR_MESSAGE);
    return false;
  }

  try {
    const readStream = createReadStream(resolvedInput, { encoding: 'utf8' });
    const countTransform = createCountTransform();
    const writable = new Writable({
      write(chunk, encoding, callback) {
        process.stdout.write(chunk);
        callback();
      },
    });

    await pipeline(readStream, countTransform, writable);
    return true;
  } catch {
    console.log(OPERATION_FAILED_ERROR_MESSAGE);
    return false;
  }
};
