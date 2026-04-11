import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Drop-in replacement for useState that persists to AsyncStorage.
 * Reads the stored value on mount; writes on every change.
 *
 * @param key     AsyncStorage key
 * @param defaultValue  Initial value before storage is read
 * @param serialize   Optional custom serialiser (default: JSON.stringify)
 * @param deserialize  Optional custom deserialiser (default: JSON.parse)
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  serialize: (v: T) => string = JSON.stringify,
  deserialize: (s: string) => T = JSON.parse
): [T, (value: T) => Promise<void>] {
  const [state, setStateRaw] = useState<T>(defaultValue);

  useEffect(() => {
    AsyncStorage.getItem(key).then((raw) => {
      if (raw !== null) {
        try {
          setStateRaw(deserialize(raw));
        } catch {
          // Corrupted value — ignore and keep default
        }
      }
    });
  }, [key]);

  const setState = useCallback(
    async (value: T) => {
      setStateRaw(value);
      try {
        await AsyncStorage.setItem(key, serialize(value));
      } catch {}
    },
    [key, serialize]
  );

  return [state, setState];
}
