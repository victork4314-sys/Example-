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

## Recommended setup: GitHub Pages + Supabase

The preferred safer architecture is:

```text
Public GitHub repository
├── index.html
├── library.html
├── CSS and JavaScript
├── public cover images and metadata
└── no paid PDF or audio files

Supabase project
├── private Storage bucket: music-files
├── Auth or purchase/access records
├── Row Level Security policies
└── Edge Function that returns short-lived signed file URLs
```

Use GitHub Pages for the public website and Supabase as the protected backend.

### What stays on GitHub

Keep these in the public repository:

- The website HTML, CSS, and JavaScript.
- Public titles, descriptions, instrumentation, years, cover images, and prices.
- A harmless folder/metadata index used to build the visible archive.
- No paid score PDFs, masters, stems, or full-quality recordings.

### What moves to Supabase

Store protected files in a **private** Supabase Storage bucket, for example:

```text
music-files/
├── album-one/
│   └── north-window/
│       ├── score.pdf
│       └── audio.wav
└── album-two/
    └── field-notes/
        ├── score.pdf
        └── audio.wav
```

Private buckets are protected by Storage access policies. Downloads should happen through an authenticated request or a short-lived signed URL rather than a permanent public URL.

Supabase documentation:

- [Storage bucket access models](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Storage access control and RLS](https://supabase.com/docs/guides/storage/security/access-control)
- [Serving files and signed URLs](https://supabase.com/docs/guides/storage/serving/downloads)
- [Edge Functions](https://supabase.com/docs/guides/functions)

### Recommended access flow

1. A visitor opens the public site on GitHub Pages.
2. The visitor chooses a piece and enters a valid code, signs in, or completes checkout.
3. The browser sends the request to a Supabase Edge Function.
4. The function checks the purchase or access record in the database.
5. When access is valid, the function creates a signed URL that expires quickly, such as after 60–300 seconds.
6. The browser loads the PDF or audio from that temporary URL.
7. An expired URL stops working and a fresh access check is required.

The Edge Function can also add rate limiting, log failed requests, and restrict how many files or links one account can request in a short period.

### Suggested database records

A minimal database could use records similar to:

```text
pieces
- id
- slug
- title
- score_path
- audio_path
- price

access_grants
- id
- user_id or purchaser_email
- piece_id
- granted_at
- expires_at (optional)
- payment_reference or access_code_hash
```

Enable Row Level Security on exposed tables and write policies that check the actual user or grant. Merely requiring the `authenticated` role is not enough to prove that a user owns a particular purchase.

### Keys and secrets

- A Supabase publishable key may be used by the public frontend together with correct RLS policies.
- Never place the Supabase `service_role` key or another secret key in GitHub, browser JavaScript, or GitHub Pages.
- Keep service credentials in Supabase Edge Function secrets.
- Let the Edge Function perform privileged purchase checks and signed-URL creation.

### Free-tier practicality

Supabase currently offers a free tier suitable for a small demonstration or early composer catalogue. At the time this README was written, the free plan included 1 GB of file storage, 5 GB uncached egress plus 5 GB cached egress, and a maximum configured file size of 50 MB. Check the current pricing and limits before relying on those numbers for production:

- [Supabase pricing](https://supabase.com/pricing)
- [Storage pricing](https://supabase.com/docs/guides/storage/pricing)
- [Storage file limits](https://supabase.com/docs/guides/storage/uploads/file-limits)
- [Storage bandwidth](https://supabase.com/docs/guides/storage/serving/bandwidth)

Free Supabase projects may pause after inactivity, so a paid production catalogue should not assume uninterrupted service from a free project.

## Other free or low-cost combinations

These can use the same public-site/private-file principle:

### GitHub Pages + Supabase

**Recommended for this project.** GitHub hosts the public site while Supabase provides private Storage, database records, Auth, RLS, and Edge Functions.

### Cloudflare Pages + private object storage

Cloudflare Pages can host the public site. Protected files can live in private object storage and be released through a Worker after an access check. This is a good alternative when the project already uses Cloudflare.

### Netlify or Vercel + Supabase

Netlify or Vercel can host the frontend and serverless access endpoint while Supabase continues to provide private Storage and the database. This is useful when a framework-based site replaces the current plain HTML site.

### Firebase Hosting + Firebase Storage

Firebase can host both the site and files with authentication and Storage rules. It is a workable alternative, although it would replace more of the current GitHub-oriented setup.

Free tiers and quotas change. Always confirm the current limits and whether inactive projects sleep or pause before choosing a provider.

## Security checklist before selling files

- Remove every protected PDF and audio file from the public GitHub repository and its reachable history.
- Use a private Storage bucket, not a public bucket with hidden filenames.
- Enable RLS and test unauthenticated, unauthorized, and authorized downloads separately.
- Keep all privileged keys outside browser code.
- Validate payments or access grants on the server/Edge Function.
- Use short-lived signed URLs.
- Add request throttling and abuse logging.
- Restrict bucket file types and maximum sizes.
- Do not treat disabled right-clicking, obscure paths, `robots.txt`, or frontend access codes as security.

This cannot make copying impossible after a legitimate customer receives a file, but it prevents anonymous users from simply browsing or scraping the public GitHub repository for every paid asset.
