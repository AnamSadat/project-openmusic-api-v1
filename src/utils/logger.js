import chalk from 'chalk';

export default function colorStatus(code) {
  if (code >= 500) return chalk.red(code);
  if (code >= 400) return chalk.yellow(code);
  if (code >= 300) return chalk.blue(code);
  return chalk.green(code);
}
