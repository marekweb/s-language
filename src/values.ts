import { FunctionBodyNode } from './nodes';

export type Val =
  | NumberValue
  | StringValue
  | FunctionValue
  | MapValue
  | ListValue
  | BooleanValue
  | EmptyValue;

export type NumberValue = {
  type: 'NumberValue';
  value: number;
};

export type StringValue = {
  type: 'StringValue';
  value: string;
};

export type MapValue = {
  type: 'MapValue';
  value: Map<string, Val>;
};

export type ListValue = {
  type: 'ListValue';
  value: Val[];
};

export type BooleanValue = {
  type: 'BooleanValue';
  value: boolean;
};

export type EmptyValue = {
  type: 'EmptyValue';
};

export type FunctionValue = {
  type: 'FunctionValue';
  node: FunctionBodyNode;
};
