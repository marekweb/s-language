type ASTNode =
  | ProgramNode
  | CallNode
  | ListConstructorNode
  | FunctionBodyNode
  | LiteralStringNode
  | LiteralNumberNode
  | WordNode
  | AccessorNode;

interface IMyNode {
  type: string;
}

interface ProgramNode extends IMyNode {
  type: 'ProgramNode';
  children: ASTNode[];
}

interface CallNode extends IMyNode {
  type: 'CallNode';
  args: ASTNode[];
}

interface ListConstructorNode extends IMyNode {
  type: 'ListConstructorNode';
  children: ASTNode[];
}

interface FunctionBodyNode extends IMyNode {
  type: 'FunctionBodyNode';
  children: ASTNode[];
}

interface LiteralStringNode extends IMyNode {
  type: 'LiteralStringNode';
  value: string;
}

interface LiteralNumberNode extends IMyNode {
  type: 'LiteralNumberNode';
  value: number;
}

interface WordNode extends IMyNode {
  type: 'WordNode';
  value: string;
}

interface AccessorNode extends IMyNode {
  type: 'AccessorNode';
  left: ASTNode;
  right: ASTNode;
}
