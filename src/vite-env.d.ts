
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_USE_RELATIVE_API_URL: string;
  // add more env vars as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
