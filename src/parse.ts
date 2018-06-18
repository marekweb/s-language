import { Parser } from './parser';
import { Lexer } from './lexer';

export function parse(input: string) {
  const lexer = new Lexer(input);
  const tokens = lexer.lex();
  const parser = new Parser(tokens);
  return parser.parse();
}
