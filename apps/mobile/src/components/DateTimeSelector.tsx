// TypeScript resolves this neutral module during static checking. Metro selects
// the `.native` or `.web` implementation for the active platform at runtime.
export { DateTimeSelector } from './DateTimeSelector.native';
