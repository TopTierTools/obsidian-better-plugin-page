type NestedValue<ObjectType, Path extends string> = Path extends keyof ObjectType
  ? ObjectType[Path]
  : Path extends `${infer Key}.${infer Rest}`
  ? ObjectType[Key] extends object
    ? NestedValue<ObjectType[Key], Rest>
    : never
  : never;
