import { Interpreter } from './interpreter';
import { parse } from './parse';

export function evaluate(
  input: string,
  options: InterpreterOptions
): Promise<Val> {
  const tree = parse(input);
  const interpreter = new Interpreter(tree, options);
  return interpreter.evaluate();
}
