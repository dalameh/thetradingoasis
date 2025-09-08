declare module 'gnews' {
  export class GNews {
    constructor(options?: any);
    search(query: string): Promise<any>;
    // You can add more methods with correct types if you want later
  }
}
