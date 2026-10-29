// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Navbar } from "../Navbar";

const EXPECTED_ORDER = ["Product", "Rhythm system", "Screens", "Display modes", "Analysis", "Device", "Support", "Download"];

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
}

describe("Navbar", () => {
  afterEach(() => {
    cleanup();
  });

  it("has a Download link to /downloads right after Support", () => {
    renderNavbar();
    const links = within(screen.getByRole("navigation", { name: "Sections" })).getAllByRole("link");

    expect(links.map((link) => link.textContent)).toEqual(EXPECTED_ORDER);
    expect(links[7].getAttribute("href")).toBe("/downloads");
  });

  it("styles Download exactly like the other items and keeps hash links unchanged", () => {
    renderNavbar();
    const links = within(screen.getByRole("navigation", { name: "Sections" })).getAllByRole("link");
    const support = links[6];
    const download = links[7];

    expect(download.className).toBe(support.className);
    expect(support.getAttribute("href")).toBe("#support");
    expect(links[0].getAttribute("href")).toBe("#overview");
  });

  it("shows Download after Support in the mobile menu", () => {
    renderNavbar();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const header = screen.getByRole("banner");
    const mobileLinks = Array.from(header.querySelectorAll("div.md\\:hidden a"));
    const labels = mobileLinks.map((link) => link.textContent);

    expect(labels).toEqual([...EXPECTED_ORDER, "Log in"]);
    expect(mobileLinks[7].getAttribute("href")).toBe("/downloads");
  });
});
