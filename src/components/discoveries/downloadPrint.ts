import { DISPLAY_TIME_ZONE } from "@/lib/date-formatters";

/** Render text with canvas, never HTML or interpolated SVG. No external assets. */
export function downloadPrint(element: HTMLElement, lines: string[], filename: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 180 + lines.length * 48;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image export is unavailable in this browser.");
  const tokens = getComputedStyle(element);
  context.fillStyle = tokens.getPropertyValue("--c97-surface").trim();
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = tokens.getPropertyValue("--c97-ink").trim();
  context.font = "24px monospace";
  lines.forEach((line, index) => context.fillText(line, 60, 100 + index * 48, 780));
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function downloadPoster(element: HTMLElement) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1125;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image export is unavailable in this browser.");
  const tokens = getComputedStyle(element);
  const ink = tokens.getPropertyValue("--c97-ink").trim();
  context.fillStyle = tokens.getPropertyValue("--c97-surface").trim();
  context.fillRect(0, 0, 900, 1125);
  context.strokeStyle = ink;
  context.lineWidth = 2;
  context.strokeRect(30, 30, 840, 1065);
  const face = element.querySelector("span");
  context.font = `180px ${face ? getComputedStyle(face).fontFamily : "sans-serif"}`;
  context.fillStyle = tokens.getPropertyValue("--c97-riso-blue").trim();
  ["ONE", "MORE", "SIDE", "PROJECT."].forEach((word, index) => context.fillText(word, 100, 270 + index * 175, 700));
  context.globalAlpha = 0.65;
  context.fillStyle = tokens.getPropertyValue("--c97-riso-vermilion").trim();
  ["ONE", "MORE", "SIDE", "PROJECT."].forEach((word, index) => context.fillText(word, 102, 271 + index * 175, 700));
  context.globalAlpha = 1;
  context.fillStyle = ink;
  context.font = "22px monospace";
  context.fillText("APPROVED FOR PRINTING", 100, 960);
  context.fillText(new Date().toLocaleDateString("en-US", { timeZone: DISPLAY_TIME_ZONE }), 100, 1000);
  context.fillText("Isaac Vazquez / Catalog 97", 100, 1040);
  const link = document.createElement("a");
  link.download = "souvenir-print.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
