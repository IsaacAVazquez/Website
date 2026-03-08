# Redirects & Navigation — AI Context Reference

> URL redirect map, navigation config, breadcrumb system, and routing conventions.

---

## Navigation Links

**File:** `src/constants/navlinks.tsx`

5 primary navigation items, used by `StaticHeader` and mobile menu:

| Label | href | Icon |
|-------|------|------|
| Home | `/` | `IconHome` |
| About | `/about` | `IconUser` |
| Work | `/portfolio` | `IconBriefcase` |
| Resume | `/resume` | `IconFileText` |
| Contact | `/contact` | `IconMail` |

**Note:** The nav link uses `/portfolio` directly (not `/projects`). The `/projects` redirect exists for external/legacy links only.

---

## URL Redirects

**File:** `next.config.mjs` — `redirects()` function

### Portfolio Redirects (301 Permanent)
| Source | Destination |
|--------|-------------|
| `/projects` | `/portfolio` |
| `/work` | `/portfolio` |
| `/projects/:path*` | `/portfolio/:path*` |
| `/portfolio/investment-analytics-platform` | `/investments` |

### Blog → Writing Redirects (301 Permanent)
| Source | Destination |
|--------|-------------|
| `/blog` | `/writing` |
| `/blog/:slug` | `/writing/:slug` |
| `/blog/posts/:slug` | `/writing/:slug` |
| `/articles/:slug` | `/writing/:slug` |

### Contact Aliases (301 Permanent)
| Source | Destination |
|--------|-------------|
| `/get-in-touch` | `/contact` |
| `/hire-me` | `/contact` |

### Resume Aliases (301 Permanent)
| Source | Destination |
|--------|-------------|
| `/cv` | `/resume` |
| `/resume.pdf` | `/Isaac_Vazquez_Resume.pdf` |

### Fantasy Football Aliases (302 Temporary)
| Source | Destination |
|--------|-------------|
| `/ff` | `/fantasy-football` |
| `/rankings` | `/fantasy-football` |
| `/qb` | `/fantasy-football/tiers/qb` |
| `/rb` | `/fantasy-football/tiers/rb` |
| `/wr` | `/fantasy-football/tiers/wr` |
| `/te` | `/fantasy-football/tiers/te` |

### Typo/Misspelling Corrections (302 Temporary)
| Source | Destination |
|--------|-------------|
| `/fantsy-football/:path*` | `/fantasy-football/:path*` |
| `/fantasy-footbal/:path*` | `/fantasy-football/:path*` |
| `/quatrerback` | `/fantasy-football/tiers/qb` |

---

## Header Navigation

**File:** `src/components/StaticHeader.tsx` (client component)

- Sticky header with scroll detection (shadow appears on scroll)
- Desktop: horizontal nav links with active state
- Mobile: hamburger menu with full-screen overlay
- Theme toggle in both views
- 44px minimum touch targets

**Active link detection:**
```typescript
// "/" matches only exact "/"
// "/projects" matches both "/projects" and "/portfolio" (redirect awareness)
// Other routes use pathname.startsWith()
```

**Scroll behavior:** Passive scroll event listener. Adds shadow class when `scrollY > 10`.

---

## Footer Navigation

**File:** `src/components/Footer.tsx` (client component)

**Social links:**
- LinkedIn: `https://linkedin.com/in/isaac-vazquez`
- GitHub: `https://github.com/IsaacAVazquez`

**CTAs:** "Get In Touch" → `/contact`, "View Resume" → `/resume`

**Footer links:** Accessibility statement → `/accessibility`

---

## Breadcrumb System

**File:** `src/components/navigation/Breadcrumbs.tsx` (client component)

Auto-generates breadcrumbs from URL pathname with optional custom items.

**Features:**
- Home link always first (when `showHome=true`)
- Route segment → label mapping (e.g., `fantasy-football` → `Fantasy Football`)
- Blog slug → full title mapping for known posts
- Generates inline `BreadcrumbList` JSON-LD structured data
- `ChevronRight` separator between items
- Active page highlighted with primary color background
- `aria-label="Breadcrumb"`, `aria-current="page"` for accessibility

**Blog title mapping (hardcoded):**
```
complete-guide-qa-engineering → Complete Guide to QA Engineering
mastering-fantasy-football-analytics → Mastering Fantasy Football Analytics
building-reliable-software-systems → Building Reliable Software Systems
```

---

## Conditional Layout

**File:** `src/components/ConditionalLayout.tsx` (client component)

Route-based layout switching:
- **Home page (`/`):** Full-width layout (no max-width container)
- **All other pages:** Constrained layout (`max-w-4xl mx-auto` with padding)
- Footer always rendered

---

## Social Links

**File:** `src/constants/socials.tsx`

```typescript
[{ href: "https://www.linkedin.com/in/isaac-vazquez/", label: "LinkedIn", icon: IconBrandLinkedin }]
```

Currently only LinkedIn. Icons from `@tabler/icons-react`.

---

## URL Conventions

| Pattern | Convention |
|---------|-----------|
| Portfolio pages | `/portfolio` and `/portfolio/[slug]` |
| Writing/blog | `/writing` and `/writing/[slug]` (canonical) |
| Fantasy football | `/fantasy-football/tiers/[position]` |
| Investments | `/investments` |
| Admin | `/admin` (auth-protected) |
| API routes | `/api/[service]` |
| Static assets | `/images/`, `/fantasy/`, `/project-screenshots/` |
| PDF resume | `/Isaac_Vazquez_Resume.pdf` |

**Key rules:**
- `/projects` is NOT a real route — it redirects to `/portfolio`
- `/blog` is NOT a real route — it redirects to `/writing`
- Fantasy football position shortcuts (`/qb`, `/rb`, etc.) are temporary redirects
- All portfolio/blog redirects are permanent (301)
