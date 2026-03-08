import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRouter, createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

describe("App", () => {
  it("ルートでわんログのホームを表示する", async () => {
    const history = createMemoryHistory({ initialEntries: ["/"] });
    const router = createRouter({ routeTree, history });

    render(<RouterProvider router={router} />);

    const heading = await screen.findByRole("heading", { name: /わんログ/ });
    expect(heading).toBeDefined();
    expect(screen.getByText(/ホーム/)).toBeDefined();
  });
});
