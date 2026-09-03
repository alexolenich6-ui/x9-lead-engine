const APIFY_API_BASE = "https://api.apify.com/v2";

export class ApifyRequestError extends Error {
  constructor(
    message: string,
    public readonly stage: "profile" | "reels",
  ) {
    super(message);
    this.name = "ApifyRequestError";
  }
}

function getConfig() {
  const token = process.env.APIFY_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID;
  return { token, actorId };
}

function buildProfileUrl(username: string): string {
  const clean = username.replace(/^@/, "").trim();
  return `https://www.instagram.com/${clean}/`;
}

async function runActorSync(
  input: Record<string, unknown>,
  stage: "profile" | "reels",
  timeoutMs: number,
): Promise<Record<string, unknown>[]> {
  const { token, actorId } = getConfig();
  if (!token || !actorId) {
    throw new ApifyRequestError(
      "Apify не настроен на сервере: отсутствует APIFY_TOKEN или APIFY_ACTOR_ID.",
      stage,
    );
  }

  const url = `${APIFY_API_BASE}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApifyRequestError(
        "Apify не ответил вовремя. Попробуйте запустить анализ ещё раз.",
        stage,
      );
    }
    throw new ApifyRequestError("Не удалось связаться с Apify.", stage);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ApifyRequestError(
      `Apify вернул ошибку ${response.status}${text ? `: ${text.slice(0, 300)}` : ""}`,
      stage,
    );
  }

  try {
    const data = (await response.json()) as unknown;
    return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  } catch {
    throw new ApifyRequestError("Apify вернул некорректный ответ (не JSON).", stage);
  }
}

export async function fetchInstagramProfileRaw(
  username: string,
): Promise<Record<string, unknown> | null> {
  const items = await runActorSync(
    {
      directUrls: [buildProfileUrl(username)],
      resultsType: "details",
      resultsLimit: 1,
    },
    "profile",
    90_000,
  );
  return items[0] ?? null;
}

export async function fetchInstagramPostsRaw(
  username: string,
  approxLimit = 15,
): Promise<Record<string, unknown>[]> {
  return runActorSync(
    {
      directUrls: [buildProfileUrl(username)],
      resultsType: "posts",
      resultsLimit: Math.max(approxLimit * 2, 30),
    },
    "reels",
    120_000,
  );
}
