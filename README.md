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

The build writes the static site to `out`, ready for GitHub Pages under `/funplot`.
To preview that production build locally, run `npm start` and open
[http://localhost:3000/funplot](http://localhost:3000/funplot). This uses a static
server because `next start` is incompatible with static exports.

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


## Dependency baseline

The application uses Next.js 16, React 19, Tailwind CSS 4, Math.js 15, jsPDF 4,
and KaTeX 0.19. Build tools and type definitions are separate from browser
runtime dependencies. ESLint runs directly using `eslint.config.mjs`; Next.js 16
no longer provides `next lint`.

`npm run export` is retained as an alias for `npm run build`. The development
server and the production preview both use the `/funplot` base path.

Run `npm audit --omit=dev` to check runtime dependencies, and `npm audit` to also
include development tools. The `serve` dependency uses a patched `compression`
version through a scoped override. The remaining audit advisories currently
originate in the lint toolchain (`@next/eslint-plugin-next` → `fast-glob` →
`micromatch` → `braces`); npm has no compatible fix without downgrading Next's
lint configuration. Review these again when updating the lint toolchain.
