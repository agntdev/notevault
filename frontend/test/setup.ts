import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Tear down the rendered DOM between tests so component state doesn't leak.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
