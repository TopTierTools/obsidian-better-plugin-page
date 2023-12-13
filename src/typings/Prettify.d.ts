/* eslint-disable @typescript-eslint/ban-types */
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
