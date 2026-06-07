// vite-imagetools "as=picture" return shape
declare module "*&as=picture" {
  const out: {
    sources: Record<string, string>;
    img: { src: string; w: number; h: number };
  };
  export default out;
}