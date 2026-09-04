import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import App from "./App";

describe("RetroVault UI", () => {
  test("renders the login heading", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });

  test("renders the login button", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  test("renders a link to the register page", () => {
    render(<App />);

    const registerLink = screen.getByRole("link", { name: /register/i });

    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute("href", "/register");
  });

  test("redirects an unknown route to the login page", () => {
    window.history.pushState({}, "", "/nonexistent");
    render(<App />);
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });
});
