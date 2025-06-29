# Автоматизированное тестирование сервиса межгалактической аналитики

Система автоматизированного тестирования для React-приложения анализа CSV файлов.

## Тестовые сценарии

Покрытие всех функциональных требований через **194 автоматических теста**:

### 1. Загрузка и анализ CSV файлов
- Загрузка через файловый браузер и drag & drop
- Валидация формата файла (.csv только)
- Отправка на сервер и получение результатов
- Отображение хайлайтов с метриками
- Обработка ошибок сервера и сети

### 2. Отображение прогресса обработки
- Loader во время обработки
- Блокировка интерфейса
- Переходы между состояниями
- Сообщения о статусе

### 3. Генератор тестовых данных
- Генерация и скачивание CSV файла
- Правильные HTTP заголовки
- Обработка ошибок генерации

### 4. История загрузок
- Сохранение в LocalStorage
- Отображение в модальном окне
- Удаление отдельных записей
- Очистка всей истории

### 5. Навигация между разделами
- Переходы между страницами
- Активное состояние меню
- Keyboard accessibility

## Архитектура тестирования

```
E2E Tests (87)        ← Playwright - пользовательские сценарии
Integration (79)      ← Vitest + React Testing Library  
Unit Tests (28)       ← Vitest - функции, хуки, утилиты
```

### Распределение тестов

| Функция | Unit | Integration | E2E | Всего |
|---------|------|-------------|-----|-------|
| Анализ CSV | 5 | 16 | 17 | 38 |
| Прогресс | 7 | 26 | 8 | 41 |
| Генератор | - | - | 36 | 36 |
| История | 10 | 20 | 8 | 38 |
| Навигация | 6 | 17 | 18 | 41 |

## Используемые технологии

### Unit & Integration тесты
- **Vitest** - test runner
- **React Testing Library** - тестирование компонентов
- **@testing-library/user-event** - симуляция действий пользователя
- **jsdom** - DOM окружение

### E2E тесты
- **Playwright** - кроссбраузерное тестирование
- **TypeScript** - типизация тестов

### Coverage
- **@vitest/coverage-v8** - отчеты о покрытии кода

## Инструкции по запуску

### Установка
```bash
npm install

# Установка Playwright (для E2E тестов)
npx playwright install
```

### Запуск серверов
Для корректной работы E2E тестов необходимо запустить серверы:

```bash
# Клиентское приложение (терминал 1)
npm run dev
# Приложение будет доступно на http://localhost:5173

# Backend сервер (терминал 2) 
# Запустите ваш backend сервер для API запросов
# Убедитесь что сервер отвечает на /api/report и /api/generate
```

### Все тесты
```bash
# Unit + Integration тесты (107)
npm run test

# E2E тесты (87)
npm run test:e2e
```

### Режимы разработки
```bash
# Watch mode
npm run test:watch

# Coverage отчет
npm run coverage

# E2E с UI
npm run test:e2e-ui

# E2E в браузере
npm run test:e2e-headed
```

### Отдельные группы
```bash
# Только unit тесты
npx vitest run src/utils src/hooks

# Только integration тесты
npx vitest run src/components src/ui

# Конкретная страница E2E
npx playwright test src/pages/Home

# Конкретный браузер
npx playwright test --project=chromium
```

### Отладка
```bash
# Verbose вывод
npx vitest run --reporter=verbose

# E2E с отладкой
npx playwright test --debug

# Test generator
npx playwright codegen localhost:5173
```

## Структура тестов

```
src/
├── components/
│   ├── Dropzone/__tests__/Dropzone.integration.test.tsx
│   ├── HistoryModal/__tests__/HistoryModal.integration.test.tsx
│   ├── HistoryList/__tests__/HistoryList.integration.test.tsx
│   └── Header/Navigation/__tests__/Navigation.integration.test.tsx
├── hooks/__tests__/
│   ├── use-csv-analysis.test.ts
│   └── use-debounce.test.ts
├── pages/
│   ├── Home/__tests__/HomePage.e2e.test.ts
│   └── Generate/__tests__/GeneratePage.e2e.test.ts
├── ui/Modal/__tests__/Modal.integration.test.tsx
└── utils/__tests__/
    ├── analysis.test.ts
    ├── storage.test.ts
    ├── persist.test.ts
    └── formateDate.test.ts
```

## Покрытие кода

```
Общее покрытие: 65.85%
├── Statements: 65.85%
├── Branches: 90.17%
├── Functions: 79.31%
└── Lines: 65.85%
```

**Высокое покрытие (90-100%):** утилиты, хуки, UI компоненты  
**E2E покрытие:** страничные компоненты, роутинг, API интеграция

## Результат

✅ **194 автоматических теста** покрывают все функциональные требования  
✅ **Трехуровневая архитектура** обеспечивает оптимальное соотношение скорости и надежности  
✅ **Полная изоляция тестов** гарантирует стабильность результатов
