type PlainObject =
  | number
  | string
  | boolean
  | null
  | any[]
  | { [key: string]: any };

const EMPTY_VALUE: EmptyValue = { type: 'EmptyValue' };

export function wrap(value: PlainObject): Val {
  if (typeof value === 'string') {
    return { type: 'StringValue', value };
  }

  if (typeof value === 'number') {
    return { type: 'NumberValue', value };
  }

  if (typeof value === 'boolean') {
    return { type: 'BooleanValue', value };
  }

  if (value === null) {
    return EMPTY_VALUE;
  }

  if (Array.isArray(value)) {
    return { type: 'ListValue', value: value.map(wrap) };
  }

  if (typeof value === 'object') {
    const mapValue = new Map();
    for (let key in value) {
      if (value.hasOwnProperty(key)) {
        mapValue.set(key, wrap(value[key]));
      }
    }
    return { type: 'MapValue', value: mapValue };
  }

  throw new Error('wrap: not wrappable value');
}

export function unwrap(value: Val): PlainObject {
  switch (value.type) {
    case 'EmptyValue':
      return null;

    case 'BooleanValue':
      return value.value;

    case 'NumberValue':
      return value.value;

    case 'StringValue':
      return value.value;

    case 'ListValue':
      return value.value.map(unwrap);

    case 'MapValue':
      const object: { [key: string]: PlainObject } = {};
      value.value.forEach((value, key) => {
        object[key] = unwrap(value);
      });
      return object;

    case 'FunctionValue':
      throw new Error('Cannot serialized a function');
  }
}

export function toJson(value: Val): string {
  return JSON.stringify(unwrap(value));
}

export function fromJson(input: string): Val {
  const parsed = JSON.parse(input);
  return wrap(parsed);
}
