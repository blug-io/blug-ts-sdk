# blug-ts-sdk

TypeScript SDK for Blug API key-protected endpoints.

## Install

```bash
bun install
```

## Usage

```ts
import { BlugClient } from "@blug-io/sdk";

const client = new BlugClient({
  baseUrl: "https://api.blug.io",
  apiKey: process.env.BLUG_API_KEY!,
});

const pageOne = await client.listArticles({ page: 1 });

for await (const article of client.iterateArticles()) {
  console.log(article.title);
}
```

## Available methods

- `listArticles`
- `iterateArticles` (async generator)
- `getArticle`
- `listTags`
- `iterateTags` (async generator)
- `getTag`
- `listCategories`
- `iterateCategories` (async generator)
- `getCategory`
- `getArticleStatistics`

## Scripts

- `bun run format`
- `bun run biome:ci`
- `bun run test`
