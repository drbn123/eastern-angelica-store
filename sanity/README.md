# Sanity CMS — setup

## Krok 1 — utwórz konto i projekt

1. Wejdź na https://www.sanity.io i zarejestruj się
2. Utwórz nowy projekt (np. `eastern-angelica`)
3. Skopiuj **Project ID** i **Dataset** (zazwyczaj `production`)

## Krok 2 — zainstaluj Sanity CLI i zainicjuj studio

```bash
npm install -g @sanity/cli
sanity init --env
```

## Krok 3 — ustaw zmienne środowiskowe w `.env.local`

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=twoj_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=twoj_token_read_write
```

## Krok 4 — dodaj zależności

```bash
npm install next-sanity @sanity/image-url
```

## Krok 5 — podmień `lib/catalog.ts`

Zastąp statyczny `RELEASES` zapytaniem GROQ:

```ts
import { createClient } from "next-sanity";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  useCdn: true,
});

export async function getReleases() {
  return client.fetch(`*[_type == "release"] | order(_createdAt desc)`);
}
```

## Schemat

Schemat jest w `sanity/schemas/release.ts` — gotowy do importu.
