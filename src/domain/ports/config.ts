export interface AppConfig {
  brand: string;
  features: Record<string, boolean>;
  theme?: Record<string, string>;
}
export interface ConfigPort { get(): Promise<AppConfig>; }
