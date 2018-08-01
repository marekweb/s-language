import chalk from 'chalk';
import { wrap, toJson } from './interop';

interface IBuiltinCallableDefinition {
  type: string;
  args?: (Val['type'] | '*')[];
}

interface IBuiltinFunction extends IBuiltinCallableDefinition {
  type: 'function';
  execute(interpreter: Interpreter, args: Val[]): Promise<Val>;
}

interface IBuiltinMacro extends IBuiltinCallableDefinition {
  type: 'macro';
  execute(interpreter: Interpreter, args: ASTNode[]): Promise<Val>;
}

type NativeCallable = IBuiltinFunction | IBuiltinMacro;
type NativeCallableLibrary = { [key: string]: NativeCallable };

const EMPTY_VALUE: EmptyValue = {
  type: 'EmptyValue'
};

class ConsoleOutputWriter implements IOutputWriter {
  write(output: string) {
    console.log(`[${chalk.blue('print')}] ${output}`);
  }
}

type StackFrame = {
  func: FunctionValue;
  locals: Map<string, Val>;
};

export class Interpreter implements IInterpreter {
  private isDebugEnabled: boolean;
  private tree: ASTNode;
  private globals = new Map<string, Val>();
  private callStack: StackFrame[] = [];
  private nativeCallables = new Map<string, NativeCallable>();

  private outputWriter?: IOutputWriter = new ConsoleOutputWriter();
  constructor(tree: ASTNode, options: InterpreterOptions = {}) {
    this.tree = tree;
    if (options.outputWriter) {
      this.outputWriter = options.outputWriter;
    }
    this.isDebugEnabled = options.debug || false;
  }

  writeOutput(output: string) {
    if (this.outputWriter) {
      this.outputWriter.write(output);
    }
  }

  private debug(message: string) {
    if (this.isDebugEnabled) {
      console.log(`[${chalk.green('debug')}] ${message}`);
    }
  }

  async evaluateAll(items: ASTNode[]): Promise<Val[]> {
    const results = [];
    for (let i = 0; i < items.length; i++) {
      const result = await this.evaluateNode(items[i]);
      results.push(result);
    }
    return results;
  }

  private setGlobal(key: string, value: Val) {
    this.globals.set(key, value);
  }

  private getGlobal(key: string): Val {
    const value = this.globals.get(key);
    if (!value) {
      return EMPTY_VALUE;
    }
    this.debug(`getGlobal ${key} ${valueToString(value)}`);
    return value;
  }

  private async makeCall(word: string, args: ASTNode[] = []): Promise<Val> {
    switch (word) {
      case 'set': {
        if (args.length !== 2) {
          throw new Error('set: must have 2 arguments');
        }
        const key = await this.evaluateAsIdentifier(args[0]);
        if (!key) {
          throw new Error('set: argument 1 must be an identifier');
        }
        const value = await this.evaluateNode(args[1]);
        this.setGlobal(key, value);
        return value;
      }

      case 'get': {
        if (args.length !== 1) {
          throw new Error('get: must have 1 argument');
        }
        const key = await this.evaluateAsIdentifier(args[0]);
        this.debug(`get ${key}`);

        if (!key) {
          throw new Error('get: argument must be an identifier');
        }

        return this.lookupName(key);
      }

      default:
        const callable = this.nativeCallables.get(word);
        if (!callable) {
          throw new Error(`Cannot call unknown word: ${word}`);
        }
        if (callable.type === 'function') {
          if (callable.args) {
            if (callable.args.length !== args.length) {
              throw new Error(
                `${word}: got ${args.length} arguments but expected ${
                  callable.args.length
                }.`
              );
            }
          }
          const evaluatedArgs = await this.evaluateAll(args);
          if (callable.args) {
            callable.args.forEach((argType, i) => {
              if (argType !== '*' && argType !== evaluatedArgs[i].type) {
                throw new Error(
                  `${word}: argument ${i + 1} is ${
                    args[i].type
                  } but expected ${argType}.`
                );
              }
            });
          }
          return callable.execute(this, evaluatedArgs);
        } else {
          return callable.execute(this, args);
        }
    }
  }

  private lookupName(name: string): Val {
    for (let i = this.callStack.length - 1; i >= 0; i--) {
      const stackFrame = this.callStack[i];
      const foundValue = stackFrame.locals.get(name);
      if (foundValue) {
        return foundValue;
      }
    }
    return this.getGlobal(name);
  }

  async callUserFunction(func: FunctionValue, arg: Val): Promise<Val> {
    const functionBodyNode = func.node;
    const callFrame = {
      func,
      locals: new Map<string, Val>([['arg', arg]])
    };
    this.callStack.push(callFrame);
    const result = await this.evaluateAll(functionBodyNode.children);
    // Return the last value
    return result[result.length - 1];
  }

  async evaluate() {
    try {
      return this.evaluateNode(this.tree);
    } catch (e) {
      this.callStack.forEach(callFrame => {
        console.error(chalk.red('frame'), callFrame.func);
      });
      console.error(chalk.red(e));
    }
    return EMPTY_VALUE;
  }

  async evaluateNode(node: ASTNode): Promise<Val> {
    switch (node.type) {
      case 'WordNode': {
        const foundValue = this.lookupName(node.value);
        if (foundValue) {
          return foundValue;
        } else {
          throw new Error(
            `Not a word that can be used: "${node.value}" ${JSON.stringify(
              node
            )}`
          );
        }
      }

      case 'LiteralStringNode':
        return { type: 'StringValue', value: node.value };

      case 'LiteralNumberNode':
        return { type: 'NumberValue', value: node.value };

      case 'CallNode':
        // 1. First element must be callable
        if (node.args.length === 0) {
          throw new Error('Cannot evaluate empty parentheses');
        }

        const callableNode = node.args[0];
        if (callableNode.type !== 'WordNode') {
          throw new Error(`Cannot call this a ${callableNode.type})`);
        }

        return this.makeCall(callableNode.value, node.args.slice(1));

      case 'ListConstructorNode':
        const childrenValues = await Promise.all(
          node.children.map(child => this.evaluateNode(child))
        );
        return { type: 'ListValue', value: childrenValues };

      case 'ProgramNode':
        const evaluatedExpressions = await this.evaluateAll(node.children);

        // Implicit return of the last expression
        return evaluatedExpressions[evaluatedExpressions.length - 1];

      case 'FunctionBodyNode':
        return { type: 'FunctionValue', node };
    }

    return { type: 'EmptyValue' };
  }

  async evaluateAsIdentifier(node: ASTNode): Promise<string | null> {
    if (node.type === 'WordNode') {
      return node.value;
    }

    const value = await this.evaluateNode(node);
    if (value.type === 'StringValue') {
      return value.value;
    }

    return null;
  }

  addNativeCallable(name: string, builtin: NativeCallable) {
    this.debug(`adding native callable: ${name}`);
    this.nativeCallables.set(name, builtin);
  }

  addNativeLibrary(library: NativeCallableLibrary) {
    for (let key in library) {
      this.addNativeCallable(key, library[key]);
    }
  }
}

export function valueToString(value: Val): string {
  if (value == undefined) {
    return '<null>';
  }

  switch (value.type) {
    case 'StringValue':
      return value.value;

    case 'NumberValue':
    case 'BooleanValue':
      return JSON.stringify(value.value);

    case 'ListValue':
      return JSON.stringify(value.value.map(valueToString));

    case 'MapValue':
      return JSON.stringify([...value.value]);

    case 'FunctionValue':
      return '<func>';

    default:
      return `<${value.type}>`;
  }
}

function flatten(list: ListValue): Val[] {
  const result: Val[] = [];
  list.value.forEach(item => {
    if (item.type === 'ListValue') {
      result.push(...flatten(item));
    } else {
      result.push(item);
    }
  });
  return result;
}

function toBoolean(value: Val): boolean {
  switch (value.type) {
    case 'EmptyValue':
      return false;

    case 'StringValue':
      return !!value.value.length;

    case 'NumberValue':
      return !!value.value;

    case 'BooleanValue':
      return value.value;

    default:
      return true;
  }
}

function isEqual(a: Val, b: Val): boolean {
  if (a.type === 'NumberValue' && b.type === 'NumberValue') {
    return a.value === b.value;
  } else if (a.type === 'StringValue' && b.type === 'StringValue') {
    return a.value === b.value;
  } else if (a.type === 'BooleanValue' && b.type === 'BooleanValue') {
    return a.value === b.value;
  } else if (a.type === 'EmptyValue' && b.type === 'EmptyValue') {
    return true;
  } else if (a.type === 'FunctionValue' && b.type === 'FunctionValue') {
    return a.node === b.node;
  }

  return a === b;
}

export const standardLibrary: NativeCallableLibrary = {
  join: {
    type: 'function',
    args: ['ListValue'],
    async execute(_, args: [ListValue]) {
      const arg = args[0];
      const result = arg.value.map(valueToString).join('');
      return { type: 'StringValue', value: result };
    }
  },
  flatten: {
    type: 'function',
    args: ['ListValue'],
    async execute(_, args: [ListValue]): Promise<Val> {
      const listValue = args[0];
      return { type: 'ListValue', value: flatten(listValue) };
    }
  },
  keys: {
    type: 'function',
    args: ['MapValue'],
    async execute(_, args: [MapValue]) {
      const mapValue = args[0];
      const keys = Array.from(mapValue.value.keys()).map(wrap);
      return { type: 'ListValue', value: keys };
    }
  },

  cat: {
    type: 'function',
    async execute(_: Interpreter, args: Val[]): Promise<Val> {
      const result = args.map(valueToString).join('');
      return { type: 'StringValue', value: result };
    }
  },

  print: {
    type: 'macro',
    async execute(interpreter: Interpreter, args: ASTNode[]): Promise<Val> {
      const evaluatedArgs = await interpreter.evaluateAll(args);
      const output = evaluatedArgs.map(valueToString).join(' ');
      interpreter.writeOutput(output);
      return EMPTY_VALUE;
    }
  },

  tojson: {
    type: 'function',
    args: ['*'],
    async execute(_: Interpreter, args: Val[]): Promise<Val> {
      if (args.length !== 1) {
        throw new Error('tojson: must have 1 argument');
      }
      const jsonString = toJson(args[0]);
      return wrap(jsonString);
    }
  },

  each: {
    type: 'function',
    args: ['ListValue', 'FunctionValue'],
    async execute(interpreter, args: [ListValue, FunctionValue]) {
      const listValue = args[0];
      const funcValue = args[1];

      const results: Val[] = [];
      for (let i = 0; i < listValue.value.length; i++) {
        const arg = listValue.value[i];
        const result = await interpreter.callUserFunction(funcValue, arg);
        results.push(result);
      }
      return { type: 'ListValue', value: results };
    }
  },

  equals: {
    type: 'function',
    async execute(_, args) {
      if (args.length === 0) {
        throw new Error('equals: must have at least 1 argument');
      }
      const referenceArg = args[0];
      const result = args.slice(1).every(arg => isEqual(referenceArg, arg));
      return { type: 'BooleanValue', value: result };
    }
  },

  if: {
    type: 'macro',
    async execute(interpreter, args) {
      if (args.length < 2 || args.length > 3) {
        throw new Error('if: must have 2 or 3 arguments');
      }
      const conditionValue = await interpreter.evaluateNode(args[0]);

      if (toBoolean(conditionValue)) {
        const func = await interpreter.evaluateNode(args[1]);
        if (func.type !== 'FunctionValue') {
          throw new Error('if: argument 2 must be a function');
        }
        // TODO: for some reason `callUserFunction` requires a value argument
        return interpreter.callUserFunction(func, EMPTY_VALUE);
      } else if (args.length === 3) {
        const func = await interpreter.evaluateNode(args[2]);
        if (func.type !== 'FunctionValue') {
          throw new Error('if: argument 2 must be a function');
        }
        return interpreter.callUserFunction(func, EMPTY_VALUE);
      }
      return EMPTY_VALUE;
    }
  }
};

export const mapLibrary: NativeCallableLibrary = {
  map: {
    type: 'function',
    args: [],
    async execute() {
      return { type: 'MapValue', value: new Map<string, Val>() };
    }
  },

  mapset: {
    type: 'macro',
    async execute(interpreter, args) {
      const mapValue = await interpreter.evaluateNode(args[0]);
      if (mapValue.type !== 'MapValue') {
        throw new Error('mapset: argument 1 must be a map');
      }

      const key = await interpreter.evaluateAsIdentifier(args[1]);
      if (!key) {
        throw new Error('mapset: argument 2 must be an identifier');
      }

      const valueToSet = await interpreter.evaluateNode(args[2]);

      mapValue.value.set(key, valueToSet);
      return mapValue;
    }
  },
  mapget: {
    type: 'macro',
    async execute(interpreter, args) {
      const mapValue = await interpreter.evaluateNode(args[0]);
      if (mapValue.type !== 'MapValue') {
        throw new Error('mapget: argument 1 must be a map');
      }
      const key = await interpreter.evaluateAsIdentifier(args[1]);
      if (!key) {
        throw new Error('mapget: argument 2 must be an identifier');
      }

      const value = mapValue.value.get(key);
      if (!value) {
        return EMPTY_VALUE;
      }

      return value;
    }
  }
};

export const math: NativeCallableLibrary = {
  add: {
    type: 'function',
    args: ['NumberValue', 'NumberValue'],
    async execute(_, args: [NumberValue, NumberValue]) {
      return { type: 'NumberValue', value: args[0].value + args[1].value };
    }
  },

  sub: {
    type: 'function',
    args: ['NumberValue', 'NumberValue'],
    async execute(_, args: [NumberValue, NumberValue]) {
      return { type: 'NumberValue', value: args[0].value - args[1].value };
    }
  },

  mul: {
    type: 'function',
    args: ['NumberValue', 'NumberValue'],
    async execute(_, args: [NumberValue, NumberValue]) {
      return { type: 'NumberValue', value: args[0].value * args[1].value };
    }
  },

  div: {
    type: 'function',
    args: ['NumberValue', 'NumberValue'],
    async execute(_, args: [NumberValue, NumberValue]) {
      return { type: 'NumberValue', value: args[0].value / args[1].value };
    }
  }
};
