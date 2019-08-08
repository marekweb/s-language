export type Token =
  | StringToken
  | NumberToken
  | WordToken
  | WhitespaceToken
  | OpenToken
  | CloseToken
  | AccessorToken
  | NewLineToken
  | EndToken;

interface IToken {
  readonly type: string;
  readonly pos?: number;
}

export interface WordToken extends IToken {
  type: 'WordToken';
  value: string;
}

export interface StringToken extends IToken {
  type: 'StringToken';
  value: string;
}

export interface OpenToken extends IToken {
  type: 'OpenBracket';
  bracket: BracketType;
}

export interface CloseToken extends IToken {
  type: 'CloseBracket';
  bracket: BracketType;
}

export interface NumberToken extends IToken {
  type: 'NumberToken';
  value: number;
}

export interface WhitespaceToken extends IToken {
  type: 'WhitespaceToken';
  value: string;
}

export interface AccessorToken extends IToken {
  type: 'AccessorToken';
}

export interface EndToken extends IToken {
  type: 'EndToken';
}

export interface NewLineToken extends IToken {
  type: 'NewLineToken';
}
