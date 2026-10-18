# Dugout Online - Match Momentum

**English below**

Userscript dla **Dugout Online**, który dodaje do strony meczu zakładkę **Match Momentum** z:

- wykresem momentum meczu,
- czytelnym przebiegiem spotkania,
- statystykami,
- obsługą starego i nowego interfejsu meczu,
- automatycznymi aktualizacjami przez Tampermonkey.

## Wymagania

Do działania skryptu potrzebujesz:

- przeglądarki **Chrome** lub **Firefox**,
- rozszerzenia **Tampermonkey**,
- konta i dostępu do serwisu Dugout Online.

## Instalacja

### 1. Zainstaluj Tampermonkey

Zainstaluj rozszerzenie Tampermonkey odpowiednie dla swojej przeglądarki:

- Chrome: https://www.tampermonkey.net/
- Firefox: https://www.tampermonkey.net/

Po instalacji upewnij się, że rozszerzenie jest włączone.

### 2. Zainstaluj skrypt Match Momentum

Kliknij poniższy link:

**[Zainstaluj Dugout Match Momentum](https://raw.githubusercontent.com/zamorrr/do-match-momentum-js/main/Dugout_Match_Momentum.user.js)**

Tampermonkey powinien automatycznie otworzyć ekran instalacji userscriptu.

Kliknij **Install / Zainstaluj**.

> Jeżeli po kliknięciu linku zobaczysz tylko kod źródłowy, sprawdź, czy Tampermonkey jest aktywny i ma uprawnienia do działania na stronach `raw.githubusercontent.com`.

## Uruchomienie

1. Zaloguj się do **Dugout Online**.
2. Otwórz stronę dowolnego meczu.
3. Na stronie meczu pojawi się dodatkowa zakładka **Match Momentum**.
4. Kliknij ją, aby zobaczyć wykres, przebieg meczu i statystyki.

Skrypt korzysta wyłącznie z danych dostępnych na aktualnie otwartej stronie meczu. Nie wymaga osobnego logowania, hasła ani dodatkowej konfiguracji.

## Aktualizacje

Skrypt jest skonfigurowany do automatycznego sprawdzania aktualizacji z tego repozytorium.

Nie musisz ponownie instalować skryptu po każdej nowej wersji. Gdy w repozytorium pojawi się wersja z wyższym numerem `@version`, Tampermonkey może ją wykryć i zaktualizować skrypt.

Aby ręcznie sprawdzić dostępność aktualizacji:

1. Otwórz **Tampermonkey Dashboard / Panel sterowania**.
2. Znajdź **Dugout Online - Match Momentum**.
3. Użyj opcji **Check for userscript updates / Sprawdź aktualizacje**.
4. Jeżeli dostępna jest nowsza wersja, kliknij **Aktualizuj**.

## Obsługiwane adresy

Skrypt działa na stronach meczów:

```text
https://dugout-online.com/game/*
https://www.dugout-online.com/game/*
```

## Prywatność

Skrypt:

- nie przechowuje loginu ani hasła,
- nie wysyła danych do zewnętrznych usług,
- nie używa Google Drive,
- nie korzysta z analityki ani śledzenia użytkownika,
- działa bezpośrednio na danych dostępnych w stronie meczu.

## Problemy

Jeżeli zakładka **Match Momentum** nie pojawia się:

1. odśwież stronę meczu,
2. sprawdź, czy skrypt jest włączony w Tampermonkey,
3. sprawdź, czy adres strony zaczyna się od `https://dugout-online.com/game/` lub `https://www.dugout-online.com/game/`,
4. sprawdź, czy masz zainstalowaną najnowszą wersję skryptu.

Jeżeli problem nadal występuje, zgłoś go w sekcji **Issues** tego repozytorium i podaj:

- adres typu strony meczu (bez danych logowania),
- przeglądarkę,
- wersję Tampermonkey,
- wersję skryptu,
- krótki opis problemu,
- opcjonalnie zrzut ekranu.

## Repozytorium

Kod źródłowy i najnowsza wersja skryptu:

https://github.com/zamorrr/do-match-momentum-js

---

# English

A userscript for **Dugout Online** that adds a **Match Momentum** tab to match pages with:

- a match momentum chart,
- a compact and readable match timeline,
- match statistics,
- support for both the old and new match interface,
- automatic updates through Tampermonkey.

## Requirements

To use the script you need:

- **Chrome** or **Firefox**,
- the **Tampermonkey** extension,
- an account with access to Dugout Online.

## Installation

### 1. Install Tampermonkey

Install Tampermonkey for your browser:

- Chrome: https://www.tampermonkey.net/
- Firefox: https://www.tampermonkey.net/

After installation, make sure the extension is enabled.

### 2. Install Match Momentum

Click the link below:

**[Install Dugout Match Momentum](https://raw.githubusercontent.com/zamorrr/do-match-momentum-js/main/Dugout_Match_Momentum.user.js)**

Tampermonkey should automatically open the userscript installation screen.

Click **Install**.

> If you only see the source code after opening the link, make sure Tampermonkey is enabled and has permission to run on `raw.githubusercontent.com`.

## How to use it

1. Log in to **Dugout Online**.
2. Open any match page.
3. A new **Match Momentum** tab should appear on the match page.
4. Open it to view the momentum chart, match timeline and statistics.

The script only uses data already available on the currently opened match page. It does not require a separate login, password or any additional configuration.

## Updates

The script is configured to check this GitHub repository for updates automatically.

You do not need to reinstall the script whenever a new version is released. When the repository contains a version with a higher `@version` number, Tampermonkey can detect it and update the installed script.

To check for updates manually:

1. Open the **Tampermonkey Dashboard**.
2. Find **Dugout Online - Match Momentum**.
3. Use **Check for userscript updates**.
4. If a newer version is available, confirm the update.

## Supported URLs

The script runs on match pages matching:

```text
https://dugout-online.com/game/*
https://www.dugout-online.com/game/*
```

## Privacy

The script:

- does not store your username or password,
- does not send data to external services,
- does not use Google Drive,
- does not use analytics or user tracking,
- works directly with data available on the match page.

## Troubleshooting

If the **Match Momentum** tab does not appear:

1. refresh the match page,
2. check that the script is enabled in Tampermonkey,
3. make sure the page URL starts with `https://dugout-online.com/game/` or `https://www.dugout-online.com/game/`,
4. make sure you are using the latest version of the script.

If the problem persists, create an **Issue** in this repository and include:

- the type of match page URL, without any login data,
- your browser,
- your Tampermonkey version,
- your script version,
- a short description of the problem,
- optionally, a screenshot.

## Repository

Source code and the latest version of the script:

https://github.com/zamorrr/do-match-momentum-js
