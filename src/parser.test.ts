import { Parser } from './parser';
import { ProgramNode } from './nodes';
import { Token } from './tokens';

const samples: { input: Token[]; output: ProgramNode }[] = [
  {
    input: [
      { type: 'OpenBracket', bracket: 'RoundBracket' },
      { type: 'WordToken', value: 'hello' },
      { type: 'WhitespaceToken', value: ' ' },
      { type: 'WordToken', value: 'world' },
      { type: 'CloseBracket', bracket: 'RoundBracket' }
    ],
    output: {
      type: 'ProgramNode',
      children: [
        {
          type: 'CallNode',
          args: [
            { type: 'WordNode', value: 'hello' },
            { type: 'WordNode', value: 'world' }
          ]
        }
      ]
    }
  }
];

samples.forEach((sample, index) => {
  test(`sample ${index}`, () => {
    const parser = new Parser(sample.input);
    expect(parser.parse()).toEqual(sample.output);
  });
});
