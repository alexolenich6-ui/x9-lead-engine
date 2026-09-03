# X9 Lead Engine

Внутренний AI-инструмент XNINE для аутрича: вставляете Instagram username →
приложение получает публичные данные профиля и последние Reels через Apify →
Anthropic анализирует лид по методологии XNINE → на выходе готовый sales
brief (ICP score, рекомендуемый оффер, sales angle, первое сообщение, next
best action).

## Запуск локально

```bash
npm install
cp .env.local.example .env.local   # заполнить APIFY_TOKEN / APIFY_ACTOR_ID / ANTHROPIC_API_KEY
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
| `ANTHROPIC_API_KEY` | да | Ключ Anthropic API |
| `ANTHROPIC_MODEL` | нет | По умолчанию `claude-sonnet-5` |

## Структура

- `lib/instagram/` — сбор сырых данных из Apify (profile + posts/Reels)
- `lib/normalize/` — приведение данных к единому формату (OBSERVED / unknown)
- `lib/sales-brain/` — методология XNINE: ICP, Launch/Growth/None, промпт,
  структурированный вызов Anthropic. Меняется отдельно от UI и backend-кода.
- `app/api/analyze/route.ts` — orchestration: Apify → normalize → AI → ответ
- `app/`, `components/` — интерфейс (главный экран, отчёт по лиду, история)

История анализов хранится в `localStorage` браузера (MVP, без БД).
