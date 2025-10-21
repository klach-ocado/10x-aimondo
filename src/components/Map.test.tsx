import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Map from "./Map";

vi.mock("./hooks/useMap", () => ({
  useMap: vi.fn(),
}));

describe("Map component", () => {
  it("should render the map container", () => {
    render(<Map displayMode="track" trackPoints={[]} />);

    const mapElement = screen.getByTestId("main-map");
    expect(mapElement).toBeInTheDocument();
  });
});
