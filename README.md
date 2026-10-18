# Dugout Online - Match Momentum

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
