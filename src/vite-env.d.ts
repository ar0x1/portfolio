/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EDITORIAL_IMAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
