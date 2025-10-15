# Plan Testów Aplikacji 10x-aimondo

## 1. Wprowadzenie i Cele Testowania

### Wprowadzenie

Niniejszy dokument opisuje kompleksowy plan testów dla aplikacji webowej `10x-aimondo`. Aplikacja umożliwia użytkownikom zarządzanie swoimi treningami w formacie GPX oraz ich wizualizację na mapie, w tym w formie mapy ciepła (heatmap). Plan ten został opracowany w oparciu o analizę stosu technologicznego, architektury oraz kluczowych funkcjonalności projektu.

### Cele Testowania

Głównym celem testów jest zapewnienie wysokiej jakości, niezawodności, bezpieczeństwa i wydajności aplikacji przed jej wdrożeniem. Cele szczegółowe obejmują:

- **Weryfikacja funkcjonalna:** Upewnienie się, że wszystkie funkcjonalności działają zgodnie ze specyfikacją.
- **Zapewnienie bezpieczeństwa:** Identyfikacja i eliminacja potencjalnych luk w zabezpieczeniach, zwłaszcza w obszarach autentykacji i autoryzacji dostępu do danych.
- **Ocena wydajności:** Sprawdzenie, jak aplikacja radzi sobie pod obciążeniem, szczególnie w kontekście przetwarzania plików GPX i generowania mapy ciepła.
- **Zapewnienie użyteczności (Usability):** Ocena, czy interfejs użytkownika jest intuicyjny i przyjazny.
- **Weryfikacja kompatybilności:** Sprawdzenie poprawnego działania aplikacji na różnych przeglądarkach.

## 2. Zakres Testów

### Funkcjonalności objęte testami:

- **Moduł autentykacji:** Rejestracja, logowanie, wylogowywanie, resetowanie hasła, zmiana hasła.
- **Zarządzanie treningami (CRUD):**
    - Dodawanie nowego treningu poprzez upload pliku GPX.
    - Wyświetlanie listy treningów z paginacją i filtrowaniem.
    - Edycja metadanych treningu (np. nazwa, opis).
    - Usuwanie treningu.
- **Wizualizacja danych:**
    - Wyświetlanie pojedynczej trasy treningu na mapie.
    - Generowanie i wyświetlanie mapy ciepła (heatmap) dla wszystkich treningów.
    - Wyświetlanie statystyk dla wybranego treningu.
- **API Endpoints:** Walidacja danych wejściowych, autoryzacja i poprawność odpowiedzi dla wszystkich punktów końcowych.
- **Middleware:** Weryfikacja logiki ochrony tras i modyfikacji żądań/odpowiedzi.

### Funkcjonalności wyłączone z testów:

- Testy integracji z zewnętrznymi dostawcami usług (poza Supabase), jeśli takowe nie istnieją.
- Testy generowane automatycznie przez frameworki (np. wewnętrzne mechanizmy Astro).

## 3. Typy Testów

1.  **Testy Jednostkowe (Unit Tests):**
    - **Cel:** Weryfikacja poprawności działania pojedynczych funkcji, komponentów i usług w izolacji.
    - **Zakres:** Funkcje pomocnicze (`src/lib/utils.ts`), serwisy (`src/lib/services/*`), schematy walidacji Zod (`src/lib/auth/schemas.ts`), customowe hooki React (`src/components/hooks/*`).

2.  **Testy Integracyjne (Integration Tests):**
    - **Cel:** Sprawdzenie poprawności współpracy pomiędzy różnymi modułami aplikacji.
    - **Zakres:**
        - Integracja komponentów React z API (np. formularz logowania -> API logowania).
        - Integracja API z bazą danych (np. endpoint tworzenia treningu -> zapis w tabeli `workouts`).
        - Działanie middleware w kontekście żądań do chronionych endpointów.

3.  **Testy End-to-End (E2E):**
    - **Cel:** Symulacja rzeczywistych scenariuszy użytkowania aplikacji z perspektywy użytkownika końcowego.
    - **Zakres:** Pełne ścieżki użytkownika, np. rejestracja -> logowanie -> dodanie treningu -> wylogowanie.

4.  **Testy Bezpieczeństwa (Security Tests):**
    - **Cel:** Identyfikacja i zabezpieczenie przed popularnymi wektorami ataków.
    - **Zakres:** Testy penetracyjne pod kątem SQL Injection, XSS, CSRF, a przede wszystkim weryfikacja reguł Row Level Security (RLS) w Supabase, aby upewnić się, że użytkownik ma dostęp wyłącznie do swoich danych.

5.  **Testy Wydajnościowe (Performance Tests):**
    - **Cel:** Ocena szybkości działania i responsywności aplikacji pod obciążeniem.
    - **Zakres:**
        - Czas ładowania strony głównej i panelu dashboard.
        - Czas przetwarzania i importu dużych plików GPX.
        - Czas generowania mapy ciepła przy dużej liczbie punktów danych.

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

| Funkcjonalność | Scenariusz | Oczekiwany Rezultat | Priorytet |
| :--- | :--- | :--- | :--- |
| **Rejestracja** | Użytkownik podaje poprawne i unikalne dane. | Konto zostaje utworzone, użytkownik jest zalogowany i przekierowany do panelu. | Wysoki |
| | Użytkownik podaje zajęty adres e-mail. | Wyświetlany jest komunikat o błędzie. | Wysoki |
| **Logowanie** | Użytkownik podaje poprawne dane. | Użytkownik jest zalogowany i przekierowany do panelu. | Wysoki |
| | Użytkownik podaje błędne hasło. | Wyświetlany jest komunikat o błędzie. | Wysoki |
| **Dodawanie treningu**| Zalogowany użytkownik wysyła poprawny plik GPX. | Plik jest przetwarzany, trening zostaje zapisany w bazie i pojawia się na liście. | Wysoki |
| | Użytkownik wysyła plik w innym formacie niż GPX. | Wyświetlany jest błąd walidacji formatu pliku. | Średni |
| **Wyświetlanie listy**| Zalogowany użytkownik przechodzi do panelu. | Wyświetlana jest lista jego treningów z poprawną paginacją. | Wysoki |
| **Dostęp do danych**| Użytkownik A próbuje uzyskać dostęp do treningu użytkownika B przez API. | Odpowiedź API to błąd autoryzacji (np. 403 Forbidden lub 404 Not Found). | Krytyczny |
| **Mapa Ciepła** | Użytkownik z wieloma treningami otwiera widok mapy ciepła. | Mapa jest generowana i wyświetla punkty na podstawie wszystkich treningów użytkownika. | Wysoki |
| **Usuwanie treningu**| Użytkownik usuwa swój trening. | Trening znika z listy i nie jest uwzględniany na mapie ciepła. | Wysoki |

## 5. Środowisko Testowe

- **System Operacyjny:** Dowolny (Windows, macOS, Linux)
- **Przeglądarki:** Chrome (najnowsza wersja), Firefox (najnowsza wersja), Safari (najnowsza wersja).
- **Baza Danych:** Dedykowana instancja deweloperska/testowa Supabase, odizolowana od danych produkcyjnych.
- **Środowisko uruchomieniowe:** Lokalna maszyna deweloperska lub dedykowany serwer CI/CD.

## 6. Narzędzia do Testowania

- **Testy Jednostkowe i Integracyjne:** Vitest (zgodnie z ekosystemem Vite używanym przez Astro).
- **Testy E2E:** Playwright lub Cypress.
- **Asercje:** Biblioteka asercji wbudowana w Vitest/Playwright.
- **Testy Wydajnościowe:** Narzędzia deweloperskie przeglądarki (Lighthouse), `k6` lub `JMeter` do testów obciążeniowych API.
- **Testy Bezpieczeństwa:** OWASP ZAP, `sqlmap` (do weryfikacji zabezpieczeń przed SQLi), manualna weryfikacja reguł RLS w panelu Supabase.
- **CI/CD:** GitHub Actions do automatycznego uruchamiania testów po każdym pushu do repozytorium.

## 7. Harmonogram Testów

Testowanie powinno być procesem ciągłym, zintegrowanym z cyklem rozwoju oprogramowania.

- **Testy jednostkowe:** Pisane na bieżąco przez deweloperów wraz z nowymi funkcjonalnościami.
- **Testy integracyjne:** Pisane po zaimplementowaniu większych modułów.
- **Testy E2E i regresji:** Uruchamiane automatycznie w ramach CI/CD przed każdym mergem do głównego brancha.
- **Testy bezpieczeństwa i wydajności:** Przeprowadzane cyklicznie, co najmniej raz na kwartał oraz przed każdym większym wydaniem.

## 8. Kryteria Akceptacji Testów

- **Kryterium wejścia:** Nowa funkcjonalność została zaimplementowana i pomyślnie przeszła testy jednostkowe na środowisku deweloperskim.
- **Kryterium wyjścia:**
    - 100% testów jednostkowych i integracyjnych dla nowej funkcjonalności kończy się sukcesem.
    - Wszystkie krytyczne i wysokopriorytetowe scenariusze E2E kończą się sukcesem.
    - Nie istnieją żadne znane, niezaakceptowane błędy o priorytecie krytycznym lub wysokim.
    - Code coverage na poziomie co najmniej 80% dla nowo dodanego kodu.

## 9. Role i Odpowiedzialności

- **Deweloperzy:**
    - Pisanie testów jednostkowych i integracyjnych dla tworzonego kodu.
    - Naprawianie błędów znalezionych na wszystkich etapach testowania.
- **Inżynier QA / Tester:**
    - Projektowanie i implementacja scenariuszy testowych E2E.
    - Przeprowadzanie testów manualnych (eksploracyjnych).
    - Konfiguracja i utrzymanie testów wydajnościowych i bezpieczeństwa.
    - Zarządzanie procesem raportowania błędów.
- **Product Owner / Manager Projektu:**
    - Definiowanie priorytetów dla testowanych funkcjonalności.
    - Akceptacja wyników testów i podejmowanie decyzji o wdrożeniu.

## 10. Procedury Raportowania Błędów

Wszystkie znalezione błędy powinny być raportowane w systemie do śledzenia zadań (np. GitHub Issues). Każdy raport powinien zawierać:

- **Tytuł:** Zwięzły opis problemu.
- **Opis:** Szczegółowe kroki do reprodukcji błędu.
- **Oczekiwany rezultat:** Jak system powinien się zachować.
- **Aktualny rezultat:** Co faktycznie się stało.
- **Środowisko:** Wersja przeglądarki, system operacyjny.
- **Priorytet:** Krytyczny, Wysoki, Średni, Niski.
- **Załączniki:** Zrzuty ekranu, nagrania wideo, logi z konsoli.
