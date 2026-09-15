import { performance as nodePerformance } from "node:perf_hooks";
import type { Frame, Page } from "@playwright/test";

export const ROUTE_DIAGNOSTIC_KIND = "route-commit diagnostic, not acceptance";

export function routeDiagnosticsEnabled(metadata: Record<string, unknown>, baseURL: string | undefined) {
  if (metadata.routeDiagnostics !== true) return false;
  if (metadata.kind !== ROUTE_DIAGNOSTIC_KIND) throw new Error("Route diagnostics require an explicitly labelled diagnostic configuration.");
  if (!baseURL) throw new Error("Route diagnostics require a local base URL.");
  const url = new URL(baseURL);
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error("Route diagnostics are restricted to the local diagnostic configuration.");
  }
  return true;
}

interface BrowserDiagnosticEvent {
  sequence: number;
  browserMs: number;
  epochMs: number;
  kind: string;
  [key: string]: unknown;
}

interface BrowserDiagnosticReport {
  events: BrowserDiagnosticEvent[];
  dropped: number;
  longTaskSupported: boolean;
  documentUrl: string;
  timeOrigin: number;
}

declare global {
  interface Window {
    __O_ROUTE_COMMIT_DIAGNOSTICS_V1__?: { collect(): BrowserDiagnosticReport };
  }
}

export async function installRouteCommitDiagnostics(page: Page) {
  await page.addInitScript(() => {
    if (Object.hasOwn(window, "__O_ROUTE_COMMIT_DIAGNOSTICS_V1__")) return;
    const events: BrowserDiagnosticEvent[] = [];
    const limit = 20_000;
    let dropped = 0;
    let sequence = 0;
    let lastState = "";
    let lastFrame: number | null = null;
    let timerDue = performance.now() + 50;
    let stopped = false;
    let frameId: number;
    let timerId: number;
    const record = (kind: string, details: Record<string, unknown> = {}) => {
      if (events.length === limit) {
        dropped++;
        return;
      }
      events.push({
        sequence: sequence++, browserMs: performance.now(),
        epochMs: performance.timeOrigin + performance.now(), kind, ...details,
      });
    };
    const describe = () => {
      const heading = document.querySelector("main h1");
      const link = [...document.querySelectorAll("main a")]
        .find((node) => node.textContent?.trim() === "Back to queue");
      return {
        url: location.href, h1: heading?.textContent?.trim() ?? null,
        backToQueuePresent: Boolean(link), scrollY, visibility: document.visibilityState,
      };
    };
    const observe = (phase: string) => {
      const state = describe();
      const signature = JSON.stringify(state);
      if (signature !== lastState) {
        lastState = signature;
        record("dom-observation", { phase, ...state });
      }
    };
    const mutations = new MutationObserver(() => observe("mutation"));
    mutations.observe(document, { subtree: true, childList: true, characterData: true });
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest("button, a, input[type=submit]") : null;
      if (target) record("click-capture", {
        text: target.textContent?.trim() ?? "", ariaLabel: target.getAttribute("aria-label"),
        href: target.getAttribute("href"), trusted: event.isTrusted, ...describe(),
      });
    };
    const visibility = () => record("visibility", { state: document.visibilityState });
    document.addEventListener("click", click, true);
    document.addEventListener("visibilitychange", visibility);
    let longTasks: PerformanceObserver | undefined;
    const longTaskSupported = typeof PerformanceObserver !== "undefined"
      && PerformanceObserver.supportedEntryTypes.includes("longtask");
    if (longTaskSupported) {
      longTasks = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) record("longtask", {
          startBrowserMs: entry.startTime,
          startEpochMs: performance.timeOrigin + entry.startTime,
          durationMs: entry.duration, name: entry.name,
        });
      });
      longTasks.observe({ type: "longtask", buffered: true });
    }
    const frame = (timestamp: number) => {
      if (stopped) return;
      if (lastFrame !== null && timestamp - lastFrame > 50) {
        record("raf-gap", { gapMs: timestamp - lastFrame, visibility: document.visibilityState });
      }
      lastFrame = timestamp;
      observe("raf");
      frameId = requestAnimationFrame(frame);
    };
    const tick = () => {
      if (stopped) return;
      const time = performance.now();
      if (time - timerDue > 25) {
        record("browser-timer-lag", { lagMs: time - timerDue, visibility: document.visibilityState });
      }
      timerDue = time + 50;
      timerId = window.setTimeout(tick, 50);
    };
    record("installed", { longTaskSupported, browserTimeOrigin: performance.timeOrigin });
    observe("installation");
    frameId = requestAnimationFrame(frame);
    timerId = window.setTimeout(tick, 50);
    Object.defineProperty(window, "__O_ROUTE_COMMIT_DIAGNOSTICS_V1__", {
      configurable: true,
      value: {
        collect(): BrowserDiagnosticReport {
          observe("collection");
          stopped = true;
          cancelAnimationFrame(frameId);
          window.clearTimeout(timerId);
          mutations.disconnect();
          longTasks?.disconnect();
          document.removeEventListener("click", click, true);
          document.removeEventListener("visibilitychange", visibility);
          return { events, dropped, longTaskSupported, documentUrl: location.href, timeOrigin: performance.timeOrigin };
        },
      },
    });
  });

  const events: { kind: string; clientMs: number; epochMs: number; [key: string]: unknown }[] = [];
  const limit = 20_000;
  let dropped = 0;
  const record = (kind: string, details: Record<string, unknown> = {}) => {
    if (events.length === limit) {
      dropped++;
      return;
    }
    events.push({
      kind, clientMs: nodePerformance.now(), epochMs: nodePerformance.timeOrigin + nodePerformance.now(),
      ...details,
    });
  };
  const navigation = (frame: Frame) => {
    if (frame === page.mainFrame()) record("main-frame-url", { url: frame.url() });
  };
  page.on("framenavigated", navigation);
  let due = nodePerformance.now() + 50;
  const timer = setInterval(() => {
    const time = nodePerformance.now();
    if (time - due > 25) record("client-timer-lag", { lagMs: time - due });
    due = time + 50;
  }, 50);
  timer.unref();
  record("installed");
  return {
    mark(label: string) { record("fixture-mark", { label }); },
    async collect() {
      clearInterval(timer);
      page.off("framenavigated", navigation);
      record("collection-start");
      const browser = await page.evaluate(() => {
        const diagnostics = window.__O_ROUTE_COMMIT_DIAGNOSTICS_V1__;
        if (!diagnostics) throw new Error("Route diagnostics missing from current document.");
        return diagnostics.collect();
      });
      record("collection-end");
      return {
        schema: 1, diagnosticOnly: true,
        interpretation: "Observations bound commit timing; rAF is not compositor paint. Added overhead is not subtracted and cannot change the original deadline verdict.",
        scope: {
          browser: "Current document only; earlier documents are not retained across the journey's page.goto calls.",
          client: "Whole test fixture; retain original Playwright traces for earlier documents.",
        },
        browser, client: { events, dropped },
      };
    },
  };
}
