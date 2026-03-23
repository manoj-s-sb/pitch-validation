import { execSync } from 'child_process';

try {
  const output = execSync('npx eslint . --ext .js,.jsx,.ts,.tsx', {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (output.trim()) {
    console.log(output);
  } else {
    console.log('✓ No ESLint issues found.');
  }
  process.exit(0);
} catch (error) {
  if (error.stdout) console.log(error.stdout);
  if (error.stderr) console.error(error.stderr);
  const issueCount = (error.stdout || '').match(/(\d+) problems?/);
  if (issueCount) {
    console.log(`\n✗ ESLint found ${issueCount[1]} problem(s).`);
  }
  process.exit(1);
}
