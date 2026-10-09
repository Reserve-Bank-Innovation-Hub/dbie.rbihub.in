# design-ref

A drop folder for story planning material: the plan for a story as HTML, sketches, reference charts, source
workbooks and anything else worth having at hand while a story is being built. Everything in here except this
file is ignored by git, so drop files freely; nothing ships.

While a story is being worked on, the assets it ends up using are moved out to where they belong:

- source files the processor reads: `data/sources/` (or the scrape, restored by `pnpm data:fetch`)
- downloads the page offers: `public/stories/<slug>/`
- images the page shows: `public/images/`
- the research write-up: `docs/<slug>-research.md`

Files are served at `/design-ref/<name>` by `next dev`, so an HTML plan can be opened in the browser at
http://localhost:3000/design-ref/<name>.html.
