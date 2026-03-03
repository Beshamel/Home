export class LocalItem {
  key: string
  default?: string
  public constructor(key: string, defaultValue?: string) {
    this.key = key
    this.default = defaultValue
  }
  get(): string | null {
    return localStorage.getItem(this.key) ?? this.default ?? null
  }
  set(data: string): void {
    localStorage.setItem(this.key, data)
  }
  reset(): void {
    localStorage.removeItem(this.key)
  }
}

export const LocalTimeMode = new LocalItem("timemode", "24h")
export const LocalUTC = new LocalItem("utc", "false")
export const LocalDisplaySeconds = new LocalItem("display_s", "false")
