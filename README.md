# Nuxt Minimal Starter

## Unsplash-Galerie

Die Seite `/photos` lädt die öffentlichen Fotos von `@juliangojani` über die
Nuxt-Serverroute `/api/photos`. Lege in den [Unsplash Developer Apps](https://unsplash.com/oauth/applications)
eine Anwendung an, kopiere `.env.example` nach `.env` und trage deinen **Access Key**
als `NUXT_UNSPLASH_ACCESS_KEY` ein. Starte den Dev-Server danach neu. In Produktion
setzt du dieselbe Umgebungsvariable beim Hosting-Anbieter; die Galerie benötigt
einen laufenden Nuxt/Nitro-Server (kein rein statisches Hosting).

Der Schlüssel bleibt in der privaten Runtime-Konfiguration. Es werden nur Fotos
des festgelegten Profils abgerufen, jeweils 30 pro Seite. Erfolgreiche Antworten
werden pro Seite eine Stunde im RAM des Nuxt-Servers gecacht und danach bei der
nächsten Anfrage im Hintergrund aktualisiert. Alle Besucher teilen sich diesen
Cache; gleichzeitige Anfragen derselben Seite lösen nur einen Unsplash-Aufruf aus.
Der Cache nutzt in Entwicklung und Produktion ausdrücklich den Memory-Treiber.
Nach einem Server-Neustart ist er leer. Mehrere Server-Instanzen haben jeweils
einen eigenen Cache.
Die Bilder werden direkt vom Unsplash-CDN geladen; Fotograf und Unsplash sind verlinkt.

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Design canvas

`/design` is configured in `app/data/design.ts`. Each element has a unique `id`,
`title`, `kind`, position (`x`, `y`), size (`width`, `height`), optional `rotation`,
and `content`. Coordinates and sizes use canvas pixels. `kind` supports `image`,
`text`, and `palette`. Images can use local `/images/design/...` paths or URLs.
Text supports `text`, `fontFamily`, `fontSize`, `color`, and `background`;
palettes use `colors: [{ name, value }]`.

Descriptions live in `app/content/design/*.md` and are imported using `?raw`.
The site uses **Nuxt MDC** (Markdown Components), so Markdown can contain Vue
components. For example:

```md
# My design

A short description with **Markdown**.

::design-note{label="Details"}
A custom Vue component inside Markdown.
::
```

`DesignNote.global.vue` is the included example component. Additional globally
registered Vue components can be used the same way. Only author trusted content
in these local files. No database or separate content server is required.

Hover previews notes; clicking pins them. Click blank canvas or press Escape to
clear. Drag blank canvas, or choose the hand tool, to pan. Scroll pans;
Ctrl/Command + scroll zooms at the cursor. The toolbar works on touch devices too.
With the canvas focused: `+`/`-` zoom, `0` fits all elements, `H` selects the hand,
`V` selects the pointer, and Space temporarily enables panning.

This is a portfolio canvas viewer. Element positions are authored in the config;
visitors do not save layout changes.

## Code maintenance

```sh
npm run format       # Format source files with the pinned local Prettier version
npm run format:check # Check formatting without changing files
npm run typecheck    # Check Vue, app and server TypeScript
npm test             # Run the Node tests
npm run build        # Build the production app
```

Generated files, dependencies, local environment files and the package-manager
lockfile are excluded from formatting.

UI components are grouped by area under `app/components/`: `design`, `video`,
`photography`, `projects` and `site`. Route files compose those components.
Interactive state and lifecycle behavior live in `app/composables/`; pure camera,
YouTube and synchronization helpers live in `app/utils/`. The photo API route
validates requests, while `server/utils/unsplash.ts` owns the upstream request
and shared RAM cache.
