import * as fs from 'fs';
import { parse } from './parse';
import { Interpreter, valueToString } from './interpreter';

const args = process.argv.slice(2);

if (args.length !== 1) {
  console.log('Must provide source file as the single parameter.');
  process.exit(1);
}

const sourceFile = args[0];

fs.readFile(sourceFile, 'utf-8', async (err, source) => {
  try {
    const tree = parse(source);
    const interpreter = new Interpreter(tree, { debug: true });
    const result = await interpreter.evaluate();
    console.log(`[done] final value: ${valueToString(result)}`);
  } catch (e) {
    console.error(e);
  }
});
