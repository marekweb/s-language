import { isAlpha, isAlphaNumeric, isNumeric, isWhitespace } from './utils';

enum LexerState {
  Empty,
  Whitespace,
  Word,
  Number,
  String,
  Error,
  Done
}

export class Lexer {
  private state: LexerState = LexerState.Empty;
  private tokens: Token[] = [];
  private pos: number = 0;
  private marker: number = 0;
  private input: string = '';

  constructor(input: string) {
    this.input = input;
  }

  nextChar() {
    return this.input.charCodeAt(++this.pos);
  }

  backup() {
    this.pos--;
  }

  extractSlice() {
    const slice = this.input.slice(this.marker, this.pos);
    this.marker = this.pos;
    return slice;
  }

  nextState(c: number) {
    switch (this.state) {
      case LexerState.Empty:
        if (isAlpha(c)) {
          this.marker = this.pos;
          this.pos++;
          this.state = LexerState.Word;
          return;
        }

        if (isNumeric(c)) {
          this.marker = this.pos;
          this.pos++;
          this.state = LexerState.Number;
          return;
        }

        if (isWhitespace(c)) {
          this.marker = this.pos;
          this.pos++;
          this.state = LexerState.Whitespace;
          return;
        }

        const symbolToken = this.identifySymbol(c);
        if (symbolToken) {
          this.tokens.push(symbolToken);
          this.pos++;
          return;
        }

        if (c === 34) {
          this.state = LexerState.String;
          this.marker = this.pos;
          this.pos++;
          return;
        }

        if (Number.isNaN(c)) {
          this.state = LexerState.Done;
          return;
        }

        this.state = LexerState.Error;
        return;

      case LexerState.Whitespace:
        if (!isWhitespace(c)) {
          this.state = LexerState.Empty;
          const value = this.input.slice(this.marker, this.pos);
          this.tokens.push({
            type: 'WhitespaceToken',
            value,
            pos: this.marker
          });
          this.marker = this.pos;
          return;
        }
        this.pos++;
        return;

      case LexerState.Number:
        if (!isNumeric(c)) {
          this.state = LexerState.Empty;
          const slice = this.input.slice(this.marker, this.pos);
          const value = parseInt(slice, 10);
          this.tokens.push({
            type: 'NumberToken',
            value,
            pos: this.marker
          });
          this.marker = this.pos;
          return;
        }
        this.pos++;
        return;

      case LexerState.Word: {
        if (!isAlphaNumeric(c)) {
          this.state = LexerState.Empty;
          const value = this.input.slice(this.marker, this.pos);
          this.tokens.push({
            type: 'WordToken',
            value,
            pos: this.marker
          });
          this.marker = this.pos;
          return;
        }

        this.pos++;
        return;
      }

      case LexerState.String: {
        if (c === 34) {
          this.state = LexerState.Empty;
          const value = this.input.slice(this.marker + 1, this.pos);
          this.tokens.push({
            type: 'StringToken',
            value,
            pos: this.marker
          });
          this.marker = this.pos;
          this.pos++;
          return;
        }
        this.pos++;
        return;
      }
    }
  }

  lex(): Token[] {
    while (this.pos < this.input.length + 1) {
      const c = this.input.charCodeAt(this.pos);
      this.nextState(c);

      if (this.state === LexerState.Done) {
        break;
      }

      if (this.state === LexerState.Error) {
        throw new Error('LexerState.Error');
      }
    }

    return this.tokens;
  }

  identifySymbol(c: number): Token | null {
    switch (c) {
      case 40:
        return { type: 'OpenBracket', bracket: 'RoundBracket', pos: this.pos };

      case 41:
        return { type: 'CloseBracket', bracket: 'RoundBracket', pos: this.pos };

      case 91:
        return { type: 'OpenBracket', bracket: 'SquareBracket', pos: this.pos };

      case 93:
        return {
          type: 'CloseBracket',
          bracket: 'SquareBracket',
          pos: this.pos
        };

      case 123:
        return { type: 'OpenBracket', bracket: 'CurlyBracket', pos: this.pos };

      case 125:
        return { type: 'CloseBracket', bracket: 'CurlyBracket', pos: this.pos };

      case 46:
        return { type: 'AccessorToken', pos: this.pos };

      default:
        return null;
    }
  }
}
