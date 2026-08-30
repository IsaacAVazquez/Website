import RBTiersRedirectPage from "../rb-tiers/page";
import PositionTierRedirectPage from "../tiers/[position]/page";

const mockPermanentRedirect = jest.fn();
const mockRedirect = jest.fn();

jest.mock("next/navigation", () => ({
  permanentRedirect: (url: string) => mockPermanentRedirect(url),
  redirect: (url: string) => mockRedirect(url),
}));

describe("retired tier routes", () => {
  beforeEach(() => {
    mockPermanentRedirect.mockReset();
    mockRedirect.mockReset();
  });

  it("sends /rb-tiers to the canonical board with a permanent redirect", () => {
    RBTiersRedirectPage();

    expect(mockPermanentRedirect).toHaveBeenCalledWith("/fantasy-football?position=rb&scoring=ppr");
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("sends /tiers/[position] to the canonical board with a permanent redirect", async () => {
    await PositionTierRedirectPage({ params: Promise.resolve({ position: "QB" }) });

    expect(mockPermanentRedirect).toHaveBeenCalledWith("/fantasy-football?position=qb&scoring=ppr");
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
