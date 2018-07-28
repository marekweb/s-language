export class Parser {
  private pos: number = 0;
  private readonly tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = Parser.prepareTokensForParsing(tokens);
  }

  private static prepareTokensForParsing(tokens: Token[]): Token[] {
    return [
      ...tokens.filter(token => token.type !== 'WhitespaceToken'),
      { type: 'EndToken' }
    ];
  }

  getNextToken(): Token {
    return this.tokens[this.pos++];
  }

  getCurrentToken(): Token {
    return this.tokens[this.pos];
  }

  acceptToken(type: Token['type']): Token | null {
    const token = this.getCurrentToken();
    if (token.type === type) {
      this.pos++;
      return token;
    }
    return null;
  }

  expectToken(type: Token['type']): Token {
    const token = this.acceptToken(type);
    if (!token) {
      throw new Error(
        `Expecting ${type} but saw ${
          this.getCurrentToken().type
        } at token index ${this.pos}`
      );
    }
    return token;
  }

  parse(): ProgramNode {
    return this.parseProgramNode();
  }

  parseNode(): ASTNode {
    let node = this.parseAtom();
    while (true) {
      const nextToken = this.getCurrentToken();
      if (nextToken.type === 'AccessorToken') {
        this.pos++;
        const right = this.parseAtom();
        node = { type: 'AccessorNode', left: node, right };
      } else {
        return node;
      }
    }
  }

  parseAtom(): ASTNode {
    const token = this.getNextToken();

    switch (token.type) {
      case 'NumberToken':
        return { type: 'LiteralNumberNode', value: token.value };
        break;

      case 'StringToken':
        return { type: 'LiteralStringNode', value: token.value };
        break;

      case 'WordToken':
        return { type: 'WordNode', value: token.value };
        break;

      case 'AccessorToken':
        throw new Error('Accessor token without a token to the left');

      case 'OpenBracket':
        switch (token.bracket) {
          case 'RoundBracket':
            return this.parseCallNode();
            break;

          case 'SquareBracket':
            return this.parseListConstructorNode();
            break;

          case 'CurlyBracket':
            return this.parseFunctionBodyNode();
            break;

          default:
            throw new Error(`Invalid bracket value ${token.bracket}`);
        }

        break;

      default:
        throw new Error(`Unknown token ${token.type}`);
    }
  }

  parseProgramNode(): ProgramNode {
    const children: ASTNode[] = [];
    const node: ProgramNode = { type: 'ProgramNode', children };
    while (true) {
      const token = this.getCurrentToken();
      if (token.type === 'EndToken') {
        return node;
      }

      const lineNode = this.parseLine();

      // Keep the line only if it's non-blank.
      if (lineNode.args.length) {
        children.push(lineNode);
      }
    }
  }

  parseCallNode(): CallNode {
    const children: ASTNode[] = [];
    const node: CallNode = { type: 'CallNode', args: children };
    while (true) {
      const token = this.getCurrentToken();
      if (token.type === 'CloseBracket' && token.bracket === 'RoundBracket') {
        this.pos++;
        return node;
      }

      const childNode = this.parseNode();
      children.push(childNode);
    }
  }

  parseListConstructorNode(): ListConstructorNode {
    const children: ASTNode[] = [];
    const node: ListConstructorNode = { type: 'ListConstructorNode', children };
    while (true) {
      const token = this.getCurrentToken();
      if (token.type === 'CloseBracket' && token.bracket === 'SquareBracket') {
        this.pos++;
        return node;
      }

      const childNode = this.parseNode();
      children.push(childNode);
    }
  }

  parseFunctionBodyNode(): FunctionBodyNode {
    const children: ASTNode[] = [];
    const node: FunctionBodyNode = { type: 'FunctionBodyNode', children };
    while (true) {
      const token = this.getCurrentToken();
      if (token.type === 'CloseBracket' && token.bracket === 'CurlyBracket') {
        this.pos++;
        return node;
      }

      const childNode = this.parseNode();
      children.push(childNode);
    }
  }

  parseLine(insideFunctionBody: boolean = false): CallNode {
    const children: ASTNode[] = [];
    while (true) {
      const token = this.getCurrentToken();
      if (token.type === 'EndToken') {
        break;
      }

      if (token.type === 'NewLineToken') {
        this.pos++;
        break;
      }

      if (
        insideFunctionBody &&
        token.type === 'CloseBracket' &&
        token.bracket === 'RoundBracket'
      ) {
        this.pos++;
        break;
      }

      const childNode = this.parseNode();
      children.push(childNode);
    }

    if (children.length === 1) {
      const firstChild = children[0];
      if (firstChild.type === 'CallNode') {
        return firstChild;
      }
    }

    return { type: 'CallNode', args: children };
  }
}
