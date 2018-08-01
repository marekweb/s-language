import { Interpreter, mapLibrary, standardLibrary } from './interpreter';
import { parse } from './parse';

class LoggingOutputWriter implements IOutputWriter {
  private messages: string[] = [];
  write(output: string) {
    this.messages.push(output);
  }
  getMessages() {
    return this.messages;
  }
}

const samples = [
  {
    input: `(print (cat "hello, " "world"))`,
    output: ['hello, world']
  },
  {
    input: `
      (set myName "world")
      (set myGreeting (join ["hello, " (get myName)]))
      (print (get myGreeting))
    `,
    output: ['hello, world']
  },
  {
    input: `
      (set myList ["red" "green" "blue"])
      (each (get myList) { (print "hello," arg) } )
      (print "done")
    `,
    output: ['hello, red', 'hello, green', 'hello, blue', 'done']
  },
  {
    input: `
      (set myMap (map))
      (mapset myMap name "adam")
      (mapset myMap age 25)
      (mapset myMap colors ["red" "green" "blue"])
      (print (tojson (get myMap)))
    `,
    output: ['{"name":"adam","age":25,"colors":["red","green","blue"]}']
  },
  {
    input: `
      (set myMap (map))
      (set nestedMap (map))
      (mapset myMap submap nestedMap)
      (mapset nestedMap list [1 2 3])
      (print (tojson myMap))
    `,
    output: ['{"submap":{"list":[1,2,3]}}']
  }
];

samples.forEach((sample, index) => {
  test(`sample ${index}`, async () => {
    const tree = parse(sample.input);
    const outputWriter = new LoggingOutputWriter();
    const interpreter = new Interpreter(tree, { outputWriter });
    interpreter.addNativeLibrary(mapLibrary);
    interpreter.addNativeLibrary(standardLibrary);
    await interpreter.evaluate();
    expect(outputWriter.getMessages()).toEqual(sample.output);
  });
});
