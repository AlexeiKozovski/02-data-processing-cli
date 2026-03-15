import { homedir } from 'node:os';
import { startRepl } from './repl.js';

const main = async () => {
  const homeDir = homedir();
  process.chdir(homeDir);

  console.log('Welcome to Data Processing CLI!');
  console.log(`You are currently in ${homeDir}`);

  startRepl();
};

await main();
