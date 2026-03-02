# @blug-io/sdk

TypeScript SDK for Blug API-key-supported endpoints.

## Install

```bash
bun add @blug-io/sdk
```

## Quick Start

```ts
import { BlugClient } from "@blug-io/sdk";

const client = new BlugClient({
  baseUrl: "https://api.blug.io",
  apiKey: process.env.BLUG_API_KEY!,
});

const articles = await client.listArticles({ page: 1 });
console.log(articles.results);
```

## Authentication

This SDK uses API key auth for supported endpoints by sending:

- `X-API-KEY: <your-api-key>`

## API Reference

### Articles

- `listArticles(params?)`
- `iterateArticles(options?)` async generator
- `getArticle(id)`
- `getArticleStatistics()`

### Tags

- `listTags(params?)`
- `iterateTags(options?)` async generator
- `getTag(id)`

### Categories

- `listCategories(params?)`
- `iterateCategories(options?)` async generator
- `getCategory(id)`

## Pagination Helpers (Async Generators)

Use iterators when you want all items without manually managing `page`:

```ts
for await (const article of client.iterateArticles()) {
  console.log(article.title);
}
```

Optional start page:

```ts
for await (const tag of client.iterateTags({ startPage: 3 })) {
  console.log(tag.name);
}
```

## Error Handling

All non-2xx responses throw `BlugApiError`.

```ts
import { BlugApiError } from "@blug-io/sdk";

try {
  await client.getArticleStatistics();
} catch (error) {
  if (error instanceof BlugApiError) {
    console.error(error.status, error.body);
  }
}
```

## Types

The SDK exports useful types including:

- `Article`
- `Tag`
- `Category`
- `PaginatedResponse<T>`
- `BlugApiError`

---

## Development (Package Maintainers)

### Install dependencies

```bash
bun install
```

### Run checks

```bash
bun run biome:ci
bun run test
```

### Format locally

```bash
bun run format
```
