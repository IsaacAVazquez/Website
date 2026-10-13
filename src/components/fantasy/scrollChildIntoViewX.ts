/**
 * Brings a child of a sideways scroller into view by moving the scroller
 * alone. `Element.scrollIntoView` would also scroll the page to the element,
 * which is wrong for a bar at the top of a page someone has already scrolled.
 */
export function scrollChildIntoViewX(
  scroller: HTMLElement,
  child: HTMLElement,
  margin = 12,
  align: "nearest" | "start" = "nearest",
): void {
  if (scroller.scrollWidth <= scroller.clientWidth) return;
  const box = scroller.getBoundingClientRect();
  const item = child.getBoundingClientRect();
  const hidden = item.left < box.left + margin || item.right > box.right - margin;
  // "start" puts a child that is not fully in view at the scroller's left edge, so nothing is cut there.
  if (align === "start") {
    if (hidden) scroller.scrollLeft += item.left - box.left - margin;
    return;
  }
  if (item.left < box.left + margin) {
    scroller.scrollLeft -= box.left + margin - item.left;
  } else if (item.right > box.right - margin) {
    scroller.scrollLeft += item.right - (box.right - margin);
  }
}
