export type UUID = string;

export type RequestOptions = {
  signal?: AbortSignal;
};

export type PaginationParams = {
  page?: number;
};

export type PaginationIteratorOptions = RequestOptions & {
  startPage?: number;
};

export type FetchLike = (
  input: URL | RequestInfo,
  init?: RequestInit,
) => Promise<Response>;

export type BlugSdkConfig = {
  baseUrl: string;
  apiKey: string;
  fetchImpl?: FetchLike;
};

export type Article = {
  uuid: UUID;
  title: string;
  subtitle: string;
  slug: string;
  status: string;
  visibility: string;
  published_date: string;
  view_count: number;
};

export type Tag = {
  uuid: UUID;
  name: string;
  slug: string;
  created: string;
  last_updated: string;
};

export type Category = {
  uuid: UUID;
  name: string;
  description: string;
  cover_image: string;
  slug: string;
  created: string;
  last_updated: string;
};

export type ArticleStatistics = {
  total_posts: number;
  total_drafts: number;
  total_views: number;
  traffic_on_blug: number;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export class BlugApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "BlugApiError";
    this.status = status;
    this.body = body;
  }
}

export class BlugClient {
  readonly #baseUrl: string;
  readonly #apiKey: string;
  readonly #fetchImpl: FetchLike;

  constructor(config: BlugSdkConfig) {
    this.#baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.#apiKey = config.apiKey;
    this.#fetchImpl = config.fetchImpl ?? fetch;
  }

  async listArticles(
    params: PaginationParams = {},
    options: RequestOptions = {},
  ): Promise<PaginatedResponse<Article>> {
    return this.#get<PaginatedResponse<Article>>(
      "/api/v1/blog/articles/",
      params,
      options,
    );
  }

  async *iterateArticles(
    options: PaginationIteratorOptions = {},
  ): AsyncGenerator<Article> {
    yield* this.#paginateItems<Article>("/api/v1/blog/articles/", options);
  }

  async getArticle(id: UUID, options: RequestOptions = {}): Promise<Article> {
    return this.#get<Article>(`/api/v1/blog/articles/${id}/`, {}, options);
  }

  async listTags(
    params: PaginationParams = {},
    options: RequestOptions = {},
  ): Promise<PaginatedResponse<Tag>> {
    return this.#get<PaginatedResponse<Tag>>(
      "/api/v1/blog/tags/",
      params,
      options,
    );
  }

  async *iterateTags(
    options: PaginationIteratorOptions = {},
  ): AsyncGenerator<Tag> {
    yield* this.#paginateItems<Tag>("/api/v1/blog/tags/", options);
  }

  async getTag(id: UUID, options: RequestOptions = {}): Promise<Tag> {
    return this.#get<Tag>(`/api/v1/blog/tags/${id}/`, {}, options);
  }

  async listCategories(
    params: PaginationParams = {},
    options: RequestOptions = {},
  ): Promise<PaginatedResponse<Category>> {
    return this.#get<PaginatedResponse<Category>>(
      "/api/v1/blog/categories/",
      params,
      options,
    );
  }

  async *iterateCategories(
    options: PaginationIteratorOptions = {},
  ): AsyncGenerator<Category> {
    yield* this.#paginateItems<Category>("/api/v1/blog/categories/", options);
  }

  async getCategory(id: UUID, options: RequestOptions = {}): Promise<Category> {
    return this.#get<Category>(`/api/v1/blog/categories/${id}/`, {}, options);
  }

  async getArticleStatistics(
    options: RequestOptions = {},
  ): Promise<ArticleStatistics> {
    return this.#get<ArticleStatistics>(
      "/api/v1/blog/articles/statistics/",
      {},
      options,
    );
  }

  async #get<T>(
    path: string,
    query: Record<string, string | number | undefined>,
    options: RequestOptions,
  ): Promise<T> {
    const url = new URL(`${this.#baseUrl}${path}`);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await this.#fetchImpl(url, {
      method: "GET",
      signal: options.signal,
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": this.#apiKey,
      },
    });

    const body = await this.#safeParseJson(response);

    if (!response.ok) {
      const message = `Blug API request failed with status ${response.status}`;
      throw new BlugApiError(message, response.status, body);
    }

    return body as T;
  }

  async #safeParseJson(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return null;
    }

    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  async *#paginateItems<T>(
    path: string,
    options: PaginationIteratorOptions,
  ): AsyncGenerator<T> {
    let currentPage = options.startPage ?? 1;

    while (true) {
      const response = await this.#get<PaginatedResponse<T>>(
        path,
        { page: currentPage },
        options,
      );

      for (const item of response.results) {
        yield item;
      }

      if (!response.next) {
        return;
      }

      currentPage += 1;
    }
  }
}
