declare interface Env {
  readonly NODE_ENV: string;
  readonly NG_API_URL_LANGCHAIN_JS: string;
  readonly NG_API_URL_LLAMAINDEX_TS: string;
  readonly NG_API_URL_MAF_PYTHON: string;
}

declare interface ImportMeta {
  readonly env: Env;
}
