export type ASTNode =
  | ProgramNode
  | CallNode
  | ListConstructorNode
  | FunctionBodyNode
  | LiteralStringNode
  | LiteralNumberNode
  | WordNode
  | AccessorNode;

export interface IMyNode {
  type: string;
}

export interface ProgramNode extends IMyNode {
  type: 'ProgramNode';
  children: ASTNode[];
}

export interface CallNode extends IMyNode {
  type: 'CallNode';
  args: ASTNode[];
}

export interface ListConstructorNode extends IMyNode {
  type: 'ListConstructorNode';
  children: ASTNode[];
}

export interface FunctionBodyNode extends IMyNode {
  type: 'FunctionBodyNode';
  children: ASTNode[];
}

export interface LiteralStringNode extends IMyNode {
  type: 'LiteralStringNode';
  value: string;
}

export interface LiteralNumberNode extends IMyNode {
  type: 'LiteralNumberNode';
  value: number;
}

export interface WordNode extends IMyNode {
  type: 'WordNode';
  value: string;
}

export interface AccessorNode extends IMyNode {
  type: 'AccessorNode';
  left: ASTNode;
  right: ASTNode;
}
