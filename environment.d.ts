declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BUNDLR_PRIVATE_KEY: string;
      NODE_ENV: "development" | "production";
      PORT?: string;
      PWD: string;
    }
  }
}

export {};