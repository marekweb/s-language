import { Lexer } from './lexer';

const samples: { input: string; output: Token[] }[] = [
  {
    input: '(hello world)',
    output: [
      { type: 'OpenBracket', bracket: 'RoundBracket', pos: 0 },
      { type: 'WordToken', value: 'hello', pos: 1 },
      { type: 'WhitespaceToken', value: ' ', pos: 6 },
      { type: 'WordToken', value: 'world', pos: 7 },
      { type: 'CloseBracket', bracket: 'RoundBracket', pos: 12 }
    ]
  },
  {
    input: '(print "Hello, world!")',
    output: [
      { type: 'OpenBracket', bracket: 'RoundBracket', pos: 0 },
      { type: 'WordToken', value: 'print', pos: 1 },
      { type: 'WhitespaceToken', value: ' ', pos: 6 },
      { type: 'StringToken', value: 'Hello, world!', pos: 7 },
      { type: 'CloseBracket', bracket: 'RoundBracket', pos: 22 }
    ]
  },
  {
    input: '([{(add [1 2 3])}])',
    output: [
      { type: 'OpenBracket', bracket: 'RoundBracket', pos: 0 },
      { type: 'OpenBracket', bracket: 'SquareBracket', pos: 1 },
      { type: 'OpenBracket', bracket: 'CurlyBracket', pos: 2 },
      { type: 'OpenBracket', bracket: 'RoundBracket', pos: 3 },
      { type: 'WordToken', value: 'add', pos: 4 },
      { type: 'WhitespaceToken', value: ' ', pos: 7 },
      { type: 'OpenBracket', bracket: 'SquareBracket', pos: 8 },
      { type: 'NumberToken', value: 1, pos: 9 },
      { type: 'WhitespaceToken', value: ' ', pos: 10 },
      { type: 'NumberToken', value: 2, pos: 11 },
      { type: 'WhitespaceToken', value: ' ', pos: 12 },
      { type: 'NumberToken', value: 3, pos: 13 },
      { type: 'CloseBracket', bracket: 'SquareBracket', pos: 14 },
      { type: 'CloseBracket', bracket: 'RoundBracket', pos: 15 },
      { type: 'CloseBracket', bracket: 'CurlyBracket', pos: 16 },
      { type: 'CloseBracket', bracket: 'SquareBracket', pos: 17 },
      { type: 'CloseBracket', bracket: 'RoundBracket', pos: 18 }
    ]
  },
  {
    input: '\n(\tprint\n\t"foo\nbar"\n)\n',
    output: [
      { type: 'WhitespaceToken', value: '\n', pos: 0 },
      { type: 'OpenBracket', bracket: 'RoundBracket', pos: 1 },
      { type: 'WhitespaceToken', value: '\t', pos: 2 },
      { type: 'WordToken', value: 'print', pos: 3 },
      { type: 'WhitespaceToken', value: '\n\t', pos: 8 },
      { type: 'StringToken', value: 'foo\nbar', pos: 10 },
      { type: 'WhitespaceToken', value: '\n', pos: 19 },
      { type: 'CloseBracket', bracket: 'RoundBracket', pos: 20 },
      { type: 'WhitespaceToken', value: '\n', pos: 21 }
    ]
  },
  {
    input: '(say "( ͡° ͜ʖ ͡°)")',
    output: [
      { type: 'OpenBracket', bracket: 'RoundBracket', pos: 0 },
      { type: 'WordToken', value: 'say', pos: 1 },
      { type: 'WhitespaceToken', value: ' ', pos: 4 },
      { type: 'StringToken', value: '( ͡° ͜ʖ ͡°)', pos: 5 },
      { type: 'CloseBracket', bracket: 'RoundBracket', pos: 18 }
    ]
  },
  {
    input: '(print hello.world)',
    output: [
      { type: 'OpenBracket', bracket: 'RoundBracket', pos: 0 },
      { type: 'WordToken', value: 'print', pos: 1 },
      { type: 'WhitespaceToken', value: ' ', pos: 6 },
      { type: 'WordToken', value: 'hello', pos: 7 },
      { type: 'AccessorToken', pos: 12 },
      { type: 'WordToken', value: 'world', pos: 13 },
      { type: 'CloseBracket', bracket: 'RoundBracket', pos: 18 }
    ]
  }
];

samples.forEach((sample, index) => {
  test(`sample ${index}`, () => {
    const lexer = new Lexer(sample.input);
    expect(lexer.lex()).toEqual(sample.output);
  });
});
