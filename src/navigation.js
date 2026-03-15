import fs from 'fs/promises';
import path from 'path';
import { OPERATION_FAILED_ERROR_MESSAGE } from './shared/errors.js';

export const up = async () => {
  const current = process.cwd();
  const parent = path.dirname(current);

  if (parent === current) {
    // Already at filesystem root – nothing to do, no error
    return false;
  }

  try {
    process.chdir(parent);
    return true;
  } catch {
    console.log(OPERATION_FAILED_ERROR_MESSAGE);
    return false;
  }
};

export const cd = async (target) => {
  try {
    const targetPath = path.isAbsolute(target)
      ? target
      : path.resolve(process.cwd(), target);

    const stats = await fs.stat(targetPath);

    if (!stats.isDirectory()) {
      console.log(OPERATION_FAILED_ERROR_MESSAGE);
      return false;
    }

    process.chdir(targetPath);
    return true;
  } catch {
    console.log(OPERATION_FAILED_ERROR_MESSAGE);
    return false;
  }
};

export const ls = async () => {
  try {
    const entries = await fs.readdir(process.cwd(), { withFileTypes: true });

    const folders = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    for (const name of folders) {
      console.log(`${name}\t[folder]`);
    }

    for (const name of files) {
      console.log(`${name}\t[file]`);
    }

    return true;
  } catch {
    console.log(OPERATION_FAILED_ERROR_MESSAGE);
    return false;
  }
};
