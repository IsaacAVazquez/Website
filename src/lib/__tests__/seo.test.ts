import { constructMetadata, siteConfig } from '../seo';

jest.mock('@/lib/ai-seo', () => ({
  generateAIMetaTags: jest.fn(() => ({})),
}));

describe('constructMetadata', () => {
  it('uses siteConfig defaults when called with no arguments', () => {
    const metadata = constructMetadata();
    expect(metadata.description).toBe(siteConfig.description);
  });

  it('default title template contains siteConfig.name', () => {
    const metadata = constructMetadata();
    const title = metadata.title as { default: string; template: string };
    expect(title.default).toContain(siteConfig.name);
  });

  it('custom description overrides the default', () => {
    const metadata = constructMetadata({ description: 'Custom description' });
    expect(metadata.description).toBe('Custom description');
  });

  it('sets noIndex robots when noIndex is true', () => {
    const metadata = constructMetadata({ noIndex: true });
    const robots = metadata.robots as { index: boolean; follow: boolean };
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
  });

  it('allows crawling by default (noIndex: false)', () => {
    const metadata = constructMetadata({ noIndex: false });
    const robots = metadata.robots as { index: boolean; follow: boolean };
    expect(robots.index).toBe(true);
    expect(robots.follow).toBe(true);
  });

  it('sets alternates.canonical to provided canonicalUrl', () => {
    const metadata = constructMetadata({ canonicalUrl: '/about' });
    expect(metadata.alternates?.canonical).toBe('/about');
  });

  it('openGraph description matches the resolved description', () => {
    const metadata = constructMetadata({ description: 'OG description test' });
    const og = metadata.openGraph as { description: string };
    expect(og.description).toBe('OG description test');
  });

  it('openGraph title contains siteConfig.name', () => {
    const metadata = constructMetadata({ title: 'My Page' });
    const og = metadata.openGraph as { title: string };
    expect(og.title).toContain(siteConfig.name);
    expect(og.title).toContain('My Page');
  });

  it('includes authors with siteConfig.name', () => {
    const metadata = constructMetadata();
    expect(metadata.authors).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: siteConfig.name })])
    );
  });
});
