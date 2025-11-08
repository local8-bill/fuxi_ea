import type { AppConfig, ConfigPort } from "@/domain/ports/config";

const defaultConfig: AppConfig = {
  brand: "Fuxi",
  features: { importXlsx: false, visionExtract: false },
};

export const jsonConfigAdapter: ConfigPort = {
  async get() { return defaultConfig; }
};
