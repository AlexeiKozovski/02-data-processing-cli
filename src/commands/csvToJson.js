import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { OPERATION_FAILED_ERROR_MESSAGE } from '../shared/errors.js';

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      current += ch;
    } else if (ch === ',') {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }

  result.push(current.trim());
  return result;
}

function createCsvToJsonTransform() {
  let buffer = '';
  let headers = null;
  const rows = [];

  return new Transform({
    objectMode: false,
    transform(chunk, encoding, callback) {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.trim() === '') continue;

        const fields = parseCsvLine(line);

        if (headers === null) {
          headers = fields;
        } else {
          const obj = {};
          for (let i = 0; i < headers.length; i++) {
            obj[headers[i]] = fields[i] ?? '';
          }
          rows.push(obj);
        }
      }

      callback();
    },
    flush(callback) {
      if (buffer.trim() !== '' && headers !== null) {
        const fields = parseCsvLine(buffer);
        const obj = {};
        for (let i = 0; i < headers.length; i++) {
          obj[headers[i]] = fields[i] ?? '';
        }
        rows.push(obj);
      }

      const json = JSON.stringify(rows, null, 2);
      this.push(json);
      callback();
    },
  });
}

export const csvToJson = async (inputPath, outputPath) => {
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
    const transformStream = createCsvToJsonTransform();
    const writeStream = createWriteStream(resolvedOutput, { encoding: 'utf8' });

    await pipeline(readStream, transformStream, writeStream);
    return true;
  } catch {
    console.log(OPERATION_FAILED_ERROR_MESSAGE);
    return false;
  }
};
