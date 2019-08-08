import * as fs from 'fs';
import { parse } from './parse';
import {
  Interpreter,
  valueToString,
  math,
  standardLibrary,
  mapLibrary
} from './interpreter';

const args = process.argv.slice(2);

if (args.length !== 1) {
  console.log('Must provide source file as the single parameter.');
  process.exit(1);
}

const sourceFile = args[0];

fs.readFile(sourceFile, 'utf-8', async (_, source) => {
  try {
    const tree = parse(source);

    console.log(JSON.stringify(tree, null, 2));

    const interpreter = new Interpreter(tree, { debug: false });

    interpreter.addNativeLibrary(math);
    interpreter.addNativeLibrary(standardLibrary);
    interpreter.addNativeLibrary(mapLibrary);

    const result = await interpreter.evaluate();
    console.log(`[done] final value: ${valueToString(result)}`);
  } catch (e) {
    console.error(e);
  }
});
