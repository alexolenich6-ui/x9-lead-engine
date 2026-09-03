import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { ApifyRequestError, fetchInstagramPostsRaw, fetchInstagramProfileRaw, isMockMode } from "@/lib/instagram/apify-client";
import { readInstagramCache, writeInstagramCache } from "@/lib/instagram/cache";
import type { LeadRecord } from "@/lib/lead-record";
import { normalizeLead } from "@/lib/normalize/normalize-lead";
import { analyzeLead, SalesBrainError } from "@/lib/sales-brain/analyze";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-zA-Z0-9._]{1,30}$/;

function cleanUsername(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.trim().replace(/^@/, "");
  if (!USERNAME_RE.test(cleaned)) return null;
  return cleaned;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const username = cleanUsername((body as { username?: unknown })?.username);
  if (!username) {
    return NextResponse.json(
      { error: "Введите корректный Instagram username (латиница, цифры, точки, подчёркивания)." },
      { status: 400 },
    );
  }
  const forceRefresh = (body as { forceRefresh?: unknown })?.forceRefresh === true;

  let rawProfile: Record<string, unknown> | null;
  let rawPosts: Record<string, unknown>[];
  let instagramFetchedAt: string;
  let instagramSource: "cache" | "live" | "mock";

  // Mock mode never reads or writes the real Instagram cache — fixture data
  // stays clearly labeled "mock" and never contaminates the live cache.
  const cached = forceRefresh || isMockMode() ? null : await readInstagramCache(username);

  if (cached) {
    rawProfile = cached.profile;
    rawPosts = cached.posts;
    instagramFetchedAt = cached.fetchedAt;
    instagramSource = "cache";
  } else {
    try {
      rawProfile = await fetchInstagramProfileRaw(username);
    } catch (err) {
      if (err instanceof ApifyRequestError) {
        return NextResponse.json({ error: err.message, stage: "profile" }, { status: 502 });
      }
      return NextResponse.json({ error: "Ошибка при получении профиля.", stage: "profile" }, { status: 502 });
    }

    try {
      rawPosts = await fetchInstagramPostsRaw(username, 15);
    } catch (err) {
      if (err instanceof ApifyRequestError) {
        return NextResponse.json({ error: err.message, stage: "reels" }, { status: 502 });
      }
      return NextResponse.json({ error: "Ошибка при получении Reels.", stage: "reels" }, { status: 502 });
    }

    if (!rawProfile && rawPosts.length === 0) {
      return NextResponse.json(
        {
          error:
            "Не удалось получить данные по этому профилю. Проверьте username или доступность аккаунта.",
          stage: "profile",
        },
        { status: 404 },
      );
    }

    instagramFetchedAt = new Date().toISOString();
    if (isMockMode()) {
      instagramSource = "mock";
    } else {
      instagramSource = "live";
      await writeInstagramCache(username, { fetchedAt: instagramFetchedAt, profile: rawProfile, posts: rawPosts });
    }
  }

  const normalized = normalizeLead(username, rawProfile, rawPosts, 15);

  try {
    const analysis = await analyzeLead(normalized);

    const record: LeadRecord = {
      id: randomUUID(),
      username: normalized.profile.username,
      analyzedAt: new Date().toISOString(),
      instagramFetchedAt,
      instagramSource,
      profile: normalized.profile,
      reels: normalized.reels,
      contentStats: normalized.contentStats,
      analysis,
    };

    return NextResponse.json(record);
  } catch (err) {
    if (err instanceof SalesBrainError) {
      return NextResponse.json({ error: err.message, stage: "ai" }, { status: 502 });
    }
    return NextResponse.json({ error: "Ошибка AI-анализа.", stage: "ai" }, { status: 502 });
  }
}
