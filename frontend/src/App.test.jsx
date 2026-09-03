import { render, screen } from "@testing-library/react";
import App from "./App";
import {describe, test, expect} from "vitest"
import "@testing-library/jest-dom/vitest";

describe("RetroVault UI", () => {
  test("renders login heading", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  test("renders login button", () => {
    render(<App />);
    expect(screen.getAllByRole("button", { name: /login/i }).length).toBeGreaterThanOrEqual(1);
  });

  test("renders register navigation button", () => {
    render(<App />);
    expect(screen.getAllByRole("button", { name: /register/i}).length).toBeGreaterThanOrEqual(1);
  });
});