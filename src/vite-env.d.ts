/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PYPOE_USERNAME?: string;
  readonly VITE_PYPOE_PASSWORD?: string;
  readonly VITE_PYPOE_BACKEND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
