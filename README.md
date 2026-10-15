## Try it online

Here: [https://paolini.github.io/funplot/](https://paolini.github.io/funplot/)

## Development

run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000/funplot](http://localhost:3000/funplot) with your browser to see the result.

## Next.js

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy

Build the optimized production site with:

```
npm run build
```

then run a web server on the `out` directory.

## Checks

Use Node.js 24 (also used by CI), install with `npm ci`, then run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

The regression suite uses Node's built-in test runner and the existing TypeScript
compiler. It covers independent panel updates, shared-link compatibility and
validation, parameter errors, and termination of ODE integration.

`npm run build` already exports the static site into `out`; a separate export
step is unnecessary. The build currently downloads the Inter font from Google.
The configured base path is `/funplot`.

Shared links carry a format version and retain support for historical unversioned
links. Invalid links show an error without replacing the current plot. The
unfinished bifurcation diagram is temporarily unavailable; its saved setting is
preserved when opening and sharing existing plots.

## Canvas gestures

Drag with one finger (or the mouse) to pan. Pinch with two fingers to zoom around
their midpoint; moving both fingers also pans. A short tap still selects an
initial point for ODEs and recurrences. Gestures beginning on the canvas are
handled by the plot rather than by browser page zoom. Scrolling and zooming
outside the canvas retain normal browser behavior.
