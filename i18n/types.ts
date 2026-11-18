import type { en } from "./dictionaries/en";

/** Deep "string-ified" shape of the English dictionary: every locale must match it exactly. */
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : T extends object
      ? { [K in keyof T]: Widen<T[K]> }
      : T;

export type Dict = Widen<typeof en>;
