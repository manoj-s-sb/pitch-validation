import { execSync } from 'child_process';

try {
  const output = execSync('npx prettier --write .', {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (output.trim()) {
    console.log(output);
  }
  console.log('✓ Prettier formatting complete.');
  process.exit(0);
} catch (error) {
  if (error.stdout) console.log(error.stdout);
  if (error.stderr) console.error(error.stderr);
  console.log('✗ Prettier formatting failed.');
  process.exit(1);
}
