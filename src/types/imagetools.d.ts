// vite-imagetools "as=picture" return shape
declare module "*&as=picture" {
  const out: {
    sources: Record<string, string>;
    img: { src: string; w: number; h: number };
  };
  export default out;
}

// Plain format-converted imports return a string URL.
declare module "*&format=webp" {
  const src: string;
  export default src;
}
declare module "*&format=avif" {
  const src: string;
  export default src;
}