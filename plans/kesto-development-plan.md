---
planStatus:
  planId: plan-kesto-development
  title: "Kesto — План розробки, аудит мокапу та безпека"
  status: draft
  planType: system-design
  priority: high
  owner: belskii.nikolay
  stakeholders: []
  tags:
    - kesto
    - development
    - security
    - roadmap
  created: "2026-08-23"
  startDate: "2026-08-23"
  updated: "2026-08-23"
  progress: 0
---

# Kesto — План розробки, аудит мокапу та безпека

## Зміст

1. [Аудит мокапу (Logic-Chain)](#частина-1-аудит-мокапу)
2. [Технічний стек](#технічний-стек)
3. [Роадмап розробки](#частина-2-роадмап-розробки)
4. [Архітектура безпеки](#частина-3-архітектура-безпеки)

---

## Рішення (затверджені)

| Питання | Рішення |
|---|---|
| Платформи | Windows, macOS, Linux (Steam Deck) |
| Монетизація | Freemium: безкоштовно базові функції, $7.99 one-time за premium |
| Відеокамера | Ні — тільки голос + screen share |
| Постійні кімнати | У майбутньому, не в MVP |
| Технічний стек | **Tauri 2.0** (Rust backend + Web UI) |
| Архітектура | **Максимально P2P** — Steam Networking API для сигналінгу, WebRTC для голосу |

---

## Частина 1: Аудит мокапу

### Поточний мокап

[Kesto UI Mockup](kesto-mockup.mockup.html "width=1000 height=650")

### Що покрито коректно ✓

| Екран | Статус | Деталі |
|---|---|---|
| Dashboard | ✓ | Профіль Steam, статистика, Quick Call, Recent Activity |
| Friends | ✓ | Steam sync, presence (online/away/offline), Kesto detection, чекбокси для групового дзвінка |
| Groups | ✓ | Збережені групи, статистика (calls/duration/quality), кнопка Call Group |
| Active Call | ✓ | Speaking indicator, mute/deafen, учасники в сітці |
| Incoming Call | ✓ | Overlay з accept/decline, групові аватари |
| Settings | ✓ | Audio, Display (теми), Notifications, Account |
| About | ✓ | Логотип, версія, посилання |
| Theme switching | ✓ | Dark/Light працює через CSS variables |

### Відсутні екрани та потоки — КРИТИЧНІ ⚠

#### 1. Steam Login / Onboarding
**Проблема**: Немає екрану входу. Користувач відкриває застосунок і одразу бачить Dashboard — без автентифікації.

**Що потрібно**:
- Оскільки це Steam-додаток, вхід автоматичний через Steam Client — НЕ потрібен email/password
- Екран першого запуску: "Welcome to Kesto" → пояснення що друзі підтягуються з Steam → кнопка "Let's go"
- 2-3 кроки tutorial (carousel): "Call in one click" → "Share your screen" → "Groups save automatically"
- При першому запуску — запит дозволу на мікрофон

**Пріоритет**: Високий — без цього перше враження втрачене

#### 2. Ringing / Connecting стан
**Проблема**: Натиснув "Call" → що далі? У мокапі відразу Active Call без проміжного стану.

**Що потрібно**:
- **Вихідний дзвінок**: Overlay/модал "Calling NightFox..." з анімованим аватаром + кнопка "Cancel"
- **Очікування відповіді**: Пульсуюча анімація, таймер очікування (30 сек)
- **Підключення**: Коротке "Connecting..." → перехід в Active Call
- **Не відповів**: "NightFox didn't answer" → кнопка "Try Again" / "Close"
- Для групового дзвінку: показує хто вже підключився, хто ще дзвонить

**Пріоритет**: Критичний — це core flow, без нього неможливо зрозуміти як працює дзвінок

#### 3. Screen Sharing активний вигляд
**Проблема**: Кнопка "Share Screen" є, але немає екрану де видно шеринг.

**Що потрібно**:
- **Для того хто шерить**: маленький preview свого екрану + badge "You are sharing" + кнопка "Stop Sharing"
- **Для глядачів**: shared screen займає 80% площі, тайли учасників зсуваються в горизонтальну смужку зверху
- **Вибір джерела**: модал з превʼю — "Entire Screen" / список вікон
- Контроли залишаються внизу (auto-hide через 3 сек бездіяльності)

**Пріоритет**: Високий — screen sharing це ключова фіча продукту

#### 4. Create Group діалог
**Проблема**: Кнопка "+ Create Group" є, але куди веде?

**Що потрібно**:
- Модальне вікно: поле "Group name" + список друзів з чекбоксами + кнопка "Create"
- Або: після завершення групового дзвінка автоматично пропонує зберегти групу ("Save this group?")

**Пріоритет**: Середній — групи вже створюються автоматично після дзвінків

#### 5. Add Person під час дзвінка
**Проблема**: Кнопка "Add" у Active Call — куди веде?

**Що потрібно**:
- Висувна панель з переліком онлайн-друзів (тих хто має Kesto)
- Кнопка "Invite" біля кожного → відправляє вхідний дзвінок
- Показує статус: "Ringing..." / "Joined" / "Declined"

**Пріоритет**: Середній

#### 6. Мікрофон не знайдено (Steam Deck)
**Проблема**: Steam Deck не має вбудованого мікрофона. Що побачить користувач?

**Що потрібно**:
- Banner/toast: "No microphone detected. Connect a headset to start calling."
- Кнопка Call заблокована з tooltip "Microphone required"
- В Settings: підказка "No input device found"

**Пріоритет**: Високий для Steam Deck підтримки

### Відсутні екрани та потоки — БАЖАНІ

#### 7. Post-call summary
Після завершення дзвінка: коротка картка з тривалістю, якістю, кількістю учасників. Кнопки: "Call Again" / "Close".

#### 8. Text chat панель
Висувна панель праворуч під час Active Call. Прості текстові повідомлення + посилання. Відкривається по кнопці (яку потрібно додати в call controls).

#### 9. Premium upsell
- В Settings: секція "Kesto Premium" з порівнянням Free vs Premium
- При спробі шерити екран у FullHD (якщо Free): м'який prompt "Upgrade for HD sharing"
- НЕ блокувати базовий потік дзвінка — upsell тільки при зверненні до premium-фіч

#### 10. Empty states
- Friends: "Your Steam friends will appear here. Make sure Steam is running."
- Groups: "No groups yet. Start a group call and it'll be saved here."
- Dashboard activity: "No recent calls. Call a friend to get started!"

#### 11. Connection quality degraded
- Кольорова зміна індикатора якості: зелений → жовтий → червоний
- Toast: "Connection unstable" коли якість падає

#### 12. Invite друзів без Kesto
- У Friends біля юзерів з "No Kesto": кнопка "Share Kesto" → копіює Steam Store link

### Підсумок аудиту

| Категорія | Знайдено | Покрито | Відсутнє |
|---|---|---|---|
| Основні екрани | 7 | 7 | 0 |
| Критичні потоки | 5 | 2 | **3** (Login, Ringing, Screen Share) |
| Бажані потоки | 6 | 0 | **6** |
| **Загалом** | **18** | **9** | **9** |

**Вердикт**: Мокап покриває 100% статичних екранів, але лише ~40% інтерактивних потоків. Перед розробкою потрібно додати мінімум 3 критичних екрани: Onboarding, Ringing/Connecting, Screen Sharing view.

---

## Технічний стек

### Обраний стек: Tauri 2.0 + P2P

```
┌─────────────────────────────────────────────┐
│                  KESTO APP                  │
├─────────────────┬───────────────────────────┤
│   FRONTEND      │   BACKEND (Rust)          │
│                 │                           │
│   React/TS      │   Tauri Core              │
│   + Zustand     │   + Steam SDK (C FFI)     │
│   + WebRTC API  │   + WebRTC (libwebrtc)    │
│                 │   + Opus codec            │
│                 │   + RNNoise               │
│                 │   + Screen capture        │
├─────────────────┴───────────────────────────┤
│              STEAM NETWORKING               │
│   Signaling (P2P Relay via Steam)           │
│   Friends API · Presence · Overlay          │
└─────────────────────────────────────────────┘
```

### Чому Tauri 2.0

| Фактор | Tauri | Electron | C++/Qt |
|---|---|---|---|
| Розмір бінарника | ~5-10 MB | ~150+ MB | ~15-30 MB |
| RAM у фоні | ~30-50 MB | ~150-300 MB | ~20-40 MB |
| Безпека пам'яті | Rust ✓ | JS (GC) | Ручне управління |
| Швидкість UI розробки | Висока (React) | Висока (React) | Низька |
| Крос-платформа | ✓ | ✓ | ✓ (складніше) |
| Steam SDK інтеграція | Через FFI | node-steamworks | Нативна |
| Startup time | <1 сек | 2-5 сек | <0.5 сек |

### P2P архітектура

```
User A ◄──── WebRTC P2P (voice + screen) ────► User B
  │                                               │
  └──── Steam Networking API (signaling) ─────────┘
         (no custom server needed)

Group call (mesh, до 8 осіб):
User A ◄──► User B
  ▲  ╲      ╱  ▲
  │    ╲  ╱    │
  ▼      ╳      ▼
User D ◄──► User C
```

- **Сигналінг**: через Steam Networking API (ISteamNetworkingMessages) — безкоштовно, не потрібен свій сервер
- **Голос**: WebRTC peer-to-peer, Opus codec
- **TURN fallback**: Valve's Steam Relay network (безкоштовно для Steam-додатків)
- **Mesh для груп**: до ~8 учасників — mesh працює. Більше — потрібен SFU (майбутнє)

---

## Частина 2: Роадмап розробки

### Огляд фаз

| Фаза | Назва | Тижні | Дати | Ціль |
|---|---|---|---|---|
| 0 | Foundation | 1 | 23-29 серп | Tauri scaffold + Steam SDK + базове вікно |
| 1 | Core Voice | 3 | 1-21 вер | 1:1 дзвінок працює end-to-end |
| 2 | Groups & Multi | 3 | 22 вер - 12 жовт | Групові дзвінки + persistence |
| 3 | Screen Sharing | 3 | 13 жовт - 2 лист | Захоплення та трансляція екрану |
| 4 | Polish & Premium | 3 | 3-23 лист | Onboarding, freemium, text chat |
| 5 | Launch | 2 | 24 лист - 7 груд | Beta, тести, Steam submission |

**Загальна тривалість**: ~15 тижнів (3.5 місяці) → **Реліз: грудень 2026**

---

### Фаза 0: Foundation (Тиждень 1 — 23-29 серпня 2026)

**Ціль**: Робоче вікно Tauri зі Steam SDK авторизацією та навігацією.

- [ ] Ініціалізація Tauri 2.0 проекту (`cargo create-tauri-app`)
- [ ] Frontend: React + TypeScript + Vite + Zustand (state management)
- [ ] Підключення Steamworks SDK через Rust FFI (`steamworks` crate)
- [ ] Steam auto-login: отримати Steam ID, username, avatar при запуску
- [ ] Базовий UI shell: icon sidebar + content area (з мокапу)
- [ ] Роутинг: Dashboard / Friends / Groups / Settings / About
- [ ] Dark/Light тема (CSS variables, як у мокапі)
- [ ] Steam Friends list: отримати список через ISteamFriends API
- [ ] Показати друзів з presence (online/offline/in-game)
- [ ] CI/CD: GitHub Actions для білду Win/Mac/Linux

**Результат Phase 0**: Застосунок запускається, авторизується через Steam, показує список друзів.

---

### Фаза 1: Core Voice (Тижні 2-4 — 1-21 вересня 2026)

**Ціль**: Прямий голосовий дзвінок 1:1 працює від початку до кінця.

#### Тиждень 2: WebRTC та аудіо pipeline
- [ ] Інтеграція libwebrtc (Rust bindings або через C++ bridge)
- [ ] Opus codec налаштування (48kHz, стерео для premium, моно для free)
- [ ] Audio capture: вибір мікрофона (WASAPI/CoreAudio/PulseAudio)
- [ ] Audio playback: вибір динаміків/навушників
- [ ] Mute/deafen toggle на frontend

#### Тиждень 3: Signaling через Steam
- [ ] Signaling protocol: ICE candidates + SDP через Steam Networking Messages
- [ ] Call initiation flow: відправка "call request" через Steam API
- [ ] Call acceptance/decline: інший клієнт отримує та показує incoming overlay
- [ ] WebRTC PeerConnection: establish → voice flowing
- [ ] UI: Ringing screen ("Calling NightFox...") з кнопкою Cancel
- [ ] UI: Connecting → Active Call transition

#### Тиждень 4: Якість та надійність
- [ ] Voice Activity Detection (VAD) — індикатор хто говорить
- [ ] Speaking indicator в UI (синя рамка на тайлі)
- [ ] Call quality indicator (RTT, packet loss, jitter → bars)
- [ ] Graceful disconnect handling (мережа впала → reconnect або "Call ended")
- [ ] Audio test в Settings (record → playback)
- [ ] Інтеграція RNNoise для noise suppression

**Результат Phase 1**: Можна зателефонувати Steam-другу, поговорити, завершити дзвінок. Працює mute/deafen, noise suppression, quality indicator.

---

### Фаза 2: Groups & Multi-party (Тижні 5-7 — 22 вересня - 12 жовтня 2026)

**Ціль**: Групові дзвінки з persistence груп.

#### Тиждень 5: Multi-party mesh
- [ ] Mesh WebRTC: кожен учасник підключається до кожного (до 8 осіб)
- [ ] Рішення: mesh для ≤5, selective forwarding для 6-8 (один вузол як relay)
- [ ] Паралельний ringing: виклик усіх учасників одночасно
- [ ] UI: Grid layout для 2-8 учасників (auto-layout)
- [ ] Динамічне приєднання/від'єднання учасників

#### Тиждень 6: Groups persistence
- [ ] Локальна база (SQLite через rusqlite) для збережених груп
- [ ] Автоматичне збереження: після завершення групового дзвінка → "Save this group?"
- [ ] Create Group діалог: вибір друзів + назва
- [ ] Groups UI: list з call stats (total calls, avg duration, avg quality)
- [ ] Delete group functionality

#### Тиждень 7: Polish multi-party
- [ ] Add Person під час дзвінка (висувна панель)
- [ ] Group call info: тривалість, якість, кількість учасників
- [ ] Notification: "NightFox joined / left the call"
- [ ] Post-call summary card
- [ ] Dashboard: оновлення stats та recent activity з реальними даними

**Результат Phase 2**: Групові дзвінки працюють. Групи зберігаються між сесіями. Dashboard показує реальну статистику.

---

### Фаза 3: Screen Sharing (Тижні 8-10 — 13 жовтня - 2 листопада 2026)

**Ціль**: Шеринг екрану з кодуванням та FPS контролем.

#### Тиждень 8: Screen capture
- [ ] Платформо-специфічний capture:
  - Windows: DXGI Desktop Duplication API
  - macOS: ScreenCaptureKit (SCStream)
  - Linux: PipeWire + XDG Desktop Portal
- [ ] Вибір джерела: модал "Entire Screen" / окремі вікна з превʼю
- [ ] Encoding pipeline: захоплення → H.264 (або VP9 для кращої якості)

#### Тиждень 9: Streaming та viewer
- [ ] WebRTC video track для screen share (окремий від voice)
- [ ] Viewer UI: shared screen 80% площі, тайли учасників у strip зверху
- [ ] Auto-hide controls (3 сек бездіяльності)
- [ ] Fit-to-window масштабування + scroll/zoom колесом
- [ ] Badge "NightFox is sharing screen"
- [ ] Кнопка "Stop Sharing" для того хто шерить

#### Тиждень 10: FPS та Freemium gate
- [ ] FPS контроль: Free = 720p/30fps, Premium = 1080p-2K/60fps
- [ ] Перевірка premium статусу перед HD sharing
- [ ] Soft upsell: "Upgrade to share in Full HD" (не блокує, дає 720p)
- [ ] Latency оптимізація: pipeline <100ms capture-to-display
- [ ] Steam Deck тестування capture через Proton/native

**Результат Phase 3**: Screen sharing працює на всіх платформах. Free/Premium різниця в якості.

---

### Фаза 4: Polish & Premium (Тижні 11-13 — 3-23 листопада 2026)

**Ціль**: Product-ready якість, onboarding, монетизація.

#### Тиждень 11: Onboarding та UX
- [ ] First-launch flow: Welcome → Tutorial (3 кроки) → App
- [ ] Мікрофон permission request при першому запуску
- [ ] Empty states для Friends/Groups/Dashboard
- [ ] "No microphone" banner для Steam Deck
- [ ] Connection quality toast ("Unstable connection")
- [ ] "Share Kesto" кнопка біля друзів без Kesto → копіює Steam Store URL

#### Тиждень 12: Premium та монетизація
- [ ] Premium status перевірка через Steam DLC або In-App Purchase
- [ ] Settings: секція "Kesto Premium" з порівнянням Free vs Premium
- [ ] Premium features gate:
  - Voice: Enhanced Opus codec settings
  - Screen Share: 1080p-2K, 60fps
  - Customization: custom frames/themes
- [ ] Steam Overlay інтеграція: buy premium через Steam

#### Тиждень 13: Text chat та фінальний polish
- [ ] Lightweight text chat: висувна панель під час дзвінка
- [ ] Повідомлення через Steam Networking (P2P, encrypted)
- [ ] Посилання, emoji — без тредів/каналів
- [ ] Keyboard shortcuts: Ctrl+M (mute), Ctrl+D (deafen), Ctrl+E (end call)
- [ ] Accessibility: WCAG AA contrast, screen reader labels
- [ ] Performance: startup <1 сек, RAM <50MB idle

**Результат Phase 4**: Product-ready застосунок з усіма фічами, onboarding, premium.

---

### Фаза 5: Launch Prep (Тижні 14-15 — 24 листопада - 7 грудня 2026)

**Ціль**: Beta, тестування, Steam submission.

- [ ] Steamworks: створення App ID, store page, screenshots
- [ ] Store description + capsule art
- [ ] Beta testing: закрите бета через Steam Playtests
- [ ] Cross-platform QA:
  - Windows 10/11 тестування
  - macOS 13+ (Apple Silicon + Intel)
  - Ubuntu 22.04+ / SteamOS (Steam Deck)
- [ ] Performance benchmarks: CPU, RAM, startup time, audio latency
- [ ] Code signing:
  - Windows: Authenticode certificate
  - macOS: Apple notarization
  - Linux: AppImage з GPG
- [ ] Steam review submission
- [ ] Crash reporting: Sentry інтеграція (opt-in)
- [ ] Privacy policy + Terms of Service

**Результат Phase 5**: Kesto опублікований у Steam Store.

---

## Частина 3: Архітектура безпеки

### Модель загроз

```
                    ┌─────────────────┐
                    │   ЗАГРОЗИ       │
                    └────────┬────────┘
         ┌──────────────┬────┴────┬──────────────┐
         ▼              ▼         ▼              ▼
   ┌──────────┐  ┌──────────┐ ┌────────┐  ┌──────────┐
   │ MITM на  │  │ Account  │ │ DDoS   │  │ Binary   │
   │ голос    │  │ Takeover │ │ атака  │  │ Tamper   │
   └────┬─────┘  └────┬─────┘ └───┬────┘  └────┬─────┘
        │              │           │             │
        ▼              ▼           ▼             ▼
   E2E encrypt   Steam-only   P2P arch     Code signing
   SRTP + DTLS   auth (no     + Steam      + Steam
                 passwords)   relay        integrity
```

### 1. Шифрування комунікацій

#### Голосовий трафік
- **SRTP** (Secure Real-time Transport Protocol) для всіх voice streams
- **DTLS** (Datagram TLS) для обміну ключами
- End-to-end: навіть TURN relay не може розшифрувати голос
- Perfect Forward Secrecy: нові ключі для кожного дзвінка

#### Сигналінг
- Steam Networking API вже шифрований (Steam's encryption layer)
- Додатковий шар: повідомлення підписуються ключем сесії
- Certificate pinning для будь-яких HTTPS запитів

#### Screen sharing
- Той самий WebRTC encrypted channel що і для голосу
- SRTP для відео потоку

### 2. Автентифікація та авторизація

#### Steam-only auth (НІЯКИХ власних паролів)
```
┌──────────┐     ┌───────────────┐     ┌──────────────┐
│  Steam   │────►│ Steam Client  │────►│   Kesto      │
│  Login   │     │ Auth Ticket   │     │   Validates  │
└──────────┘     └───────────────┘     └──────────────┘
```
- Користувач логіниться в Steam → Kesto отримує encrypted auth ticket
- Перевірка через `ISteamUser::GetAuthSessionTicket()`
- **Нуль паролів** для зберігання або захисту — Steam handles all auth
- Steam Guard (2FA) вже захищає аккаунт

#### Сесійна безпека
- Session token зберігається в OS keychain:
  - Windows: DPAPI (Credential Manager)
  - macOS: Keychain Services
  - Linux: libsecret (GNOME Keyring / KWallet)
- Token автоматично invalidated при виході з Steam
- Ніколи не зберігати tokens у plaintext файлах

### 3. Безпека застосунку

#### Memory Safety (Rust)
- Tauri backend написаний на Rust → **compile-time гарантії**:
  - Відсутність buffer overflows
  - Відсутність use-after-free
  - Відсутність data races
  - Відсутність null pointer dereferences
- Unsafe блоки тільки для Steam SDK FFI — мінімізовані та обгорнуті в safe API

#### Code Signing
| Платформа | Метод | Деталі |
|---|---|---|
| Windows | Authenticode | EV або OV code signing certificate |
| macOS | Apple Notarization | Developer ID + notarize через xcrun |
| Linux | GPG | Підписаний AppImage, .deb/.rpm з GPG ключем |

#### Захист від tampering
- Steam перевіряє integrity файлів при запуску (Steam DRM)
- Checksums критичних бінарників при runtime
- Automatic updates тільки через Steam (signed by Valve)

#### Dependency security
- `cargo audit` в CI — блокує білд при known vulnerabilities
- `npm audit` для frontend dependencies
- Lockfile pinning (Cargo.lock, package-lock.json committed)
- Мінімальна кількість dependencies — менше attack surface

### 4. Захист даних користувача

#### Мінімальний збір даних
| Дані | Де зберігаються | Хто має доступ |
|---|---|---|
| Steam ID | Локально | Тільки клієнт |
| Friends list | Кеш в памʼяті (з Steam API) | Тільки клієнт |
| Групи | Локальний SQLite | Тільки клієнт |
| Call history | Локальний SQLite | Тільки клієнт |
| Налаштування | Локальний файл | Тільки клієнт |
| Голосові дані | **НІДЕ** — stream only | Учасники дзвінка |

#### Ніякого серверного збору
- **Жодні** голосові дані не записуються і не зберігаються
- **Жодні** метадані дзвінків не відправляються на сервер
- **Нуль** аналітики за замовчуванням
- Crash reports — тільки з explicit opt-in, анонімізовані

#### Локальне шифрування
- SQLite база зашифрована через SQLCipher
- Ключ шифрування зберігається в OS keychain
- При видаленні застосунку — всі дані видаляються

### 5. Мережева безпека

#### P2P переваги для безпеки
- Голос йде напряму між користувачами — немає центрального сервера який можна зламати
- Навіть Valve не має доступу до голосових даних (E2E encryption)
- При компрометації сигналінгу — голос залишається зашифрованим

#### Rate Limiting
- Call initiation: max 10 дзвінків на хвилину per Steam ID
- Friend-related API: max 60 запитів на хвилину
- Захист від spam-calling та resource exhaustion

#### NAT Traversal безпека
- ICE candidates обмінюються через зашифрований Steam channel
- TURN: використовується тільки Steam Relay (Valve's infrastructure)
- Немає exposure приватної IP-адреси через STUN (Steam relay приховує)

### 6. Чеклист безпеки для кожного релізу

- [ ] `cargo audit` — нуль known vulnerabilities
- [ ] `npm audit` — нуль critical/high
- [ ] Усі бінарники code-signed
- [ ] E2E encryption тести пройдено
- [ ] Penetration test основних потоків
- [ ] Privacy policy актуальна
- [ ] Dependency licenses перевірені
- [ ] Steam integrity verification працює
- [ ] Keychain storage тести на всіх платформах
- [ ] No plaintext secrets у коді або конфігах

---

## Наступні кроки (сьогодні)

- [ ] Ініціалізувати Tauri 2.0 проект
- [ ] Налаштувати Steamworks SDK
- [ ] Зібрати базовий UI shell з навігацією
- [ ] Підключити Steam auto-login
- [ ] Додати відсутні екрани в мокап (Onboarding, Ringing, Screen Share view)
