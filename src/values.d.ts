interface IInterpreter {
  evaluate(): Promise<Val>;
}

type InterpreterOptions = {
  debug?: boolean;
  outputWriter?: IOutputWriter;
};

interface IOutputWriter {
  write(output: string): void;
}

type Val =
  | NumberValue
  | StringValue
  // | FunctionValue
  | MapValue
  | ListValue
  | BooleanValue
  | EmptyValue;

type InterpreterHandler = (interpreter: IInterpreter, args: Val[]) => Val;

type NumberValue = {
  type: 'NumberValue';
  value: number;
};

type StringValue = {
  type: 'StringValue';
  value: string;
};

type MapValue = {
  type: 'MapValue';
  value: Map<string, Val>;
};

type ListValue = {
  type: 'ListValue';
  value: Val[];
};

type BooleanValue = {
  type: 'BooleanValue';
  value: boolean;
};

type EmptyValue = {
  type: 'EmptyValue';
};
