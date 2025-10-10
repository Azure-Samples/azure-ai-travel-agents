declare interface Env {
  readonly NODE_ENV: string;
  readonly NG_API_URL: string;
}

declare interface ImportMeta {
  readonly env: Env;
}
