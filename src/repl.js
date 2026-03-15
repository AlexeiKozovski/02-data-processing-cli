import readline from 'readline';
import { up, cd, ls } from './navigation.js';
import { INVALID_INPUT_ERROR_MESSAGE } from './shared/errors.js';

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
