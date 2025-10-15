import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import StatsOverlay from "./StatsOverlay";
import * as utils from "@/lib/utils";

// Mockowanie modułu utils, aby odizolować komponent od implementacji formaterów
vi.mock("@/lib/utils", async (importOriginal) => {
  const original = await importOriginal<typeof utils>();
  return {
    ...original,
    formatDistance: vi.fn(),
    formatDuration: vi.fn(),
  };
});

// Typowanie zamockowanych funkcji
const mockedFormatDistance = vi.mocked(utils.formatDistance);
const mockedFormatDuration = vi.mocked(utils.formatDuration);

describe("StatsOverlay", () => {
  it("should render distance and duration correctly with valid inputs", () => {
    // Arrange
    const distance = 12345; // metry
    const duration = 5432; // sekundy
    mockedFormatDistance.mockReturnValue("12.35 km");
    mockedFormatDuration.mockReturnValue("01:30:32");

    // Act
    render(<StatsOverlay distance={distance} duration={duration} />);

    // Assert
    // Sprawdzenie, czy etykiety są renderowane
    expect(screen.getByText("Distance")).toBeInTheDocument();
    expect(screen.getByText("Duration")).toBeInTheDocument();

    // Sprawdzenie, czy funkcje formatujące zostały wywołane z prawidłowymi danymi
    expect(mockedFormatDistance).toHaveBeenCalledWith(distance);
    expect(mockedFormatDuration).toHaveBeenCalledWith(duration);

    // Sprawdzenie, czy sformatowane wartości są wyświetlane
    expect(screen.getByText("12.35 km")).toBeInTheDocument();
    expect(screen.getByText("01:30:32")).toBeInTheDocument();
  });

  it("should handle null duration gracefully (edge case)", () => {
    // Arrange
    const distance = 5000;
    mockedFormatDistance.mockReturnValue("5.00 km");
    mockedFormatDuration.mockReturnValue("N/A"); // Co powinna zwrócić funkcja dla null

    // Act
    render(<StatsOverlay distance={distance} duration={null} />);

    // Assert
    // Sprawdzenie, czy funkcja została wywołana z null
    expect(mockedFormatDuration).toHaveBeenCalledWith(null);

    // Sprawdzenie, czy wyświetlana jest wartość zastępcza
    expect(screen.getByText("N/A")).toBeInTheDocument();
    expect(screen.getByText("5.00 km")).toBeInTheDocument();
  });
});
