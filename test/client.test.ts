import { describe, expect, it } from "bun:test";

import { BlugApiError, BlugClient } from "../src/client";

describe("BlugClient", () => {
  it("adds API key and returns parsed data", async () => {
    const fetchImpl = async (input: URL | RequestInfo, init?: RequestInit) => {
      const url = String(input);
      expect(url).toBe("https://api.blug.io/api/v1/blog/articles/?page=2");
      expect(init?.headers).toEqual({
        "Content-Type": "application/json",
        "X-API-KEY": "test-key",
      });

      return new Response(
        JSON.stringify({ count: 1, next: null, previous: null, results: [] }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    };

    const client = new BlugClient({
      baseUrl: "https://api.blug.io",
      apiKey: "test-key",
      fetchImpl,
    });

    const result = await client.listArticles({ page: 2 });
    expect(result.count).toBe(1);
  });

  it("throws BlugApiError on API failure", async () => {
    const fetchImpl = async (): Promise<Response> => {
      return new Response(JSON.stringify({ detail: "Forbidden" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    };

    const client = new BlugClient({
      baseUrl: "https://api.blug.io",
      apiKey: "bad-key",
      fetchImpl,
    });

    await expect(client.getArticleStatistics()).rejects.toBeInstanceOf(
      BlugApiError,
    );
  });

  it("iterates all paginated articles without manual pagination", async () => {
    const visitedUrls: string[] = [];
    const fetchImpl = async (input: URL | RequestInfo): Promise<Response> => {
      const url = String(input);
      visitedUrls.push(url);
      const page = new URL(url).searchParams.get("page");

      if (page === "1") {
        return new Response(
          JSON.stringify({
            count: 3,
            next: "https://api.blug.io/api/v1/blog/articles/?page=2",
            previous: null,
            results: [
              {
                uuid: "a1",
                title: "A1",
                subtitle: "S1",
                slug: "a1",
                status: "published",
                visibility: "public",
                published_date: "2026-01-01T00:00:00Z",
                view_count: 1,
              },
              {
                uuid: "a2",
                title: "A2",
                subtitle: "S2",
                slug: "a2",
                status: "published",
                visibility: "public",
                published_date: "2026-01-02T00:00:00Z",
                view_count: 2,
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          count: 3,
          next: null,
          previous: "https://api.blug.io/api/v1/blog/articles/?page=1",
          results: [
            {
              uuid: "a3",
              title: "A3",
              subtitle: "S3",
              slug: "a3",
              status: "draft",
              visibility: "private",
              published_date: "2026-01-03T00:00:00Z",
              view_count: 3,
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };

    const client = new BlugClient({
      baseUrl: "https://api.blug.io",
      apiKey: "test-key",
      fetchImpl,
    });

    const ids: string[] = [];
    for await (const article of client.iterateArticles()) {
      ids.push(article.uuid);
    }

    expect(ids).toEqual(["a1", "a2", "a3"]);
    expect(visitedUrls).toEqual([
      "https://api.blug.io/api/v1/blog/articles/?page=1",
      "https://api.blug.io/api/v1/blog/articles/?page=2",
    ]);
  });
});
