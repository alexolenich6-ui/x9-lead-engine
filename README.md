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
| `APIFY_TOKEN` | да | Токен Apify API |
| `APIFY_ACTOR_ID` | да | ID Apify-актора Instagram Scraper |
| `AI_PROVIDER` | нет | `anthropic` (по умолчанию) или `openrouter` |
| `X9_ANTHROPIC_API_KEY` | если `AI_PROVIDER=anthropic` | Ключ Anthropic API |
| `ANTHROPIC_MODEL` | нет | По умолчанию `claude-sonnet-5` |
| `X9_OPENROUTER_API_KEY` | если `AI_PROVIDER=openrouter` | Ключ OpenRouter API |
| `OPENROUTER_MODEL` | нет | По умолчанию `minimax/minimax-m3:free` |

Оба провайдера используют одну и ту же схему и промпт XNINE Sales Brain
(`lib/sales-brain/schema.ts`, `lib/sales-brain/prompt.ts`) — формат результата
не зависит от выбранного провайдера.

## Структура

- `lib/instagram/` — сбор сырых данных из Apify (profile + posts/Reels)
- `lib/normalize/` — приведение данных к единому формату (OBSERVED / unknown)
- `lib/sales-brain/` — методология XNINE: ICP, Launch/Growth/None, промпт,
  структурированный вызов Anthropic. Меняется отдельно от UI и backend-кода.
- `app/api/analyze/route.ts` — orchestration: Apify → normalize → AI → ответ
- `app/`, `components/` — интерфейс (главный экран, отчёт по лиду, история)

История анализов хранится в `localStorage` браузера (MVP, без БД).
