/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_PRIME_WASM?: string;
  readonly DEV?: boolean;
  readonly PROD?: boolean;
  readonly MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

