/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APIFY_ACTOR_ID?: string;
  readonly VITE_APIFY_API_TOKEN?: string;
  readonly VITE_APIFY_DATASET_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

