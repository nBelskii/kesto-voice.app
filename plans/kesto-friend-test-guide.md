# Kesto — Інструкція: синхронізація з десктопом + тест дзвінка з другом

## 1. Перенести розробку на десктоп (ПК)

Репозиторій `git@github.com:nBelskii/kesto-voice.app.git` вже містить весь код. На десктопі:

```bash
git clone git@github.com:nBelskii/kesto-voice.app.git
cd kesto-voice.app
```

Якщо SSH-ключ для GitHub ще не налаштований на цьому ПК — або згенеруй новий і додай на github.com/settings/keys, або клонуй через HTTPS з Personal Access Token.

### Встановити інструменти (одноразово на кожній машині)

- **Rust**: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Node.js** (18+): через nodejs.org або nvm
- Windows додатково: [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (C++ workload) — потрібен для компіляції Rust-частини Tauri.

### Steamworks SDK (окремо на кожній машині — НЕ в git)

SDK ліцензійно не можна класти в репозиторій (`app/src-tauri/steamworks_sdk/` в `.gitignore`), тож на десктопі:

1. Зайди на [partner.steamgames.com](https://partner.steamgames.com) (той самий акаунт) → "Download latest SDK"
2. Розпакуй, скопіюй **лише** дві папки в проект:
   ```
   sdk/public/                → app/src-tauri/steamworks_sdk/public/
   sdk/redistributable_bin/   → app/src-tauri/steamworks_sdk/redistributable_bin/
   ```

### Запуск

```bash
cd app
npm install
npm run tauri dev
```

Steam має бути запущений і залогінений на цій машині. Перший білд Rust-частини займе кілька хвилин (компіляція ~350+ crates), далі — секунди.

### Синхронізація надалі

Перед початком роботи на будь-якій машині: `git pull`. Після роботи: коміт+push (я можу робити це за тебе через commit tool). SDK-папку синхронізувати не треба — вона незалежна на кожній машині.

---

## 2. Що потрібно другу для тесту 1:1

Друг має бути **вже доданий як Steam-друг** (P2P сигналінг іде через `ISteamNetworkingMessages`, яка працює тільки між Steam-друзями).

Оскільки в Kesto ще немає збірки .exe/.app для розповсюдження (це буде Фаза 5), найпростіший шлях — друг теж запускає з вихідного коду:

1. **Дай доступ до коду.** Найпростіше — заархівуй папку `app/` (без `node_modules` і `src-tauri/target` — вони величезні й генеруються заново) і надішли другу напряму. Або додай його як collaborator на приватний GitHub-репо (Settings → Collaborators).
2. Друг ставить **Rust + Node.js** (див. вище).
3. Друг **безкоштовно** реєструється на partner.steamgames.com (Steamworks Partner — без $100 fee, це лише SDK-доступ) і завантажує SDK, копіює `public/` + `redistributable_bin/` у свій `app/src-tauri/steamworks_sdk/`.
4. Друг запускає `npm install && npm run tauri dev` у своїй копії `app/`.
5. У друга має бути **запущений і залогінений Steam**.

---

## 3. Як провести сам тест дзвінка

1. Обидва відкривають Kesto → проходять Login → Welcome → Dashboard.
2. На Dashboard заголовок має показувати **"Steam connected"** (не "mock data") — якщо ні, перевірте що Steam запущений.
3. Один з вас заходить у **Friends**, знаходить іншого в списку (реальне Steam-ім'я), тисне **Call**.
4. У того, кому дзвонять — має за ~секунду виринути екран **Incoming Call** з іменем того, хто дзвонить.
5. Тисне **Accept** → обидва бачать **"Connecting..."**, потім **Active Call** з таймером що йде.
6. Перевірте: чути голос обидва напрямки, кнопка **Mute** реально вимикає мікрофон, **End** завершує дзвінок для обох.

### Якщо не з'єднується (Connecting не переходить в Active Call)

Зараз signaling іде через Steam, а сам голос — напряму по WebRTC (P2P) з публічним STUN-сервером Google, **без TURN-релею**. Якщо хтось із вас за складним NAT (частий випадок з мобільного інтернету, деяких корпоративних/публічних мереж) — пряме з'єднання може не встановитись. Це очікуване обмеження поточної версії — TURN/Steam Relay fallback ще не підключений (наступний крок після цього тесту, якщо знадобиться).

### Дозвіл на мікрофон

При першому запуску ОС (macOS/Windows) покаже системний запит доступу до мікрофона — обов'язково дозволити, інакше `getUserMedia` впаде з помилкою і дзвінок не почнеться.
