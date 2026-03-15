import readline from 'readline';
import { up, cd, ls } from './navigation.js';
import { csvToJson } from './commands/csvToJson.js';
import { jsonToCsv } from './commands/jsonToCsv.js';
import { count } from './commands/count.js';
import { INVALID_INPUT_ERROR_MESSAGE } from './shared/errors.js';

const getOption = (args, name) => {
  const i = args.indexOf(name);
  if (i === -1 || i === args.length - 1) return null;
  return args[i + 1];
};

export const startRepl = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });

  const printCurrentDirectory = () => {
    console.log(`You are currently in ${process.cwd()}`);
  };

  rl.on('line', async (input) => {
    const trimmed = input.trim();

    if (!trimmed) {
      rl.prompt();
      return;
    }

    if (trimmed === '.exit') {
      console.log('Thank you for using Data Processing CLI!');
      rl.close();
      return;
    }

    const [command, ...args] = trimmed.split(/\s+/);
    let success = false;

    switch (command) {
      case 'up':
        if (args.length > 0) {
          console.log(INVALID_INPUT_ERROR_MESSAGE);
        } else {
          success = await up();
        }
        break;

      case 'cd':
        if (args.length !== 1) {
          console.log(INVALID_INPUT_ERROR_MESSAGE);
        } else {
          success = await cd(args[0]);
        }
        break;

      case 'ls':
        if (args.length > 0) {
          console.log(INVALID_INPUT_ERROR_MESSAGE);
        } else {
          success = await ls();
        }
        break;

      case 'csv-to-json': {
        const inputPath = getOption(args, '--input');
        const outputPath = getOption(args, '--output');
        if (!inputPath || !outputPath) {
          console.log(INVALID_INPUT_ERROR_MESSAGE);
        } else {
          success = await csvToJson(inputPath, outputPath);
        }
        break;
      }

      case 'json-to-csv': {
        const inputPath = getOption(args, '--input');
        const outputPath = getOption(args, '--output');
        if (!inputPath || !outputPath) {
          console.log(INVALID_INPUT_ERROR_MESSAGE);
        } else {
          success = await jsonToCsv(inputPath, outputPath);
        }
        break;
      }

      case 'count': {
        const inputPath = getOption(args, '--input');
        if (!inputPath) {
          console.log(INVALID_INPUT_ERROR_MESSAGE);
        } else {
          success = await count(inputPath);
        }
        break;
      }

      default:
        console.log(INVALID_INPUT_ERROR_MESSAGE);
        break;
    }

    if (success) {
      printCurrentDirectory();
    }

    rl.prompt();
  });

  rl.on('SIGINT', () => {
    console.log('\nThank you for using Data Processing CLI!');
    rl.close();
  });

  rl.on('close', () => {
    process.exit(0);
  });

  rl.prompt();
};
