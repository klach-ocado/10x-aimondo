# Architektura UI dla AImondo

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji AImondo zostanie zrealizowana w modelu wielostronicowym (MPA), wykorzystując Astro do renderowania stron i routingu oraz React do budowy komponentów interaktywnych. Takie podejście zapewnia optymalną wydajność ładowania stron statycznych, jednocześnie umożliwiając dynamiczne zarządzanie danymi tam, gdzie jest to konieczne.

Struktura opiera się na trzech głównych, oddzielnych widokach:

1.  **Dashboard (`/dashboard`)**: Centralny punkt aplikacji, służący do zarządzania i przeglądania treningów w formie tabelarycznej.
2.  **Widok pojedynczego treningu (`/workouts/{id}`)**: Strona dedykowana do analizy pojedynczej trasy na mapie.
3.  **Widok Heatmapy (`/heatmap`)**: Strona do wizualizacji zagregowanych danych geograficznych ze wszystkich treningów.

Nawigacja między tymi widokami odbywa się za pomocą globalnego paska nawigacyjnego. Stan aplikacji, taki jak filtry, będzie zarządzany na poziomie komponentów i synchronizowany z parametrami URL, co umożliwi współdzielenie kontekstu między widokami i jego zachowanie po odświeżeniu strony. Doświadczenie użytkownika (UX) jest priorytetyzowane poprzez zastosowanie stanów ładowania (szkielety interfejsu), pustych stanów oraz jasnych mechanizmów potwierdzania akcji destrukcyjnych.

## 2. Lista widoków

### Widok 1: Dashboard (Lista treningów)

-   **Nazwa widoku**: Dashboard
-   **Ścieżka widoku**: `/dashboard` (główna strona aplikacji)
-   **Główny cel**: Umożliwienie użytkownikowi przeglądania, filtrowania, sortowania i zarządzania wszystkimi swoimi treningami.
-   **Kluczowe informacje do wyświetlenia**:
    -   Tabela z listą treningów (kolumny: Nazwa, Data, Typ, Dystans, Czas trwania).
    -   Kontrolki do filtrowania (zakres dat, nazwa, typ).
    -   Paginacja dla tabeli.
    -   Komunikat powitalny w przypadku braku treningów.
-   **Kluczowe komponenty widoku**:
    -   `Header`: Globalny pasek nawigacyjny.
    -   `FiltersPanel`: Panel z polami filtrów.
    -   `WorkoutsDataTable`: Interaktywna tabela danych z React, obsługująca sortowanie, paginację i akcje na wierszach.
    -   `DataTableSkeleton`: Szkielet interfejsu wyświetlany podczas ładowania danych.
    -   `Welcome`: Komponent dla pustego stanu.
    -   `AddWorkoutDialog`: Okno modalne z formularzem dodawania treningu.
    -   `EditWorkoutDialog`: Okno modalne z formularzem edycji treningu.
    -   `DeleteConfirmationDialog`: Okno dialogowe `AlertDialog` do potwierdzania usunięcia.
-   **UX, dostępność i względy bezpieczeństwa**:
    -   **UX**: Automatyczna aktualizacja listy po zmianie filtrów (z `debounce`). Kliknięcie całego wiersza przenosi do widoku treningu. Wskaźniki sortowania w nagłówkach kolumn. Czytelne formatowanie dystansu (km) i czasu (HH:MM:SS).
    -   **Dostępność**: Wykorzystanie komponentów `shadcn/ui` zapewni zgodność z WAI-ARIA (np. dla okien modalnych, przycisków, pól formularzy). Tabela będzie odpowiednio oznaczona dla czytników ekranu.
    -   **Bezpieczeństwo**: Uwierzytelnianie i autoryzacja są pominięte w MVP. Wszystkie operacje (CRUD) będą wykonywane w kontekście jednego użytkownika.

### Widok 2: Widok pojedynczego treningu

-   **Nazwa widoku**: Widok pojedynczego treningu
-   **Ścieżka widoku**: `/workouts/[id]`
-   **Główny cel**: Szczegółowa wizualizacja trasy pojedynczego treningu na mapie oraz jego kluczowych statystyk.
-   **Kluczowe informacje do wyświetlenia**:
    -   Mapa wycentrowana na trasie treningu.
    -   Narysowana linia trasy.
    -   Nakładka ze statystykami (dystans, czas trwania).
-   **Kluczowe komponenty widoku**:
    -   `Header`: Globalny pasek nawigacyjny.
    -   `Map`: Komponent mapy (Maplibre GL JS) wyświetlający trasę.
    -   `StatsOverlay`: Nakładka z danymi statystycznymi.
    -   `BackButton`: Przycisk umożliwiający powrót do listy treningów (`/dashboard`).
-   **UX, dostępność i względy bezpieczeństwa**:
    -   **UX**: Mapa jest automatycznie przybliżana, aby cała trasa była widoczna. Stan mapy (centrum, zoom) jest zapisywany w `localStorage` i odtwarzany przy ponownym wejściu. Wskaźnik ładowania podczas wczytywania danych trasy.
    -   **Dostępność**: Przycisk powrotu będzie odpowiednio oznaczony. Mapa będzie posiadać tekst alternatywny.
    -   **Bezpieczeństwo**: Dostęp do widoku jest publiczny w ramach MVP; w przyszłości będzie chroniony autoryzacją, aby tylko właściciel treningu mógł go zobaczyć.

### Widok 3: Widok Heatmapy

-   **Nazwa widoku**: Widok Heatmapy
-   **Ścieżka widoku**: `/heatmap`
-   **Główny cel**: Agregacja i wizualizacja wszystkich tras użytkownika w formie heatmapy w celu identyfikacji najczęściej uczęszczanych obszarów.
-   **Kluczowe informacje do wyświetlenia**:
    -   Mapa z nałożoną warstwą heatmapy.
    -   Panel z filtrami (taki sam jak na dashboardzie).
-   **Kluczowe komponenty widoku**:
    -   `Header`: Globalny pasek nawigacyjny.
    -   `Map`: Komponent mapy (Maplibre GL JS) wyświetlający warstwę heatmapy.
    -   `HeatmapFilterPanel`: Zwijany panel z filtrami.
    -   `RefreshButton`: Przycisk do manualnego odświeżenia danych dla bieżącego widoku mapy.
    -   `BackButton`: Przycisk umożliwiający powrót do listy treningów (`/dashboard`).
-   **UX, dostępność i względy bezpieczeństwa**:
    -   **UX**: Użytkownik może trafić tu z dashboardu (z zachowaniem filtrów) lub z menu (z czystymi filtrami). Dane nie odświeżają się automatycznie przy przesuwaniu mapy, co zapobiega nadmiernym zapytaniom do API. Przycisk odświeżania daje użytkownikowi pełną kontrolę.
    -   **Dostępność**: Panel filtrów będzie zwijany i dostępny z klawiatury. Przyciski będą odpowiednio oznaczone.
    -   **Bezpieczeństwo**: Dane do heatmapy są pobierane z API, które zapewnia, że pochodzą one wyłącznie od zalogowanego użytkownika.

## 3. Mapa podróży użytkownika

**Główny przepływ: Dodanie i przeglądanie nowego treningu**

1.  **Start**: Użytkownik ląduje na stronie `/dashboard`. Aplikacja wysyła zapytanie `GET /api/workouts` i wyświetla listę istniejących treningów.
2.  **Inicjacja akcji**: Użytkownik klika przycisk "Dodaj trening" w globalnej nawigacji.
3.  **Interakcja z formularzem**: Otwiera się okno modalne (`AddWorkoutDialog`). Użytkownik wpisuje nazwę treningu i wybiera plik GPX.
4.  **Wysyłanie danych**: Po kliknięciu "Zapisz", aplikacja wysyła zapytanie `POST /api/workouts` z danymi formularza. Wyświetlany jest stan ładowania.
5.  **Aktualizacja UI**: Po pomyślnym przetworzeniu, modal zamyka się, a tabela na `/dashboard` automatycznie odświeża swoje dane, pokazując nowy trening na górze listy.
6.  **Nawigacja do szczegółów**: Użytkownik klika wiersz nowo dodanego treningu w tabeli.
7.  **Widok szczegółowy**: Aplikacja przechodzi na stronę `/workouts/[id]`. Wysyłane jest zapytanie `GET /api/workouts/[id]`, a po otrzymaniu danych na mapie rysowana jest trasa treningu.

**Przepływ alternatywny: Analiza danych za pomocą heatmapy**

1.  **Filtrowanie na dashboardzie**: Użytkownik na stronie `/dashboard` ustawia filtry, np. zawężając listę do treningów rowerowych z ostatniego miesiąca.
2.  **Przejście do heatmapy**: Użytkownik klika przycisk "Pokaż heatmapę" znajdujący się przy panelu filtrów.
3.  **Widok heatmapy z kontekstem**: Aplikacja przechodzi na stronę `/heatmap`, przekazując aktywne filtry w parametrach URL. Aplikacja wysyła zapytanie `GET /api/heatmap` z tymi filtrami, a mapa wyświetla heatmapę tylko dla odfiltrowanych treningów.

## 4. Układ i struktura nawigacji

Nawigacja w aplikacji jest prosta i scentralizowana, oparta na globalnym pasku nawigacyjnym (`Header`), który jest obecny we wszystkich głównych widokach.

-   **Główny pasek nawigacyjny**:
    -   **Linki**: Zawiera bezpośrednie linki do kluczowych widoków:
        -   `Dashboard` (prowadzi do `/dashboard`)
        -   `Heatmapa` (prowadzi do `/heatmap`)
    -   **Globalne akcje**: Umieszczony jest tu przycisk "Dodaj trening", który jest dostępny z każdego miejsca w aplikacji i otwiera modal dodawania.

-   **Nawigacja kontekstowa**:
    -   **Z tabeli do szczegółów**: Kliknięcie wiersza w tabeli na `/dashboard` jest podstawowym sposobem nawigacji do widoku pojedynczego treningu (`/workouts/[id]`).
    -   **Przyciski powrotu**: Widoki szczegółowe (`/workouts/[id]` i `/heatmap`) zawierają przycisk "Wróć do listy", który prowadzi użytkownika z powrotem do `/dashboard`, zamykając cykl nawigacji.

## 5. Kluczowe komponenty

-   **`Header`**: Globalny, współdzielony komponent nawigacyjny zawierający linki do głównych widoków i przycisk akcji "Dodaj trening".
-   **`Map` (React)**: Wysoce reużywalny komponent oparty na Maplibre GL JS, zdolny do wyświetlania zarówno pojedynczej trasy (jako linia), jak i zagregowanych danych (jako heatmapa). Odpowiada za zapisywanie stanu widoku w `localStorage`.
-   **`WorkoutsDataTable` (React)**: Sercem dashboardu jest interaktywna tabela, która zarządza wyświetlaniem, sortowaniem i paginacją danych treningowych oraz zawiera menu kontekstowe dla akcji (edycja, usunięcie) na poszczególnych wierszach.
-   **`FiltersPanel` (React)**: Komponent zawierający kontrolki do filtrowania (zakres dat, nazwa, typ), zarządzający stanem filtrów i inicjujący ponowne pobieranie danych.
-   **`AddWorkoutDialog` (React)**: Dedykowany komponent okna modalnego z formularzem do przesyłania nowego pliku GPX i nadawania mu nazwy.
-   **`EditWorkoutDialog` (React)**: Dedykowany komponent okna modalnego z formularzem do edycji metadanych istniejącego treningu (nazwa, data, typ).
-   **`DeleteConfirmationDialog` (React)**: Komponent typu `AlertDialog` (z `shadcn/ui`), zapewniający, że użytkownik świadomie potwierdza nieodwracalną operację usunięcia treningu.
