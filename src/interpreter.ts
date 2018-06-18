import chalk from 'chalk';
import { wrap, toJson } from './interop';

const EMPTY_VALUE: EmptyValue = {
  type: 'EmptyValue'
};

class ConsoleOutputWriter implements IOutputWriter {
  write(output: string) {
    console.log(`[${chalk.blue('print')}] ${output}`);
  }
}

type StackFrame = {
  func: FunctionBodyNode;
  locals: Map<string, Val>;
};

export class Interpreter implements IInterpreter {
  private isDebugEnabled: boolean;
  private tree: ASTNode;
  private globals = new Map<string, Val>();
  private callStack: StackFrame[] = [];

  private outputWriter: IOutputWriter = new ConsoleOutputWriter();
  constructor(tree: ASTNode, options: InterpreterOptions = {}) {
    this.tree = tree;
    if (options.outputWriter) {
      this.outputWriter = options.outputWriter;
    }
    this.isDebugEnabled = options.debug || false;
  }

  debug(message: string) {
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

  setGlobal(key: string, value: Val) {
    this.globals.set(key, value);
  }

  getGlobal(key: string): Val {
    const value = this.globals.get(key);
    if (!value) {
      return EMPTY_VALUE;
    }
    this.debug(`getGlobal ${key} ${valueToString(value)}`);
    return value;
  }

  async makeCall(word: string, args: ASTNode[] = []): Promise<Val> {
    switch (word) {
      case 'print': {
        const evaluatedArgs = await this.evaluateAll(args);
        const output = evaluatedArgs.map(valueToString).join(' ');
        this.outputWriter.write(output);
        return EMPTY_VALUE;
      }

      case 'add': {
        if (args.length !== 2) {
          throw new Error('add: must have 2 arguments');
        }
        const [firstArg, secondArg] = await this.evaluateAll(args);
        if (firstArg.type !== 'NumberValue') {
          throw new Error('add: first argument must be number');
        }
        if (secondArg.type !== 'NumberValue') {
          throw new Error('add: second argument must be number');
        }
        return { type: 'NumberValue', value: firstArg.value + secondArg.value };
      }

      case 'sub': {
        if (args.length !== 2) {
          throw new Error('add: must have 2 arguments');
        }
        const [firstArg, secondArg] = await this.evaluateAll(args);
        if (firstArg.type !== 'NumberValue') {
          throw new Error('add: first argument must be number');
        }
        if (secondArg.type !== 'NumberValue') {
          throw new Error('add: second argument must be number');
        }
        return { type: 'NumberValue', value: firstArg.value - secondArg.value };
      }

      case 'mul': {
        const evaluatedArgs = await this.evaluateAll(args);
        const result = evaluatedArgs.reduce((counter, val, index) => {
          if (val.type !== 'NumberValue') {
            throw new Error(
              `mul: argument ${index} must be a number (got ${val.type})`
            );
          }
          return counter * val.value;
        }, 1);
        return { type: 'NumberValue', value: result };
      }

      case 'flatten': {
        if (args.length !== 1) {
          throw new Error('flatten: expected 1 argument');
        }
        const evaluatedArg = await this.evaluateNode(args[0]);
        if (evaluatedArg.type !== 'ListValue') {
          throw new Error('flatten: argument must be a list');
        }
        return { type: 'ListValue', value: flatten(evaluatedArg) };
      }

      case 'cat': {
        const evaluatedArgs = await this.evaluateAll(args);
        const result = evaluatedArgs.map(valueToString).join('');
        return { type: 'StringValue', value: result };
      }

      case 'join': {
        if (args.length !== 1) {
          throw new Error('join: expected 1 argument');
        }
        const evaluatedArg = await this.evaluateNode(args[0]);
        if (evaluatedArg.type !== 'ListValue') {
          throw new Error('join: argument must be a list');
        }
        const result = evaluatedArg.value.map(valueToString).join('');
        return { type: 'StringValue', value: result };
      }

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

      case 'keys': {
        if (args.length !== 1) {
          throw new Error('keys: must have 1 argument');
        }

        const mapValue = await this.evaluateNode(args[0]);
        if (mapValue.type !== 'MapValue') {
          throw new Error('keys: argument must be a map');
        }

        const keys = Array.from(mapValue.value.keys()).map(wrap);

        return { type: 'ListValue', value: keys };
      }

      case 'mapset': {
        if (args.length !== 3) {
          throw new Error('set: must have 3 arguments');
        }

        const mapValue = await this.evaluateNode(args[0]);

        if (mapValue.type !== 'MapValue') {
          throw new Error('set: argument 1 must be a map');
        }

        const key = await this.evaluateAsIdentifier(args[1]);
        if (!key) {
          throw new Error('set: argument 2 must be an identifier');
        }

        const valueToSet = await this.evaluateNode(args[2]);

        mapValue.value.set(key, valueToSet);
        return mapValue;
      }

      case 'mapget': {
        if (args.length !== 2) {
          throw new Error('get: must have 2 arguments');
        }

        const mapValue = await this.evaluateNode(args[0]);
        if (mapValue.type !== 'MapValue') {
          throw new Error('get: argument 1 must be a map');
        }

        const key = await this.evaluateAsIdentifier(args[1]);
        if (!key) {
          throw new Error('get: argument 2 must be an identifier');
        }

        const potentialValue = mapValue.value.get(key);
        if (potentialValue === undefined) {
          return EMPTY_VALUE;
        }

        return potentialValue;
      }

      case 'map': {
        if (args.length !== 0) {
          throw new Error('map: takes no arguments');
        }

        return { type: 'MapValue', value: new Map<string, Val>() };
      }

      case 'each': {
        if (args.length !== 2) {
          throw new Error('each: takes 2 arguments');
        }

        const listValue = await this.evaluateNode(args[0]);
        if (listValue.type !== 'ListValue') {
          throw new Error('each: argument 1 must be a list');
        }

        const funcNode = args[1];
        if (funcNode.type !== 'FunctionBodyNode') {
          throw new Error('each: argument 2 must be a function body');
        }

        const results: Val[] = [];
        for (let i = 0; i < listValue.value.length; i++) {
          const arg = listValue.value[i];
          const result = await this.callUserFunction(funcNode, arg);
          results.push(result[results.length - 1]);
        }
        return { type: 'ListValue', value: results };
      }

      case 'tojson': {
        if (args.length !== 1) {
          throw new Error('tojson: must have 1 argument');
        }
        const value = await this.evaluateNode(args[0]);
        const jsonString = toJson(value);
        return wrap(jsonString);
      }

      default:
        throw new Error(`Cannot call unknown word: ${word}`);
    }
  }

  lookupName(name: string): Val {
    this.debug(`lookupName "${name}"`);
    for (let i = this.callStack.length - 1; i >= 0; i--) {
      const stackFrame = this.callStack[i];
      const foundValue = stackFrame.locals.get(name);
      if (foundValue) {
        return foundValue;
      }
    }
    return this.getGlobal(name);
  }

  async callUserFunction(func: FunctionBodyNode, arg: Val) {
    const callFrame = {
      func,
      locals: new Map<string, Val>([['arg', arg]])
    };
    this.callStack.push(callFrame);
    const result = await this.evaluateAll(func.children);
    return result;
  }

  async evaluate() {
    try {
      return this.evaluateNode(this.tree);
    } catch (e) {
      this.callStack.forEach(callFrame => {
        console.error(chalk.red('frame'));
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
      case 'FunctionBodyNode':
        const evaluatedExpressions = await this.evaluateAll(node.children);

        // Implicit return of the last expression
        return evaluatedExpressions[evaluatedExpressions.length - 1];
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

export function valueToString(value: Val): string {
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

    default:
      return `<${value.type}>`;
  }
}
