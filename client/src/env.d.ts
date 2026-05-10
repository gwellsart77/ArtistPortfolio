/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_STRIPE_PUBLIC_KEY?: string;
  readonly MODE?: string;
  readonly DEV?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}