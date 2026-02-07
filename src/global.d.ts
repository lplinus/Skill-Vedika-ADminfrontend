/// <reference types="react" />
// Re-export/augment JSX namespace from React types to satisfy editor TS server when
// automatic type acquisition isn't available.
declare global {
  namespace JSX {
    // Reuse React's Element so React types drive JSX checking
    type Element = React.ReactElement;
  }
}

export {};
