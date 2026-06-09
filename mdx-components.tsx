// Local fallback type for MDXComponents — the `mdx/types` package isn't installed
// here, but this file is still required by the Next.js MDX integration when used.
type MDXComponents = Record<string, React.ComponentType<unknown>>;

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including components from
// other libraries.

// This file is required to use MDX in `app` directory.
export function useMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    // Allows customizing built-in components, e.g. to add styling.
    // h1: ({ children }) => <h1 style={{ fontSize: "100px" }}>{children}</h1>,
    ...components,
  };
}
