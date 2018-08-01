///<reference path="./values.d.ts"/>

import { Interpreter, math, standardLibrary, mapLibrary } from './interpreter';
import { parse } from './parse';

export function evaluate(
  input: string,
  options: InterpreterOptions
): Promise<Val> {
  const tree = parse(input);
  const interpreter = new Interpreter(tree, options);
  interpreter.addNativeLibrary(standardLibrary);
  interpreter.addNativeLibrary(math);
  interpreter.addNativeLibrary(mapLibrary);
  return interpreter.evaluate();
}
