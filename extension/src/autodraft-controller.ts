import { detectFantasyDraftProvider } from "@/lib/fantasyCompanion";

export type AutoDraftProvider = "espn" | "sleeper";

export interface AutoDraftCandidate {
  name: string;
  team: string;
  position: string;
  rank: number;
}

export interface AutoDraftPositionLimit {
  position: string;
  maximum: number;
}

export interface AutoDraftRoundRule {
  round: number;
  position: string;
}

export interface AutoDraftCommand {
  type: "FANTASY_AUTODRAFT_ARM" | "FANTASY_AUTODRAFT_DISARM";
  provider: AutoDraftProvider;
  live?: boolean;
  pickDelayMs?: number;
  queue?: AutoDraftCandidate[];
  rounds?: number;
  positionLimits?: AutoDraftPositionLimit[];
  roundRules?: AutoDraftRoundRule[];
}

export type AutoDraftPhase =
  | "ready"
  | "armed"
  | "waiting"
  | "searching"
  | "dry-run"
  | "submitted"
  | "stopped"
  | "error";

export interface AutoDraftStatus {
  type: "FANTASY_AUTODRAFT_STATUS";
  provider: AutoDraftProvider;
  phase: AutoDraftPhase;
  message: string;
  armed: boolean;
  live: boolean;
  candidate?: AutoDraftCandidate;
  updatedAt: string;
}

interface AutoDraftRuntime {
  provider: AutoDraftProvider;
  armed: boolean;
  live: boolean;
  queue: AutoDraftCandidate[];
  rounds: number;
  positionLimits: AutoDraftPositionLimit[];
  roundRules: AutoDraftRoundRule[];
  drafted: AutoDraftCandidate[];
  pickDelayMs: number;
  turnStartedAt: number | null;
  actedThisTurn: boolean;
  working: boolean;
  /** Bumped by every command so a tick that awaited across an arm or disarm never acts on stale intent. */
  generation: number;
}

interface PageRow {
  element: HTMLElement;
  text: string;
}

const ON_CLOCK_PATTERNS = [
  /\byou are on the clock\b/i,
  /\byou're on the clock\b/i,
  /\bit(?:'|’)s your turn\b/i,
  /\byour turn to pick\b/i,
  /\bit is your pick\b/i,
  /\byour pick is now\b/i,
];

const STOPPED_PATTERNS = [
  /draft complete/i,
  /draft has ended/i,
  /the draft is over/i,
];

const SEARCH_SELECTORS = [
  'input[type="search"]',
  'input[placeholder*="Search" i]',
  'input[aria-label*="Search" i]',
  'input[placeholder*="player" i]',
  'input[aria-label*="player" i]',
];

const ROW_SELECTORS = [
  "[data-player-id]",
  "[data-testid*='player' i]",
  "[class*='player-row' i]",
  "[class*='playerRow' i]",
  "[role='row']",
  "tr",
  "li",
  "button",
  "[role='button']",
].join(",");

/** A draft control is a real button whose label starts with the verb. */
const ACTION_PATTERN = /^\s*(draft|select)\b/i;
const NOT_ACTION_PATTERN = /\b(queue|watch|remove|undo|cancel)\b/i;
const CONFIRM_PATTERN = /\b(confirm|draft|select player|make pick)\b/i;
const DEFENSE_TOKENS = ["dst", "d st", "def", "defense"];

export function detectAutoDraftProvider(
  hostname = window.location.hostname
): AutoDraftProvider | null {
  const provider = detectFantasyDraftProvider(hostname);
  return provider === "underdog" ? null : provider;
}

export function normalizeAutoDraftName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv)\.?\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function isVisible(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function isEnabled(element: Element): element is HTMLElement {
  return (
    isVisible(element) &&
    !(element instanceof HTMLButtonElement && element.disabled) &&
    element.getAttribute("aria-disabled") !== "true"
  );
}

function visiblePageText(): string {
  return document.body?.innerText ?? document.body?.textContent ?? "";
}

export function pageSaysUserIsOnClock(text = visiblePageText()): boolean {
  return ON_CLOCK_PATTERNS.some((pattern) => pattern.test(text));
}

function pageSaysDraftStopped(text = visiblePageText()): boolean {
  return STOPPED_PATTERNS.some((pattern) => pattern.test(text));
}

/** The page's own round header wins; the controller's pick count is the fallback. */
export function readCurrentRound(text: string, fallback: number, rounds: number): number {
  const parsed = Number(text.match(/\bround\s*(\d{1,2})\b/i)?.[1]);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= rounds ? parsed : fallback;
}

export function isCandidateEligible(
  candidate: AutoDraftCandidate,
  round: number,
  drafted: readonly AutoDraftCandidate[],
  positionLimits: readonly AutoDraftPositionLimit[],
  roundRules: readonly AutoDraftRoundRule[]
): boolean {
  const draftedCount = drafted.filter((pick) => pick.position === candidate.position).length;
  const rule = roundRules.find((entry) => entry.position === candidate.position);
  if (rule) {
    // A reserved position (K, DST) is only drafted in its own round or later,
    // and never twice.
    return round >= rule.round && draftedCount === 0;
  }
  if (roundRules.some((entry) => entry.round === round)) return false;
  const limit = positionLimits.find((entry) => entry.position === candidate.position);
  return !limit || draftedCount < limit.maximum;
}

function findSearchInput(): HTMLInputElement | null {
  for (const selector of SEARCH_SELECTORS) {
    const candidates = Array.from(document.querySelectorAll(selector));
    const input = candidates.find(
      (candidate): candidate is HTMLInputElement =>
        candidate instanceof HTMLInputElement && isEnabled(candidate)
    );
    if (input) return input;
  }
  return null;
}

function setNativeInputValue(input: HTMLInputElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  );
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

/** textContent runs adjacent spans together ("BrownDET"), so join text nodes with spaces. */
function elementText(element: Element): string {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const parts: string[] = [];
  while (walker.nextNode()) parts.push(walker.currentNode.textContent ?? "");
  return parts.join(" ");
}

function labelParts(element: Element): string[] {
  return [
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    elementText(element),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.replace(/\s+/g, " ").trim());
}

function includesPhrase(text: string, phrase: string): boolean {
  return ` ${text} `.includes(` ${phrase} `);
}

/** Name, team, and position all have to appear as whole words in the row text. */
export function rowMatchesCandidate(text: string, candidate: AutoDraftCandidate): boolean {
  const name = normalizeAutoDraftName(candidate.name);
  const team = normalizeAutoDraftName(candidate.team);
  const position = normalizeAutoDraftName(candidate.position);
  const isDefense = position === "dst";
  const nameMatches =
    includesPhrase(text, name) ||
    // Providers label a defense by nickname ("Texans D/ST").
    (isDefense && includesPhrase(text, name.split(" ").at(-1) ?? name));
  if (!nameMatches) return false;
  if (team && !includesPhrase(text, team)) return false;
  if (!position) return true;
  return isDefense
    ? DEFENSE_TOKENS.some((token) => includesPhrase(text, token))
    : includesPhrase(text, position);
}

function collectRows(): PageRow[] {
  return Array.from(document.querySelectorAll(ROW_SELECTORS)).flatMap((element) =>
    element instanceof HTMLElement
      ? [{ element, text: normalizeAutoDraftName(labelParts(element).join(" ")) }]
      : []
  );
}

function isDraftAction(element: Element): boolean {
  const parts = labelParts(element);
  return (
    parts.some((part) => ACTION_PATTERN.test(part)) &&
    !parts.some((part) => NOT_ACTION_PATTERN.test(part))
  );
}

function findActionInRow(row: HTMLElement): HTMLElement | null {
  if (row.matches("button, [role='button']")) {
    return isEnabled(row) && isDraftAction(row) ? row : null;
  }
  const actions = Array.from(row.querySelectorAll("button, [role='button']")).filter(
    (action): action is HTMLElement => isEnabled(action) && isDraftAction(action)
  );
  return actions.length === 1 ? actions[0] : null;
}

/**
 * The innermost visible rows that carry the candidate's name, team, and
 * position and hold exactly one enabled draft button. One row is a match,
 * none means the player is gone, and more than one is uncertain.
 */
function findDraftControl(
  candidate: AutoDraftCandidate,
  rows: readonly PageRow[]
): { row: HTMLElement; action: HTMLElement } | "ambiguous" | null {
  const matching = rows.filter((row) => rowMatchesCandidate(row.text, candidate));
  const innermost = matching.filter(
    (row) =>
      !matching.some(
        (other) => other !== row && row.element !== other.element && row.element.contains(other.element)
      )
  );
  const controls = innermost.flatMap((row) => {
    if (!isVisible(row.element)) return [];
    const action = findActionInRow(row.element);
    return action ? [{ row: row.element, action }] : [];
  });
  if (controls.length === 0) return null;
  if (controls.length > 1) return "ambiguous";
  return controls[0];
}

function findConfirmationButton(): HTMLElement | null {
  const dialogs = Array.from(
    document.querySelectorAll("[role='dialog'], [aria-modal='true']")
  ).filter(isVisible);

  for (const scope of dialogs) {
    const buttons = Array.from(
      scope.querySelectorAll("button, [role='button']")
    ).filter(isEnabled);
    const confirmation = buttons.find((button) =>
      CONFIRM_PATTERN.test(labelParts(button).join(" "))
    );
    if (confirmation) return confirmation;
  }
  return null;
}

function clickElement(element: HTMLElement): void {
  if (typeof element.scrollIntoView === "function") {
    element.scrollIntoView({ block: "center", inline: "nearest" });
  }
  element.click();
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

class UncertainPlayerError extends Error {}

async function findAvailableCandidate(
  queue: readonly AutoDraftCandidate[]
): Promise<{
  candidate: AutoDraftCandidate;
  row: HTMLElement;
  action: HTMLElement;
} | null> {
  const search = findSearchInput();
  if (search) {
    search.focus();
    setNativeInputValue(search, "");
    await wait(250);
  }

  const rows = collectRows();
  for (const candidate of queue) {
    const control = findDraftControl(candidate, rows);
    if (control === "ambiguous") {
      throw new UncertainPlayerError(`more than one draft control matched ${candidate.name}`);
    }
    if (control) return { candidate, ...control };
  }

  if (!search) return null;

  for (const candidate of queue.slice(0, 60)) {
    search.focus();
    setNativeInputValue(search, candidate.name);
    await wait(200);
    const control = findDraftControl(candidate, collectRows());
    if (control === "ambiguous") {
      throw new UncertainPlayerError(`more than one draft control matched ${candidate.name}`);
    }
    if (control) return { candidate, ...control };
  }

  setNativeInputValue(search, "");
  return null;
}

function createStatus(
  runtime: AutoDraftRuntime,
  phase: AutoDraftPhase,
  message: string,
  candidate?: AutoDraftCandidate
): AutoDraftStatus {
  return {
    type: "FANTASY_AUTODRAFT_STATUS",
    provider: runtime.provider,
    phase,
    message,
    armed: runtime.armed,
    live: runtime.live,
    candidate,
    updatedAt: new Date().toISOString(),
  };
}

export function startAutoDraftController(
  provider: AutoDraftProvider,
  publish: (status: AutoDraftStatus) => void
): {
  handleCommand: (command: AutoDraftCommand) => Promise<AutoDraftStatus>;
  stop: () => void;
} {
  const runtime: AutoDraftRuntime = {
    provider,
    armed: false,
    live: false,
    queue: [],
    rounds: Number.POSITIVE_INFINITY,
    positionLimits: [],
    roundRules: [],
    drafted: [],
    pickDelayMs: 2500,
    turnStartedAt: null,
    actedThisTurn: false,
    working: false,
    generation: 0,
  };
  let intervalId: number | null = null;
  let lastPhase: AutoDraftPhase | null = null;
  let lastMessage = "";

  const emit = (
    phase: AutoDraftPhase,
    message: string,
    candidate?: AutoDraftCandidate
  ): AutoDraftStatus => {
    const status = createStatus(runtime, phase, message, candidate);
    if (phase !== lastPhase || message !== lastMessage) {
      lastPhase = phase;
      lastMessage = message;
      publish(status);
    }
    return status;
  };

  const tick = async (): Promise<void> => {
    if (!runtime.armed || runtime.working) return;
    const pageText = visiblePageText();

    if (pageSaysDraftStopped(pageText)) {
      runtime.armed = false;
      emit("stopped", "The draft ended, so the controller disarmed itself.");
      return;
    }

    if (!pageSaysUserIsOnClock(pageText)) {
      runtime.turnStartedAt = null;
      runtime.actedThisTurn = false;
      emit("waiting", "Armed and waiting for your turn.");
      return;
    }

    // The status published when the controller acted (or failed) still
    // stands until the page moves on, so there is nothing new to say.
    if (runtime.actedThisTurn) return;

    runtime.turnStartedAt ??= Date.now();
    if (Date.now() - runtime.turnStartedAt < runtime.pickDelayMs) {
      emit("waiting", "Your turn was detected. Waiting for the safety delay.");
      return;
    }

    runtime.working = true;
    const generation = runtime.generation;
    const live = runtime.live;
    // ponytail: drafted only counts this controller's own submissions, so
    // caps are loose when picks were made before arming; the page round
    // header covers the K and DST rounds in that case.
    const round = readCurrentRound(pageText, runtime.drafted.length + 1, runtime.rounds);
    const eligible = runtime.queue.filter((candidate) =>
      isCandidateEligible(candidate, round, runtime.drafted, runtime.positionLimits, runtime.roundRules)
    );
    emit("searching", "Checking the ranked queue for an available player.");
    try {
      const match = await findAvailableCandidate(eligible);
      if (runtime.generation !== generation || !runtime.armed) return;

      if (!match) {
        runtime.actedThisTurn = true;
        emit(
          "error",
          "No ranked player could be matched with confidence. The provider autopick will take over."
        );
        return;
      }

      if (!live) {
        runtime.actedThisTurn = true;
        emit(
          "dry-run",
          `Dry run would draft ${match.candidate.name}.`,
          match.candidate
        );
        return;
      }

      clickElement(match.action);
      await wait(350);
      const confirmation = findConfirmationButton();
      if (confirmation && confirmation !== match.action) clickElement(confirmation);
      runtime.actedThisTurn = true;
      runtime.drafted.push(match.candidate);
      emit(
        "submitted",
        `${match.candidate.name} was submitted.`,
        match.candidate
      );
    } catch (error) {
      if (runtime.generation !== generation || !runtime.armed) return;
      runtime.actedThisTurn = true;
      emit(
        "error",
        error instanceof UncertainPlayerError
          ? `The controller stopped this turn because ${error.message}. The provider autopick will take over.`
          : error instanceof Error
            ? `The controller stopped this turn because ${error.message}`
            : "The controller stopped this turn after an unknown page error."
      );
    } finally {
      runtime.working = false;
    }
  };

  const handleCommand = async (
    command: AutoDraftCommand
  ): Promise<AutoDraftStatus> => {
    if (command.provider !== provider) {
      return emit("error", "The open tab does not match the selected provider.");
    }

    runtime.generation += 1;
    if (command.type === "FANTASY_AUTODRAFT_DISARM") {
      runtime.armed = false;
      runtime.live = false;
      runtime.queue = [];
      runtime.turnStartedAt = null;
      runtime.actedThisTurn = false;
      return emit("stopped", "Autodraft is off for this tab.");
    }

    const queue = Array.isArray(command.queue) ? command.queue : [];
    if (queue.length === 0) {
      return emit("error", "The controller did not receive a ranked queue.");
    }

    runtime.armed = true;
    runtime.live = command.live === true;
    runtime.queue = queue;
    runtime.rounds = Number.isInteger(command.rounds) && Number(command.rounds) > 0
      ? Number(command.rounds)
      : Number.POSITIVE_INFINITY;
    runtime.positionLimits = Array.isArray(command.positionLimits) ? command.positionLimits : [];
    runtime.roundRules = Array.isArray(command.roundRules) ? command.roundRules : [];
    runtime.pickDelayMs = Math.max(1000, Math.min(15000, command.pickDelayMs ?? 2500));
    runtime.turnStartedAt = null;
    runtime.actedThisTurn = false;
    return emit(
      "armed",
      runtime.live
        ? `Live autodraft is armed with ${queue.length} ranked players.`
        : `Dry run is armed with ${queue.length} ranked players.`
    );
  };

  intervalId = window.setInterval(() => {
    void tick();
  }, 900);
  emit("ready", "The draft controller is ready in this tab.");

  return {
    handleCommand,
    stop: () => {
      if (intervalId !== null) window.clearInterval(intervalId);
      intervalId = null;
      runtime.armed = false;
    },
  };
}
