import { parse } from './parse';

const samples: { input: string; output: ProgramNode }[] = [
  {
    input: '(hello)\n(world)',
    output: {
      type: 'ProgramNode',
      children: [
        {
          type: 'CallNode',
          args: [{ type: 'WordNode', value: 'hello' }]
        },
        {
          type: 'CallNode',
          args: [{ type: 'WordNode', value: 'world' }]
        }
      ]
    }
  },
  {
    input: '(hello ("world") [1 {2 3} 4] ())',
    output: {
      type: 'ProgramNode',
      children: [
        {
          type: 'CallNode',
          args: [
            {
              type: 'WordNode',
              value: 'hello'
            },
            {
              type: 'CallNode',
              args: [
                {
                  type: 'LiteralStringNode',
                  value: 'world'
                }
              ]
            },
            {
              type: 'ListConstructorNode',
              children: [
                { type: 'LiteralNumberNode', value: 1 },
                {
                  type: 'FunctionBodyNode',
                  children: [
                    {
                      type: 'CallNode',
                      args: [
                        { type: 'LiteralNumberNode', value: 2 },
                        { type: 'LiteralNumberNode', value: 3 }
                      ]
                    }
                  ]
                },
                { type: 'LiteralNumberNode', value: 4 }
              ]
            },
            {
              type: 'CallNode',
              args: []
            }
          ]
        }
      ]
    }
  },
  {
    input: 'a.b.c',
    output: {
      type: 'ProgramNode',
      children: [
        {
          type: 'CallNode',
          args: [
            {
              type: 'AccessorNode',
              left: {
                type: 'AccessorNode',
                left: {
                  type: 'WordNode',
                  value: 'a'
                },
                right: { type: 'WordNode', value: 'b' }
              },
              right: { type: 'WordNode', value: 'c' }
            }
          ]
        }
      ]
    }
  },
  {
    input: '([a].b).5',
    output: {
      type: 'ProgramNode',
      children: [
        {
          type: 'CallNode',
          args: [
            {
              type: 'AccessorNode',
              left: {
                type: 'CallNode',
                args: [
                  {
                    type: 'AccessorNode',
                    left: {
                      type: 'ListConstructorNode',
                      children: [{ type: 'WordNode', value: 'a' }]
                    },
                    right: { type: 'WordNode', value: 'b' }
                  }
                ]
              },
              right: { type: 'LiteralNumberNode', value: 5 }
            }
          ]
        }
      ]
    }
  },
  {
    input: `print [1 2 3]
`,
    output: {
      type: 'ProgramNode',
      children: [
        {
          type: 'CallNode',
          args: [
            { type: 'WordNode', value: 'print' },
            {
              type: 'ListConstructorNode',
              children: [
                { type: 'LiteralNumberNode', value: 1 },
                { type: 'LiteralNumberNode', value: 2 },
                { type: 'LiteralNumberNode', value: 3 }
              ]
            }
          ]
        }
      ]
    }
  }
];

samples.forEach((sample, index) => {
  test(`sample ${index}`, () => {
    expect(parse(sample.input)).toEqual(sample.output);
  });
});
