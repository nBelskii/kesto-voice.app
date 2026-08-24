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

Оскільки і ти, і друг — на **Windows**, другу НЕ потрібно ставити Rust/Node чи щось збирати самому. Ти збираєш готовий `.exe`-інсталятор на своєму ПК і просто надсилаєш файл.

### На своєму Windows-десктопі (після кроків з розділу 1):

```bash
cd app
npm run tauri build
```

Це створить встановлювач в `app/src-tauri/target/release/bundle/nsis/Kesto_0.1.0_x64-setup.exe` (або `/msi/...msi` — обидва формати збираються за замовчуванням). Перший release-білд повільніший за dev (оптимізована компіляція), рахуй кілька хвилин.

`steam_api64.dll` вже налаштовано підтягуватись автоматично в інсталятор (`tauri.windows.conf.json`) — окремо копіювати нічого не треба.

### Що робить друг:

1. Отримує від тебе файл `Kesto_..._x64-setup.exe` (будь-яким способом — Telegram, Google Drive, тощо).
2. Запускає інсталятор. Windows SmartScreen може показати "Windows protected your PC" (бо .exe не підписаний сертифікатом розробника) — тисне **"More info" → "Run anyway"**. Це нормально для тестової збірки, не помилка.
3. У друга має бути **встановлений, запущений і залогінений Steam**.
4. Запускає Kesto — жодних додаткових залежностей не потрібно, `steam_api64.dll` вже всередині.

### Якщо щось зміниться в коді (перший раз vs надалі)

**Перший раз** — усе як вище: збираєш `.exe`, надсилаєш другу вручну, він ставить.

**Після цього — автооновлення.** Друг більше НЕ качає файли вручну: Kesto сам перевіряє нову версію при запуску, завантажує її у фоні та пропонує кнопку "Restart & Update" всередині застосунку. Технічно це працює через окремий публічний репозиторій [`kesto-releases`](https://github.com/nBelskii/kesto-releases) — туди складаються тільки готові білди (без вихідного коду), і Kesto читає звідти маніфест останньої версії.

Щоб випустити нову версію:

1. Підніми версію в `app/src-tauri/tauri.conf.json` (поле `"version"`, наприклад `0.1.0` → `0.2.0`).
2. Збери з підписом (Windows PowerShell):
   ```powershell
   $env:TAURI_SIGNING_PRIVATE_KEY = "<приватний ключ, збережений у менеджері паролів>"
   $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<пароль до ключа>"
   npm run tauri build
   ```
   Це створить `.exe`/`.msi` **і** файл підпису `.sig` поруч (в `app/src-tauri/target/release/bundle/nsis/`).
3. Зайди на [github.com/nBelskii/kesto-releases/releases/new](https://github.com/nBelskii/kesto-releases/releases/new):
   - Тег: `v0.2.0` (та сама версія, що в кроці 1)
   - Прикріпи файли: `Kesto_0.2.0_x64-setup.exe` і `Kesto_0.2.0_x64-setup.exe.sig`
   - Створи файл `latest.json` (текстовий редактор) з таким вмістом і теж прикріпи його до релізу:
     ```json
     {
       "version": "0.2.0",
       "notes": "Опис що нового",
       "pub_date": "2026-08-23T00:00:00Z",
       "platforms": {
         "windows-x86_64": {
           "signature": "<весь вміст .sig файлу — відкрий його текстовим редактором і скопіюй>",
           "url": "https://github.com/nBelskii/kesto-releases/releases/download/v0.2.0/Kesto_0.2.0_x64-setup.exe"
         }
       }
     }
     ```
   - Опублікуй реліз (Publish release)

Після цього у друга при наступному запуску Kesto сама запропонує оновитись — жодних файлів пересилати не треба. (Автоматизація цього процесу через GitHub Actions — можлива наступна ітерація, коли релізів стане більше.)

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

### PowerShell блокує npm ("running scripts is disabled on this system")

```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system. For
more information, see about_Execution_Policies at https:/go.microsoft.com/fwlink/?LinkID=135170.
At line:1 char:1
+ npm run tauri dev
+ ~~~
    + CategoryInfo          : SecurityError: (:) [], PSSecurityException
    + FullyQualifiedErrorId : UnauthorizedAccess
```

Стандартне обмеження Windows PowerShell (npm використовує `.ps1`-обгортку). Виправляється один раз, прав адміністратора не треба:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Підтверди `Y` якщо запитає, потім повтори `npm install` / `npm run tauri dev`. Альтернатива без зміни політики — запускати ті самі команди через `cmd.exe` замість PowerShell.
