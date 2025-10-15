# Dokument wymagań produktu (PRD) - AImondo

## 1. Przegląd produktu

AImondo to aplikacja internetowa zaprojektowana dla entuzjastów aktywności na świeżym powietrzu, którzy chcą wizualizować swoje treningi zarejestrowane w formacie GPX. Główne funkcje aplikacji to importowanie plików GPX, zarządzanie listą treningów oraz wyświetlanie tras na interaktywnej mapie. Kluczowym elementem jest możliwość wizualizacji wszystkich treningów w formie globalnej heatmapy, co pozwala użytkownikom na łatwe zidentyfikowanie najczęściej uczęszczanych ścieżek oraz odkrywanie nowych, nieodwiedzonych dotąd miejsc. Aplikacja będzie korzystać z prostego systemu uwierzytelniania, aby zapewnić prywatność danych każdego użytkownika.

## 2. Problem użytkownika

Użytkownicy, którzy regularnie uprawiają sport (np. bieganie, jazda na rowerze) i rejestrują swoje trasy za pomocą urządzeń GPS, często gromadzą dużą liczbę plików GPX. Brakuje im prostego narzędzia, które pozwoliłoby na zagregowanie wszystkich tych danych w jednym miejscu i zwizualizowanie ich w sposób zbiorczy. Chcieliby móc na jednej mapie zobaczyć, gdzie już byli, a które obszary pozostają nieodkryte, bez konieczności analizowania każdego treningu osobno. Obecne rozwiązania często koncentrują się na analizie pojedynczych aktywności, a nie na ich syntetycznym, geograficznym podsumowaniu.

## 3. Wymagania funkcjonalne

### 3.1. Uwierzytelnianie i zarządzanie użytkownikami

- Użytkownicy muszą mieć możliwość założenia konta i logowania się.
- System uwierzytelniania będzie oparty o usługę Supabase Auth.
- Każdy użytkownik ma dostęp wyłącznie do swoich danych.

### 3.2. Zarządzanie treningami

- Wgrywanie treningów: Użytkownik może wgrać plik w formacie GPX za pomocą formularza w oknie modalnym, podając jednocześnie jego nazwę.
- Przetwarzanie danych: Po wgraniu pliku system parsuje wszystkie ścieżki (`<trk>`) i segmenty (`<trkseg>`), łącząc je w jeden trening. Zapisywane są współrzędne, timestampy i wysokość dla każdego punktu. Dodatkowo dodawany jest numer sekwencyjny, oraz opcjonalnie obliczany jest geohash dla współrzędnych (jeśli okaże się przydatny do optymalnego generowania heatmapy).
- Obliczanie statystyk: Podczas importu jednorazowo obliczane i zapisywane w bazie danych są dystans i czas trwania treningu.
- Edycja treningu: Użytkownik może zmienić nazwę, datę i typ treningu w dedykowanym oknie modalnym.
- Usuwanie treningu: Użytkownik może trwale usunąć trening. Operacja ta wymaga dodatkowego potwierdzenia.

### 3.3. Widok listy treningów

- Domyślnym widokiem po zalogowaniu jest tabela z listą treningów.
- Tabela zawiera kolumny: Nazwa, Data, Typ, Dystans, Czas trwania.
- Lista jest paginowana w celu obsługi dużej liczby wpisów.
- Użytkownik ma możliwość filtrowania listy po zakresie dat, fragmencie nazwy oraz typie treningu (pole tekstowe).
- Lista jest sortowana domyślnie po dacie (od najnowszych).

### 3.4. Wizualizacja na mapie

- Dostawca map: Mapy będą dostarczane przez openfreemap.org ze stylem "bright".
- Technologia: Zostanie wykorzystana biblioteka Maplibre GL JS.
- Widok pojedynczego treningu: Po kliknięciu w trening na liście, użytkownik jest przenoszony do widoku mapy, na której narysowana jest linia trasy. Pod mapą wyświetlane są statystyki (dystans, czas trwania).
- Widok heatmapy: Dostępny jest globalny widok heatmapy, aktywowany osobnym przyciskiem. Heatmapa jest generowana na podstawie punktów ze wszystkich treningów pasujących do aktywnych filtrów.
- Optymalizacja heatmapy: W celu zapewnienia wydajności, heatmapa jest generowana na podstawie maksymalnie 10 000 losowo wybranych punktów z aktualnego widoku mapy. Użytkownik może manualnie odświeżyć dane dla nowego obszaru mapy za pomocą przycisku.

### 3.5. Interfejs i doświadczenie użytkownika (UX)

- Stany ładowania: Aplikacja wyświetla wskaźnik ładowania (spinner) podczas wczytywania danych na mapę lub listę.
- Pusty stan: Gdy lista treningów jest pusta, wyświetlany jest komunikat powitalny zachęcający do dodania pierwszej aktywności.
- Walidacja formularzy: System waliduje wgrywane pliki po stronie backendu, informując o błędach (np. zbyt duży rozmiar pliku, plik uszkodzony lub bez współrzędnych).
- Utrwalanie stanu UI: Aplikacja zapamiętuje ostatnią pozycję i poziom przybliżenia mapy w `localStorage`, aby zapewnić spójność nawigacji.

## 4. Granice produktu

### Co wchodzi w skład MVP:

- Pełna funkcjonalność opisana w wymaganiach funkcjonalnych, w tym uwierzytelnianie, CRUD na treningach oraz wizualizacja na mapie (linia i heatmapa).

### Co nie wchodzi w skład MVP:

- Współdzielenie danych i tras między użytkownikami.
- Integracje z zewnętrznymi serwisami sportowymi (np. Strava, Garmin Connect).
- Płatne subskrypcje i zaawansowane plany dla użytkowników.
- Wyliczanie i wyświetlanie miniatury trasy (short polyline).

### Uproszczenia i znane ograniczenia:

- Typ treningu jest polem tekstowym, co może prowadzić do niespójności danych przy filtrowaniu. W przyszłości może zostać zastąpione predefiniowaną listą.
- Próbkowanie danych dla heatmapy jest losowe, co może powodować wizualne przerwy w trasach. W przyszłości można zbadać algorytmy agregacji.

## 5. Historyjki użytkowników

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji, aby bezpiecznie przechowywać i zarządzać moimi danymi treningowymi.
- Kryteria akceptacji:
  - Mogę przejść do formularza rejestracji.
  - Formularz wymaga podania adresu e-mail i hasła.
  - System waliduje poprawność formatu e-maila i wymagania dotyczące hasła.
  - Po pomyślnej rejestracji jestem automatycznie zalogowany i widzę pusty ekran główny.

- ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto, aby uzyskać dostęp do moich treningów.
- Kryteria akceptacji:
  - Mogę przejść do formularza logowania.
  - Formularz wymaga podania e-maila i hasła.
  - W przypadku podania błędnych danych, widzę stosowny komunikat.
  - Po pomyślnym zalogowaniu jestem przekierowany do widoku listy moich treningów.

- ID: US-003
- Tytuł: Wgrywanie nowego treningu
- Opis: Jako zalogowany użytkownik, chcę wgrać plik GPX z mojego ostatniego treningu, nadać mu nazwę i zapisać go w systemie.
- Kryteria akceptacji:
  - Na stronie głównej widzę przycisk "Dodaj trening".
  - Po kliknięciu przycisku otwiera się okno modalne z formularzem.
  - Formularz pozwala mi wybrać plik GPX z dysku i wpisać nazwę treningu.
  - Nazwa musi mieć od 3 do 300 znaków.
  - Plik GPX nie może przekraczać 5 MB.
  - Po zatwierdzeniu formularza, plik jest przesyłany i przetwarzany.
  - Nowy trening pojawia się na górze listy treningów.
  - W przypadku błędu (np. zły format pliku, za duży rozmiar), widzę czytelny komunikat o błędzie.

- ID: US-004
- Tytuł: Przeglądanie listy treningów
- Opis: Jako zalogowany użytkownik, chcę zobaczyć listę wszystkich moich treningów, aby mieć przegląd mojej aktywności.
- Kryteria akceptacji:
  - Po zalogowaniu domyślnie widzę tabelę z treningami.
  - Tabela zawiera kolumny: Nazwa, Data, Typ, Dystans, Czas trwania.
  - Treningi są posortowane od najnowszego do najstarszego.
  - Jeśli lista jest dłuższa niż jedna strona, widzę kontrolki paginacji.
  - Jeśli nie mam żadnych treningów, widzę komunikat powitalny.

- ID: US-005
- Tytuł: Filtrowanie listy treningów
- Opis: Jako zalogowany użytkownik, chcę móc filtrować listę treningów, aby szybko znaleźć interesujące mnie aktywności.
- Kryteria akceptacji:
  - Nad listą treningów znajdują się pola filtrów: zakres dat, nazwa, typ.
  - Mogę wpisać fragment nazwy, aby wyszukać treningi.
  - Mogę wybrać zakres dat (od-do), aby zawęzić listę.
  - Mogę wpisać typ treningu (np. "bieganie"), aby odfiltrować inne.
  - Filtry można łączyć.
  - Lista aktualizuje się automatycznie po zmianie filtrów.

- ID: US-006
- Tytuł: Przeglądanie pojedynczego treningu
- Opis: Jako zalogowany użytkownik, chcę kliknąć na wybrany trening z listy, aby zobaczyć jego trasę na mapie i sprawdzić jego szczegółowe statystyki.
- Kryteria akceptacji:
  - Kliknięcie wiersza w tabeli przenosi mnie do widoku mapy.
  - Na mapie widzę narysowaną trasę treningu.
  - Mapa jest wycentrowana i przybliżona tak, aby cała trasa była widoczna.
  - Pod mapą widzę statystyki: dystans i czas trwania.

- ID: US-007
- Tytuł: Edycja danych treningu
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość poprawienia nazwy, daty lub typu treningu, jeśli popełniłem błąd podczas jego dodawania.
- Kryteria akceptacji:
  - Na liście treningów przy każdym wpisie znajduje się opcja "Edytuj".
  - Po jej kliknięciu otwiera się okno modalne z formularzem edycji.
  - Formularz jest wypełniony aktualnymi danymi treningu (nazwa, data, typ).
  - Mogę zmodyfikować dane i zapisać zmiany.
  - Formularz waliduje dane (np. nazwa 3-300 znaków, typ 3-50 znaków).
  - Po zapisaniu zmian, zaktualizowane dane są widoczne na liście.

- ID: US-008
- Tytuł: Usuwanie treningu
- Opis: Jako zalogowany użytkownik, chcę móc usunąć błędnie wgrany lub niechciany trening.
- Kryteria akceptacji:
  - Na liście treningów przy każdym wpisie znajduje się opcja "Usuń".
  - Po jej kliknięciu widzę okno modalne z prośbą o potwierdzenie operacji.
  - Po potwierdzeniu, trening jest trwale usuwany z bazy danych i znika z listy.
  - Jeśli anuluję operację, nic się nie dzieje.

- ID: US-009
- Tytuł: Wizualizacja globalnej heatmapy
- Opis: Jako zalogowany użytkownik, chcę zobaczyć heatmapę wszystkich moich aktywności, aby zidentyfikować najczęściej uczęszczane ścieżki.
- Kryteria akceptacji:
  - Na stronie głównej znajduje się przycisk "Pokaż heatmapę".
  - Po jego kliknięciu widok przełącza się na mapę z heatmapą.
  - Heatmapa jest generowana na podstawie maksymalnie 10 000 losowo wybranych punktów ze wszystkich moich treningów (z uwzględnieniem filtrów).
  - Intensywność koloru na heatmapie odpowiada zagęszczeniu punktów.

- ID: US-010
- Tytuł: Odświeżanie danych na heatmapie
- Opis: Jako zalogowany użytkownik, podczas eksploracji heatmapy chcę móc odświeżyć dane dla nowego obszaru mapy, aby zapewnić ich dokładność.
- Kryteria akceptacji:
  - Gdy przesuwam lub przybliżam/oddalam mapę, dane heatmapy nie odświeżają się automatycznie.
  - Na mapie widoczny jest przycisk "Odśwież dane dla tego widoku".
  - Po kliknięciu przycisku, system pobiera nowe 10 000 punktów pasujących do bieżącego widoku mapy i aktualizuje heatmapę.
  - Podczas ładowania danych widoczny jest wskaźnik ładowania.

- ID: US-011
- Tytuł: Utrwalenie widoku mapy
- Opis: Jako użytkownik, chcę, aby aplikacja pamiętała ostatnią pozycję i zoom mapy, abym nie tracił kontekstu po odświeżeniu strony lub powrocie do widoku mapy.
- Kryteria akceptacji:
  - Po zmianie centrum lub poziomu przybliżenia mapy, te dane są zapisywane w `localStorage` przeglądarki.
  - Gdy ponownie otwieram widok mapy (zarówno pojedynczego treningu, jak i heatmapy), jest ona inicjalizowana z zapisaną pozycją i zoomem.
  - Dane zapisane w `localStorage` są dla wszystkich użytkowników przeglądarki, tj. nie są skojarzone z kontem w aplikacji.

- ID: US-012
- Tytuł: Reset hasła użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zresetować hasło do mojego konta, aby uzyskać dostęp do moich treningów.
- Kryteria akceptacji:
  - Mogę przejść do formularza resetu hasła.
  - Formularz wymaga podania e-maila.
  - Aplikacja wysyła link do resetu hasła na podany adres email, jeśli takie konto istnieje.
  - Aplikacja nie informuje, czy e-mail istnieje w systemie, aby chronić prywatność użytkowników.
  - Po pomyślnym resecie hasła jestem przekierowany do widoku listy moich treningów.

## 6. Metryki sukcesu

Projekt ma charakter osobistego "side-projectu". W związku z tym nie zdefiniowano formalnych wskaźników sukcesu (KPI), takich jak liczba użytkowników czy dzienna aktywność. Głównym i jedynym kryterium powodzenia projektu jest subiektywna satysfakcja autora z działania, użyteczności i estetyki finalnego narzędzia oraz realizacja założonych celów funkcjonalnych.
