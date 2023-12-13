import ObservableSlim from "observable-slim";

// ====================================================== //
// ====================== State ====================== //
// ====================================================== //

// Wrapper class to make any object/primitive observable

export type StateListener = (changeData: StateChange) => void;

/**
 *  Wrapper class to make any object/primitive observable
 */
export class State<T> {
  private readonly listeners = new Map<number, StateListener>();
  private static listener_count = 0;

  private val: ProxyConstructor | T;
  private static stateCount = 0;
  readonly id: number;

  constructor(value: T) {
    State.stateCount++;
    this.id = State.stateCount;

    this.val =
      typeof value === "object" ? ObservableSlim.create(value, false, this.onValueChange) : value;
  }

  get value(): T {
    return this.val as T;
  }

  set value(val: T) {
    const previousValue = this.val;
    if (typeof val !== "object") {
      this.val = val;
    } else {
      this.val = ObservableSlim.create(val, false, this.onValueChange);
    }
    this.onValueChange([
      {
        type: "update",
        property: "",
        currentPath: "",
        jsonPointer: "",
        target: this.val,
        // @ts-ignore
        proxy: (this.val as never).__getProxy,
        previousValue,
        newValue: this.val,
      },
    ]);
  }

  public onChange = (callback: (change: StateChange) => void): (() => void) => {
    const listenerId = this.generateListenerId();
    this.listeners.set(listenerId, callback);
    return () => this.unsubscribe(listenerId); // return unsubscribe function
  };

  /**
   * create a substate of this state.
   *
   * @remarks You cannot create a substate for a primitive type state.
   */
  public createSubState<S>(key: T extends object ? `value.${NestedKeyof<T>}` : string): State<S> {
    const subStateKeys = key.split(".");
    const subStateValue: S = subStateKeys.reduce((obj: Record<string, unknown>, key: string) => {
      const val = obj[key];
      if (val !== undefined) {
        return val as Record<string, unknown>;
      }
      throw new InvalidStateKeyError(key, this);
    }, this as Record<string, unknown>) as S;

    // if this is a primitive type, we cannot create a substate
    if (typeof subStateValue !== "object") {
      throw new Error("SubStates of properties that are Primitives are not supported yet.");
    }

    // @ts-ignore
    return new State(subStateValue?.__getTarget);

    // if (typeof subStateValue === "object" && type) {
    //   // check if is like generic type S

    //   // ts-ignore
    //   return new State(subStateValue?.__getTarget);
    // } else throw new Error("SubStates of properties that are Primitives are not supported yet.");
  }

  public getRawValue(): T {
    if (typeof this.val === "object") {
      // @ts-ignore
      return (this.val as unknown as ProxyConstructor).__getTarget;
    }
    return this.val as T;
  }

  private generateListenerId = () => {
    State.listener_count++;
    return State.listener_count;
  };

  private unsubscribe = (listenerId: number) => {
    this.listeners.delete(listenerId);
  };

  private notifyAll = (changeData: StateChange) => {
    this.listeners.forEach((listener) => listener(changeData));
  };

  private onValueChange = (changes: StateChange[]) => {
    changes.forEach((change) => {
      this.notifyAll(Object.assign({}, change, { triggerStateId: this.id }));
    });
  };
}

// custom error type for invalid state keys
export class InvalidStateKeyError<T> extends Error {
  constructor(subStateKey: string, state: State<T>) {
    super();
    this.message = `Key does not exist!
    Detailed error:
    "${subStateKey}" could not be found in {"value":${JSON.stringify(state.value)}}
    `;
  }
}

export type NestedKeyof<T = unknown> = T extends object
  ? NestedKeyOf<T> | WithPrefixNumber<NestedKeyOf<T>>
  : string;
export interface StateChange<T = unknown, ObjectType = unknown> {
  type: "add" | "delete" | "update";
  property: string; // equals "value" if the whole state is changed

  currentPath: NestedKeyof<ObjectType>; // path of the property
  jsonPointer: string; // path as json pointer syntax
  target: T; // the target object
  proxy?: ProxyConstructor; // the proxy of the object

  previousValue?: T; // may be undefined if the property is new
  newValue?: T; // may be undefined if the property is deleted
}
