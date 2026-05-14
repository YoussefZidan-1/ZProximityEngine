import { useRef } from "react";
import { deepEqual } from "./utils";

export function useDeepMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (!deepEqual(ref.current, value)) ref.current = value;
  return ref.current;
}