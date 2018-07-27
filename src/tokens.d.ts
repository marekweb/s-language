type Token =
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

interface WordToken extends IToken {
  type: 'WordToken';
  value: string;
}

interface StringToken extends IToken {
  type: 'StringToken';
  value: string;
}

interface OpenToken extends IToken {
  type: 'OpenBracket';
  bracket: BracketType;
}

interface CloseToken extends IToken {
  type: 'CloseBracket';
  bracket: BracketType;
}

interface NumberToken extends IToken {
  type: 'NumberToken';
  value: number;
}

interface WhitespaceToken extends IToken {
  type: 'WhitespaceToken';
  value: string;
}

interface AccessorToken extends IToken {
  type: 'AccessorToken';
}

interface EndToken extends IToken {
  type: 'EndToken';
}

interface NewLineToken extends IToken {
  type: 'NewLineToken';
}
