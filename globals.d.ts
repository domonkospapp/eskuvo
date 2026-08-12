declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

declare global {
  interface Window {
    storage: {
      set(key: string, value: string): Promise<boolean>
      get(key: string): Promise<{ value: string } | null>
      list(prefix: string): Promise<{ keys: string[] }>
    }
  }
}
