import { camelCase, isNil, lowerCase, snakeCase } from 'lodash';

const Debug = require('debug');

const debug = Debug('fastify-transform-body-plugin');

export enum CaseFormat {
  LowerCase = 'LOWER_CASE',
  CamelCase = 'CAMEL_CASE',
  SnakeCase = 'SNAKE_CASE',
}

export enum ErrorType {
  MalformattedKey = 'MALFORMATTED_KEY',
  UnparseableValue = 'UNPARSEABLE_VALUE',
}

export type MatchingHandler = (input: any) => boolean;
export type FormattingHandler = (input: any) => any;

export interface MapperOptions {
  toCase: CaseFormat;
  fromCase?: CaseFormat;
  formatters?: Formatter[];
  rootPath?: string;
  errors?: MapperError[];
}

export interface Formatter {
  name: string;
  matched: MatchingHandler;
  handler: FormattingHandler;
}

export interface MapperError {
  type: ErrorType;
  path: string;
  value?: any;
}

const transformers = {
  [CaseFormat.LowerCase]: lowerCase,
  [CaseFormat.CamelCase]: camelCase,
  [CaseFormat.SnakeCase]: snakeCase,
};

const regexes = {
  [CaseFormat.LowerCase]: /^([a-z])*$/,
  [CaseFormat.CamelCase]: /[a-z]([A-Z0-9]*[a-z][a-z0-9]*[A-Z]|[a-z0-9]*[A-Z][A-Z0-9]*[a-z])[A-Za-z0-9]*$/,
  [CaseFormat.SnakeCase]: /^([a-z]{1,})(_[a-z0-9]{1,})*$/,
};

const validators = {
  [CaseFormat.CamelCase]: input => {
    return regexes[CaseFormat.LowerCase].test(input) || regexes[CaseFormat.CamelCase].test(input);
  },
  [CaseFormat.SnakeCase]: input => {
    return regexes[CaseFormat.LowerCase].test(input) || regexes[CaseFormat.SnakeCase].test(input);
  },
};

const formatters = [
  {
    name: 'null or undefined',
    matched: input => isNil(input),
    handler: input => {
      return null;
    },
  },
  {
    name: 'plain value',
    matched: input => typeof input !== 'object',
    handler: input => {
      return input;
    },
  },
  {
    name: 'Date object',
    matched: input => input instanceof Date,
    handler: input => {
      return input.toISOString();
    },
  },
];

export function mapper(input: any, options: MapperOptions) {
  const validator = options.fromCase ? validators[options.fromCase] : null;
  const transformer = transformers[options.toCase];

  if (!options.rootPath) {
    options.rootPath = '$';
  }

  if (!options.errors) {
    options.errors = [];
  }

  if (!options.formatters) {
    options.formatters = [];
  }

  if (options.rootPath === '$') {
    options.formatters = [...formatters, ...options.formatters];
  }

  const result = {
    success: false,
    value: null,
    errors: options.errors,
  };

  // Arrays
  if (Array.isArray(input)) {
    debug('Matched array:', input);
    result.success = true;
    result.value = input.map(item => {
      const stepResult = mapper(item, options);
      return stepResult.value;
    });
  }

  // Formatters
  if (!result.value) {
    for (const formatter of options.formatters) {
      if (formatter.matched(input)) {
        debug(`Matched ${formatter.name}:`, input);
        result.success = true;
        result.value = formatter.handler(input);
        break;
      }
    }
  }

  if (!result.value) {
    if (input.constructor.name === 'Object') {
      debug('Matched nested object:', input);
      const keys = Object.keys(input);
      result.success = true;
      result.value = keys.reduce(function mapObjectKeysReducer(newObj, key) {
        const value = input[key];

        const stepResult = mapper(value, { ...options, rootPath: `${options.rootPath}.${key}` });

        if (stepResult.success === false) {
          result.errors.push({
            type: ErrorType.UnparseableValue,
            path: [options.rootPath, key].join('.'),
            value,
          });
        }

        const newVal = stepResult.value;

        if (validator && !validator(key)) {
          result.errors.push({
            type: ErrorType.MalformattedKey,
            path: [options.rootPath, key].join('.'),
          });
        }

        const newKey = transformer ? transformer(key) : key;
        newObj[newKey] = newVal;
        return newObj;
      }, {});
    }
  }

  if (options.rootPath === '$' && result.success === false) {
    result.errors.push({
      type: ErrorType.UnparseableValue,
      path: options.rootPath,
      value: input,
    });
  }

  return result;
}
