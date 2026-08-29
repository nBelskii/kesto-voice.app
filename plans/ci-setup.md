# Автоматизація релізів (GitHub Actions) — разове налаштування

Після цього одноразового налаштування кожен новий реліз = підняти версію
у 3 файлах, закомітити, і:

```
git tag v0.1.3
git push origin v0.1.3
```

Все інше (збірка, підпис, публікація на kesto-releases) стається само,
поки твій десктоп увімкнений.

## Чому self-hosted runner

Steamworks SDK — пропрієтарний, його не можна класти в git чи публічно
качати. Замість хмарного сервера GitHub Actions буде дистанційно запускати
збірку на ТВОЄМУ ж Windows-десктопі, де SDK вже стоїть.

## Крок 1 — скопіювати SDK у стабільну папку

На Windows-десктопі, там де в тебе лежить `app/src-tauri/steamworks_sdk`,
скопіюй цю папку в:

```
C:\kesto-build-cache\steamworks_sdk
```

(Створи `C:\kesto-build-cache`, якщо нема.) Workflow буде брати SDK звідси
на кожен запуск, бо checkout репозиторію робиться в чисту робочу папку без
гітігнорнутих файлів.

## Крок 2 — зареєструвати self-hosted runner

1. Відкрий `github.com/nBelskii/kesto-voice.app` → **Settings** → **Actions**
   → **Runners** → **New self-hosted runner**.
2. Обери **Windows**, **x64**.
3. GitHub покаже блок PowerShell-команд — скопіюй їх ПО ПОРЯДКУ і виконай у
   PowerShell на десктопі (в довільній папці, наприклад `C:\actions-runner`).
4. В кінці буде команда `.\run.cmd` — вона запускає runner лише в
   поточному вікні (закриєш вікно — runner зупиниться). Щоб він працював
   постійно у фоні як служба Windows, замість цього виконай (з тієї ж
   папки, PowerShell від імені адміністратора):
   ```
   .\svc install
   .\svc start
   ```

Після цього в GitHub → Settings → Actions → Runners з'явиться твій
десктоп зі статусом **Idle** (зелений) — значить він готовий приймати
завдання.

## Крок 3 — додати секрети

Той же репозиторій → **Settings** → **Secrets and variables** → **Actions**
→ **New repository secret**. Додай три:

| Ім'я | Значення |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | той самий приватний ключ, що й у `setx` на десктопі |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | той самий пароль до ключа |
| `RELEASES_TOKEN` | новий Personal Access Token (крок 4) |

## Крок 4 — токен для публікації на kesto-releases

Workflow збирається в `kesto-voice.app`, але публікує реліз у ІНШИЙ
репозиторій (`kesto-releases`) — для цього потрібен окремий токен:

1. `github.com/settings/tokens` → **Generate new token** → **Fine-grained token**.
2. **Resource owner**: твій акаунт.
3. **Repository access** → **Only select repositories** → обери `kesto-releases`.
4. **Permissions** → **Repository permissions** → **Contents** → **Read and write**.
5. Згенеруй, скопіюй значення (показується один раз) — встав його як
   секрет `RELEASES_TOKEN` з кроку 3.

## Готово

Тепер новий тег автоматично:
1. Забирає SDK з `C:\kesto-build-cache`.
2. `npm run tauri build` з підписом.
3. Створює реліз у `kesto-releases` з `.exe`, `.exe.sig` і згенерованим
   `latest.json`.

Прогрес видно на вкладці **Actions** в `kesto-voice.app`.
