# Reading Cat

A child-friendly book review journal built with Astro and EmDash. Installed directly in this folder, with SQLite content and local media uploads.

## Local preview

Use **Node 24.15 or later** (the project includes `.nvmrc`), then:

```sh
npm install
npm run dev
```

- Site: http://localhost:4322/
- Guided review form: http://localhost:4322/write
- Saved drafts: http://localhost:4322/drafts
- EmDash dashboard: http://localhost:4322/_emdash/admin/

This preview is bound to the local machine. Port 4322 avoids another project on 4321.

Use `localhost` for passkey setup. EmDash's [authentication guide](https://docs.emdashcms.com/guides/authentication/) supports local setup over HTTP; browsers treat `http://localhost` as a secure context. No local certificate is needed. If an embedded browser cannot offer passkeys, open this same admin URL in Safari or Chrome. Production hosting will need HTTPS.

## Editing

Complete the EmDash setup wizard and register your own passkey. Log in to EmDash, then return to **Write a review**.

**My drafts** and **Write a review** are available only to logged-in Contributors, Authors, Editors, and Admins. Their navigation links are hidden from visitors and Subscribers. Direct visits redirect anonymous readers to login and return 403 for Subscribers. Contributors can save drafts; publishing requires Author or higher permissions. Responses for logged-in users and editor routes are private and uncached.

The homepage shows the three latest published reviews. **My bookshelf** opens `/bookshelf`, which lists all published reviews, nine per page, with previous and next links.

The guided form has three steps:

1. **The book** — title, author, illustrator, kind, reader age range, finished date, and cover upload.
2. **My thoughts** — a summary without the ending, favourite character and moment, feelings, what to change, recommendation, a 1–5 star rating, and a spoiler warning.
3. **My drawing** — photo or scan of original artwork, caption, and a written review preview.

**Save draft** stores the review in EmDash. **Add to my bookshelf** publishes it on this local site. When editing a shared review, draft changes stay private until published. The form checks title, author, summary, recommendation, and rating before sharing. Drawing and cover uploads accept JPG, PNG, and WebP up to 10 MB.

**My drafts** also lists unpublished changes to existing reviews. Use **Edit this review** from a review page to update it. The full dashboard manages reviews, images, revisions, deletion and restoration, homepage wording, and site settings.

Three starter reviews are marked **Example review**. They are demonstration text, not the child's opinions. Edit or delete them through EmDash. The guided editor lets you remove the example label when replacing their text.

## Editable homepage

- **Settings → General:** site title and introduction (tagline).
- **Homepage words:** large heading, bookshelf introduction, and footer.
- **Book reviews:** every review field, cover, and drawing.

## Checks

```sh
npm run typecheck
npm test
npm run build
```

All CMS pages are server-rendered. Page queries read published EmDash content at runtime and include visual editing attributes and cache hints. Browser requests use EmDash's authenticated API with its CSRF header and revision tokens.

## Cloudflare deployment

The live site is [reading.cat](https://reading.cat/). It uses the `production` environment and the `reading-cat` Worker. `EMDASH_SITE_URL` and Astro’s site URL are set to `https://reading.cat`. Cloudflare manages DNS and HTTPS for the custom domain.

The original preview hostname redirects to reading.cat, preserving paths and query strings. Its scheduled tasks are disabled; the production Worker handles those tasks. The previous admin account was reset at the owner’s request for the domain move. Create a fresh account and passkey through [admin setup](https://reading.cat/_emdash/admin/setup). Passkeys are bound to their hostname; localhost accounts remain separate.

Both Workers use `astro.cloudflare.config.mjs` and their environments in `wrangler.jsonc`. Content is stored in D1 (`reading-cat-preview-20260929`); covers and drawings are stored in the private R2 bucket (`reading-cat-preview-20260929-media`) and served through EmDash. The three example reviews and covers were bootstrapped from the site's EmDash seed. `EMDASH_SITE_URL` sets the canonical HTTPS origin. The preview encryption key is a Worker secret, with a private backup in the ignored `.deploy/preview-secrets.json` file.

To update the live site:

```sh
npm run types:cloudflare
npm run typecheck
npm run deploy:production
```

The live build selects `CLOUDFLARE_ENV=production`; Wrangler then uses Astro’s generated deployment configuration. `npm run deploy:preview` selects the original preview environment instead. Redeployments preserve D1 content, R2 uploads, and the runtime encryption secret. `npm run dev` continues to use the local SQLite database and uploads.

Production and the redirect Worker retain bindings to the existing D1 database, R2 bucket, and session KV namespace. The domain move preserves reviews, settings and uploads; the admin authentication was reset separately as requested. Keep these resources and the encryption secret; removing them would also affect the live site. The resource names retain the original preview date.

## Local data

Keep `data.db`, its SQLite companion files, `uploads/`, and `.env` private and backed up. `.env` contains the generated local encryption key. Do not commit it. Node hosting requires persistent database and upload storage.

## Design and sources

The voice is warm, clear, and encouraging, following the ux-writing skill. Review prompts are informed by [Reading Chest's book review guide](https://readingchest.co.uk/advice/how-to-write-a-book-review/). Setup follows [EmDash's start guide](https://emdashcms.com/start.md) and current documentation.

The ginger cat illustration in `public/images/reading-cat.png` was created with the built-in Image Gen tool, using the supplied cat photo as a reference. The latest edit shows the cat asleep with its head on its paws, curled up on colourful books with blank spines, using the photo’s ginger stripes, ears and pink nose. The original concept is retained outside this project in the task's visualizations folder. The logo is a separate illustrated portrait of the supplied cat, with its paws on a book, in `public/images/reading-cat-logo.png`.

Sample cover images come from the [Open Library Covers API](https://openlibrary.org/dev/docs/api/covers). Book jackets belong to their respective rights holders. Fraunces is self-hosted from Google Fonts under the SIL Open Font License; see `public/fonts/OFL.txt`.
