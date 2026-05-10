declare module 'qrcode' {
  export function toDataURL(text: string, options?: object): Promise<string>;
  export function toString(text: string, options?: object): Promise<string>;
  export function toFile(path: string, text: string, options?: object): Promise<void>;
  export function toFileStream(stream: NodeJS.WritableStream, text: string, options?: object): void;
  export function toCanvas(canvasElement: HTMLCanvasElement, text: string, options?: object): Promise<void>;
  export function toBuffer(text: string, options?: object): Promise<Buffer>;
}