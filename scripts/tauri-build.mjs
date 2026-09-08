import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const cargoBin = join(homedir(), '.cargo', 'bin');
const pathSep = process.platform === 'win32' ? ';' : ':';
const path = `${cargoBin}${pathSep}${process.env.PATH ?? ''}`;

const child = spawn('npx', ['tauri', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PATH: path },
});

child.on('exit', (code) => process.exit(code ?? 1));
