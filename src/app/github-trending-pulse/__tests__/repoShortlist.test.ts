import { parseRepoShortlist, toggleRepoShortlist } from "../repoShortlist";

it("keeps unique positive repository ids and rejects untrusted restored values", () => {
  expect(parseRepoShortlist('[1,1,2,-3,0,1.5,"4",null]')).toEqual([1, 2]);
  expect(parseRepoShortlist('{"constructor":4}')).toEqual([]);
});

it("toggles only the chosen repository against the newest saved list", () => {
  expect(toggleRepoShortlist([1, 2], 1)).toEqual([2]);
  expect(toggleRepoShortlist([1, 2], 3)).toEqual([1, 2, 3]);
  expect(toggleRepoShortlist([1], Infinity)).toEqual([1]);
});
