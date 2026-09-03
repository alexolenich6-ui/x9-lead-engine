# X9 Lead Engine

Внутренний AI-инструмент XNINE для аутрича: вставляете Instagram username →
приложение получает публичные данные профиля и последние Reels через Apify →
AI (Anthropic или OpenRouter) анализирует лид по методологии XNINE → на
выходе готовый sales brief (ICP score, рекомендуемый оффер, sales angle,
первое сообщение, next best action).

## Запуск локально

```bash
npm install
cp .env.local.example .env.local   # заполнить APIFY_TOKEN / APIFY_ACTOR_ID / ключ AI-провайдера
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000).

## Переменные окружения

Все ключи — только server-side (используются в API route, никогда не
попадают в браузер).

| Переменная | Обязательна | Описание |
|---|---|---|
| `APIFY_TOKEN` | да (если не mock-режим) | Токен Apify API |
| `APIFY_ACTOR_ID` | да (если не mock-режим) | ID Apify-актора Instagram Scraper |
| `INSTAGRAM_MODE` | нет | `mock` — не ходить в Apify вообще, отдавать фикстуру. Пусто/не задано — обычный режим (Apify + кэш) |
| `AI_PROVIDER` | нет | `anthropic` (по умолчанию) или `openrouter` |
| `X9_ANTHROPIC_API_KEY` | если `AI_PROVIDER=anthropic` | Ключ Anthropic API |
| `ANTHROPIC_MODEL` | нет | По умолчанию `claude-sonnet-5` |
| `X9_OPENROUTER_API_KEY` | если `AI_PROVIDER=openrouter` | Ключ OpenRouter API |
| `OPENROUTER_MODEL` | нет | По умолчанию `minimax/minimax-m3:free` |

Оба провайдера используют одну и ту же схему и промпт XNINE Sales Brain
(`lib/sales-brain/schema.ts`, `lib/sales-brain/prompt.ts`) — формат результата
не зависит от выбранного провайдера.

## Кэш Instagram-данных и mock-режим

Apify-запросы (профиль + Reels) — самая дорогая и лимитированная часть
пайплайна, поэтому они не выполняются лишний раз:

- **Кэш по username.** После первого успешного сбора данных по лиду сырые
  данные Apify сохраняются в `.cache/instagram/<username>.json` (в
  `.gitignore`, не коммитится). Повторный анализ того же username переиспользует
  эти данные и не обращается к Apify — обновляется только AI-разбор.
- **Открытие/обновление отчёта из истории** — чисто клиентская операция
  (`localStorage`), никогда не обращается ни к Apify, ни к серверу.
- **"Refresh Instagram Data"** — кнопка в отчёте лида, которая явно форсирует
  свежий сбор данных через Apify и перезаписывает кэш для этого username.
  Без неё Apify для уже проанализированного лида больше не вызывается.
- **`INSTAGRAM_MODE=mock`** — режим для UI-разработки и тестов: все вызовы
  Apify подменяются фикстурой из `lib/instagram/fixtures/enotbuilding.json`
  (реальные данные, собранные один раз через Apify), сеть не используется
  вообще. В отчёте такие данные помечены бейджем "Mock data".

## Структура

- `lib/instagram/` — сбор сырых данных из Apify (profile + posts/Reels)
- `lib/normalize/` — приведение данных к единому формату (OBSERVED / unknown)
- `lib/sales-brain/` — методология XNINE: ICP, Launch/Growth/None, промпт,
  структурированный вызов Anthropic. Меняется отдельно от UI и backend-кода.
- `app/api/analyze/route.ts` — orchestration: Apify → normalize → AI → ответ
- `app/`, `components/` — интерфейс (главный экран, отчёт по лиду, история)

История анализов хранится в `localStorage` браузера (MVP, без БД).
