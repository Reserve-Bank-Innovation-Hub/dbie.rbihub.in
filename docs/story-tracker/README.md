# Story tracker

`index.html` is the source of truth for building a data story on dbie.rbihub.in: every story's brief (headline figures,
chapters, visual, interactions, data sources, fact-check traps, overlaps and links), its status, owner and history, the
builder's guide and the house rules. Open it at
<https://raw.githack.com/Reserve-Bank-Innovation-Hub/dbie.rbihub.in/dev/docs/story-tracker/index.html> (click
"Open the page" once; it serves the file straight from dev). Once GitHub Pages is enabled for this repository (Settings
→ Pages → Deploy from a branch → `dev`, folder `/docs`), it is also at
<https://reserve-bank-innovation-hub.github.io/dbie.rbihub.in/story-tracker/>. The page loads the latest
`tracker.json` and `owners.json` from dev when it opens, so any copy of it shows current data.

## Building a story with Claude

Ask: "Read `docs/story-tracker/stories.json` entry S<n> and `docs/story-tracker/guide.html`, then plan the build."
The entry's `briefHtml` holds the plan; `guide.html` holds the repository conventions and house rules;
`tracker.json` holds what the live stories already show, so a new story links to them rather than repeating them.

## Files

| File | Who edits it | What it holds |
|---|---|---|
| `stories.json` | people, by pull request | The registry: id, title, section, slug once built, merged-into, the brief |
| `owners.json` | people (or their Claude), by commit or pull request | The list of people and who owns which story |
| `guide.html` | people | How to build a story here; the house rules |
| `slate-sections.json` | people | The story slate's principles, fact-check gates, 3D rule, open questions, method |
| `tracker.json` | the workflow | Generated: status, first on dev, updates, live date, open pull requests, what each live page shows |
| `index.html` | the workflow | Generated: the page, with everything above embedded |

## How it updates

`.github/workflows/story-tracker.yml` runs `node scripts/story-tracker/build.mjs` on every push to dev or main, on
pull-request activity against dev, every two hours and on demand, and commits the two generated files to dev with
`[skip-cd]` so Amplify does not rebuild the site. Status: Merged (the registry says so), Live (the story's folder is on
main), On dev (on dev), WIP (an open pull request to dev touches its folder or processor), Planned. A story folder that
appears on dev or in a pull request without a registry entry is added with the next number; give it a brief in
`stories.json`. Renamed stories are followed through the redirects in `next.config.js`.

Run it locally with `git fetch origin dev main && GITHUB_TOKEN=$(gh auth token) node scripts/story-tracker/build.mjs --force`.

## Changing an owner

Edit `owners.json` (the list of people and who owns which story) on a branch or in your story's pull request; the
next tracker build shows it. With Claude: "Set the owner of S24 to Srishti Bhardwaj in docs/story-tracker/owners.json."
