import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders Vite + React heading", () => {
    render(<App />);
    const heading = screen.getByRole("heading", { name: /vite \+ react/i });
    expect(heading).toBeDefined();
    expect(heading.textContent).toContain("Vite + React");
  });
});