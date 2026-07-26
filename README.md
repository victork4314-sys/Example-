# Composer archive example

A deliberately small, handmade composer website with two pages:

- `index.html` — example composer information
- `library.html` — a repository-backed music tree with score and audio previews

## Music folder structure

The library supports folders inside folders. The example archive is organized like this:

```text
music/
├── Album One/
│   └── Piece Name/
│       ├── score.pdf
│       └── audio.wav
└── Album Two/
    └── Piece Name/
        ├── score.pdf
        └── audio.wav
```

Each piece folder is treated as one purchasable/unlockable item. Its score and recording stay together inside that folder. New nested albums and piece folders appear automatically in the site tree when they follow the same structure.

## Access codes and payments

The included unlock screen is a working front-end demonstration. It remembers an unlock only for the current browser session. The **Buy access** button is a placeholder for a real checkout link.

## Important protection limitation

A public static GitHub repository cannot securely protect paid scores or recordings. Files stored in a public repository remain available through GitHub itself, even when the website hides URLs, blocks right-clicking, disables indexing, or requires a browser-side code.

`robots.txt` and page-level `noindex` directives discourage compliant crawlers, but malicious scrapers may ignore them. Anything delivered to a browser can ultimately be copied by a determined user.

For real paid access and meaningful protection:

1. Keep the website code public if desired.
2. Store scores and audio in private object storage rather than the public repository.
3. Validate purchase receipts or access codes on a backend.
4. Return short-lived signed file URLs only after successful validation.
5. Add rate limiting and request logging to reduce automated bulk downloading.

This does not make copying mathematically impossible, but it prevents unauthenticated repository scraping and makes automatic bulk collection substantially harder.
