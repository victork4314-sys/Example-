# Composer archive example

A deliberately small, handmade composer website with two pages:

- `index.html` — example composer information
- `library.html` — a repository-backed music tree with score and audio previews

## Only one folder rule

Put everything you want displayed somewhere inside the top-level `music/` folder.

That is the only required rule.

The website does **not** require particular album names, piece names, filenames, folder depth, or a fixed number of folders. It reads the repository recursively and automatically builds the visible tree from whatever currently exists under `music/`.

All of these are valid:

```text
music/
├── score.pdf
├── My Album/
│   ├── piece-one.pdf
│   └── recording.mp3
├── Another Album/
│   └── Chamber Music/
│       └── Piece Name/
│           ├── full score.pdf
│           ├── rehearsal audio.wav
│           ├── notes.txt
│           └── cover.jpg
└── Any Number Of Other Folders/
    └── nested as deeply as needed/
        └── anything.ext
```

Folders and files appear automatically after they are committed to the repository. Hidden files whose names begin with `.` are ignored.

## Preview behavior

The site accepts every file under `music/` and always lists it in the tree.

It provides built-in previews when the browser supports the format:

- PDF files open in the score/document viewer.
- Common audio formats open in the audio player.
- Common video formats open in the video player.
- Images open in the image viewer.
- Text and notation-source files open as readable text.
- Other file types remain visible and receive an **Open file** option.

A filename does not need to be `score.pdf` or `audio.wav`. File handling is based on the actual extension, not a required name.

## Automatic folder access codes

Any folder that directly contains files receives an automatic demo access gate. Its demonstration code is made from the folder name followed by `26`. This avoids maintaining a separate hard-coded list whenever folders are added or renamed.

The included unlock screen is still only a front-end demonstration. The **Buy access** button is a placeholder for a real protected checkout.

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
