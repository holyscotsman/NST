# Question images

Drop question diagrams/screenshots here as local image files (PNG, JPG, SVG,
WebP). Reference each one from your Markdown bank by **filename**:

```markdown
- **Image:** rf2-diagram.png
- **Alt:** Diagram showing two-node replication placement
```

The importer turns that into `src/content/images/rf2-diagram.png` and requires
the `Alt:` description for accessibility.

Rules:
- **Local files only** — the game is a static site and plays offline, so
  external URLs (`https://…`, `//…`, `data:`) are rejected by the validator.
- Keep them reasonably small; they render up to ~200px tall on the quiz card.
- Commit the files to the repo so GitHub Pages serves them.
