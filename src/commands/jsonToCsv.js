import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { OPERATION_FAILED_ERROR_MESSAGE } from '../shared/errors.js';

function escapeCsvField(value) {
  const str = String(value ?? '');
  if (/[,"\r\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function createJsonToCsvTransform() {
  let buffer = '';

  return new Transform({
    objectMode: false,
    transform(chunk, encoding, callback) {
      buffer += chunk.toString();
      callback();
    },
    flush(callback) {
      try {
        const data = JSON.parse(buffer);

        if (!Array.isArray(data) || data.length === 0) {
          callback(new Error('Invalid JSON: must be non-empty array'));
          return;
        }

        const first = data[0];
        if (first === null || typeof first !== 'object' || Array.isArray(first)) {
          callback(new Error('Invalid JSON: array must contain objects'));
          return;
        }

        const headers = Object.keys(first);
        const headerLine = headers.map(escapeCsvField).join(',') + '\n';
        this.push(headerLine);

        for (const obj of data) {
          if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
            callback(new Error('Invalid JSON: array must contain objects'));
            return;
          }
          const row = headers
            .map((key) => escapeCsvField(obj[key]))
            .join(',') + '\n';
          this.push(row);
        }

        callback();
      } catch (err) {
        callback(err);
      }
    },
  });
}

export const jsonToCsv = async (inputPath, outputPath) => {
  const cwd = process.cwd();
  const resolvedInput = path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(cwd, inputPath);
  const resolvedOutput = path.isAbsolute(outputPath)
    ? outputPath
    : path.resolve(cwd, outputPath);

  try {
    await fs.access(resolvedInput);
  } catch {
    console.log(OPERATION_FAILED_ERROR_MESSAGE);
    return false;
  }

  try {
    const readStream = createReadStream(resolvedInput, { encoding: 'utf8' });
    const transformStream = createJsonToCsvTransform();
    const writeStream = createWriteStream(resolvedOutput, { encoding: 'utf8' });

    await pipeline(readStream, transformStream, writeStream);
    return true;
  } catch {
    console.log(OPERATION_FAILED_ERROR_MESSAGE);
    return false;
  }
};
