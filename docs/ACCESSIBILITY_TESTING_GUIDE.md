# Accessibility Testing Guide

Comprehensive testing procedures for keyboard navigation, screen reader compatibility, and mobile accessibility.

---

## 1. Keyboard Navigation Testing

### General Keyboard Navigation Checklist

#### Tab Order & Focus Management
- [ ] **Tab key** moves focus forward through all interactive elements in logical order
- [ ] **Shift + Tab** moves focus backward through interactive elements
- [ ] **Focus indicators** are visible and meet 3:1 contrast ratio (WCAG 2.1 AA)
- [ ] Focus order follows visual layout (left-to-right, top-to-bottom)
- [ ] No keyboard traps - users can navigate in and out of all components
- [ ] Skip to content link appears on first Tab press on each page

#### Interactive Elements
- [ ] All buttons activate with **Enter** and **Space** keys
- [ ] All links activate with **Enter** key
- [ ] Form inputs can be focused and edited with keyboard
- [ ] Dropdowns/selects can be opened with **Space** or **Enter**
- [ ] Dropdown options can be navigated with **Arrow keys**
- [ ] Radio buttons switch with **Arrow keys**
- [ ] Checkboxes toggle with **Space** key

#### Navigation Components
- [ ] **FloatingNav** - All navigation links are keyboard accessible
- [ ] **CommandPalette** - Opens with **⌘K** (Mac) or **Ctrl+K** (Windows)
- [ ] **CommandPalette** - Closes with **Escape** key
- [ ] **CommandPalette** - Search input receives focus when opened
- [ ] **CommandPalette** - Arrow keys navigate through results
- [ ] **Mobile Navigation** - Menu button is keyboard accessible
- [ ] **Mobile Navigation** - Menu closes with **Escape** key

#### Content Components
- [ ] **GlassCard** - Interactive cards are focusable and activate properly
- [ ] **MorphButton** - All buttons meet minimum 44x44px touch target
- [ ] **Modal/Dialog** - Focus trapped within modal when open
- [ ] **Modal/Dialog** - First focusable element receives focus on open
- [ ] **Modal/Dialog** - Closes with **Escape** key
- [ ] **Modal/Dialog** - Returns focus to trigger element on close

#### Form Testing
- [ ] **Contact Form** - Tab order follows: Name → Email → Message → Submit
- [ ] **Contact Form** - Required fields show error messages
- [ ] **Contact Form** - Error messages are announced to screen readers
- [ ] **Contact Form** - Submit button can be activated with Enter/Space
- [ ] **Newsletter Signup** - Email input and submit button are keyboard accessible

#### Fantasy Football Components
- [ ] **Draft Tracker** - All controls are keyboard accessible
- [ ] **Tier Charts** - Interactive elements can be navigated with keyboard
- [ ] **Player Cards** - Cards are focusable and expandable with keyboard
- [ ] **Position Selector** - Buttons can be navigated with Tab and activated with Enter/Space
- [ ] **Search/Filter** - Input fields are keyboard accessible

### Page-Specific Testing

#### Home Page (TerminalHero)
- [ ] Skip to content link works
- [ ] Terminal animation doesn't interfere with keyboard navigation
- [ ] All CTA buttons are keyboard accessible
- [ ] Scroll indicator doesn't trap focus

#### About Page
- [ ] All text content is readable and navigable
- [ ] Section headings are properly structured
- [ ] Links within content are keyboard accessible

#### Projects Page
- [ ] Project cards are keyboard navigable
- [ ] Case study expandable sections work with keyboard
- [ ] External links are keyboard accessible
- [ ] Filter/category buttons are keyboard accessible

#### Resume Page
- [ ] All resume sections are navigable
- [ ] Download/print buttons work with keyboard
- [ ] Timeline sections are properly structured

#### Contact Page
- [ ] Contact form is fully keyboard accessible
- [ ] Social media links are keyboard accessible
- [ ] Email and LinkedIn buttons work properly

#### Fantasy Football Pages
- [ ] Draft tracker interface is fully keyboard accessible
- [ ] Tier charts can be navigated and filtered
- [ ] Player selection works with keyboard
- [ ] Data tables can be navigated with Tab

---

## 2. Screen Reader Testing

Test with at least one of these screen readers:
- **NVDA** (Windows, Free) - [Download](https://www.nvaccess.org/)
- **JAWS** (Windows, Paid/Trial) - [Download](https://www.freedomscientific.com/products/software/jaws/)
- **VoiceOver** (macOS/iOS, Built-in) - Enable in System Settings
- **TalkBack** (Android, Built-in) - Enable in Settings

### Screen Reader Testing Checklist

#### Semantic HTML & ARIA
- [ ] Page has proper `<main>` landmark
- [ ] Navigation is wrapped in `<nav>` landmark
- [ ] Headings follow logical hierarchy (h1 → h2 → h3)
- [ ] No heading levels are skipped
- [ ] All images have descriptive alt text (or `alt=""` for decorative)
- [ ] Links have descriptive text (not "click here" or "read more")
- [ ] Buttons have descriptive labels
- [ ] Forms have proper `<label>` elements or `aria-label`

#### Component Announcements
- [ ] **SkipToContent** - Announced as "Skip to main content" link
- [ ] **FloatingNav** - Navigation items are announced with role and label
- [ ] **GlassCard** - Cards are announced as "article" with proper labels
- [ ] **MorphButton** - Buttons announce their purpose clearly
- [ ] **CommandPalette** - Dialog role announced, search input labeled
- [ ] **Modal/Dialog** - Role and purpose announced when opened
- [ ] **Form errors** - Error messages are announced immediately
- [ ] **Form success** - Success messages are announced

#### Interactive Element States
- [ ] Expanded/collapsed states announced for accordions
- [ ] Selected/unselected states announced for tabs
- [ ] Checked/unchecked states announced for checkboxes
- [ ] Loading states announced with `aria-live` regions
- [ ] Error states announced with `aria-invalid`
- [ ] Disabled states announced properly

#### Live Regions & Dynamic Content
- [ ] Form validation errors use `aria-live="polite"`
- [ ] Success messages use `aria-live="polite"`
- [ ] Loading spinners announce loading state
- [ ] Draft tracker updates are announced
- [ ] Player selection changes are announced

#### Page Structure Navigation
- [ ] Screen reader can navigate by landmarks (Main, Navigation, etc.)
- [ ] Screen reader can navigate by headings (H key in NVDA/JAWS)
- [ ] Screen reader can list all links (Links list command)
- [ ] Screen reader can list all form controls

### Testing Procedure for Each Page

1. **Start screen reader** before opening browser
2. **Navigate to page** and let screen reader announce page title
3. **Press H key** to navigate through headings - verify logical order
4. **Press Tab** through interactive elements - verify all are announced
5. **Use landmark navigation** (D key in NVDA/JAWS) - verify structure
6. **Test forms** - verify labels, errors, and success messages
7. **Test dynamic content** - verify live region announcements
8. **Test modals/dialogs** - verify focus management and announcements

---

## 3. Mobile Device Testing

Test on real devices whenever possible. Minimum test matrix:
- **iOS**: iPhone 12 or newer, Safari
- **Android**: Pixel 5 or newer, Chrome
- **Tablet**: iPad Air or newer, Safari

### Mobile Accessibility Checklist

#### Touch Targets
- [ ] All buttons are minimum 44x44px (Apple guideline)
- [ ] All links are minimum 44x44px
- [ ] Interactive elements have adequate spacing (8px minimum)
- [ ] No overlapping touch targets

#### Gestures & Interactions
- [ ] Tap interactions work consistently
- [ ] Swipe gestures work for carousels (if applicable)
- [ ] Pinch-to-zoom is not disabled
- [ ] Double-tap-to-zoom works on text content
- [ ] Scrolling is smooth and doesn't jump

#### Mobile Navigation
- [ ] **FloatingNav** adapts properly to mobile
- [ ] **Mobile menu button** is easily tappable
- [ ] **Mobile menu** opens and closes smoothly
- [ ] **CommandPalette** works on mobile keyboards
- [ ] All navigation links work on mobile

#### Responsive Design
- [ ] Text is readable without zooming (16px minimum)
- [ ] Images scale properly and don't overflow
- [ ] Cards and containers adapt to screen width
- [ ] Form inputs are large enough to tap and type
- [ ] Tables are scrollable or adapt to mobile

#### Performance on Mobile
- [ ] Pages load quickly (< 3 seconds on 4G)
- [ ] Animations don't cause lag or jank
- [ ] Images are optimized for mobile bandwidth
- [ ] No horizontal scrolling (except intentional)

#### Mobile-Specific Components
- [ ] **TerminalHero** - Renders properly on mobile
- [ ] **Fantasy Football Tier Charts** - Readable on small screens
- [ ] **Draft Tracker** - Usable on mobile devices
- [ ] **Project Cards** - Stack properly on mobile
- [ ] **Contact Form** - Easy to fill out on mobile

#### iOS-Specific Testing
- [ ] Test with VoiceOver enabled
- [ ] Test in both portrait and landscape
- [ ] Test with Safari and iOS keyboard
- [ ] Test form autofill functionality
- [ ] Test with Dynamic Type (larger text sizes)

#### Android-Specific Testing
- [ ] Test with TalkBack enabled
- [ ] Test in both portrait and landscape
- [ ] Test with Chrome and Android keyboard
- [ ] Test form autofill functionality
- [ ] Test with font size scaling

---

## 4. Automated Testing Tools

Supplement manual testing with automated tools:

### Browser Extensions
- [ ] **axe DevTools** - [Chrome/Firefox Extension](https://www.deque.com/axe/devtools/)
  - Run on every page
  - Fix all critical and serious issues
  - Review moderate issues

- [ ] **Lighthouse** (Chrome DevTools)
  - Run accessibility audit on each page
  - Aim for 95+ accessibility score
  - Address all actionable issues

- [ ] **WAVE** - [Web Accessibility Evaluation Tool](https://wave.webaim.org/extension/)
  - Review all errors and alerts
  - Verify semantic structure
  - Check contrast ratios

### Command Line Tools
```bash
# Install Pa11y for automated testing
npm install -g pa11y

# Test individual pages
pa11y https://isaacavazquez.com
pa11y https://isaacavazquez.com/about
pa11y https://isaacavazquez.com/projects
pa11y https://isaacavazquez.com/fantasy-football

# Test entire site
pa11y-ci --sitemap https://isaacavazquez.com/sitemap.xml
```

### React Testing Library (for developers)
```typescript
// Test keyboard navigation
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('button is keyboard accessible', async () => {
  render(<MorphButton>Click me</MorphButton>);
  const button = screen.getByRole('button', { name: /click me/i });

  button.focus();
  expect(button).toHaveFocus();

  await userEvent.keyboard('{Enter}');
  // Assert expected behavior
});
```

---

## 5. Testing Schedule & Reporting

### Regular Testing Cadence
- **Before each deployment** - Run automated tests (Lighthouse, axe)
- **Monthly** - Manual keyboard navigation testing
- **Quarterly** - Full screen reader testing across all pages
- **Semi-annually** - Physical device testing (iOS/Android)
- **After major updates** - Complete accessibility audit

### Issue Reporting Template

```markdown
## Accessibility Issue Report

**Date**: [Date]
**Tester**: [Name]
**Page/Component**: [URL or component name]
**Severity**: Critical | High | Medium | Low
**WCAG Criterion**: [e.g., 2.1.1 Keyboard]

### Issue Description
[Clear description of the accessibility issue]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Impact
[Who is affected and how]

### Suggested Fix
[Proposed solution]

### Screenshots/Videos
[Attach evidence if applicable]
```

---

## 6. Accessibility Statement

Consider adding an accessibility statement to the site:

### Sample Accessibility Statement
```markdown
# Accessibility Statement for isaacavazquez.com

We are committed to ensuring digital accessibility for people with disabilities.
We are continually improving the user experience for everyone and applying the
relevant accessibility standards.

## Conformance Status
This website aims to conform to WCAG 2.1 Level AA standards.

## Feedback
We welcome your feedback on the accessibility of this site. Please contact us at:
- Email: isaacavazquez95@gmail.com
- LinkedIn: linkedin.com/in/isaac-vazquez

## Compatibility
This website is designed to be compatible with:
- Recent versions of Chrome, Firefox, Safari, and Edge
- Screen readers including NVDA, JAWS, and VoiceOver
- Mobile devices running iOS 14+ and Android 10+

## Technical Specifications
- HTML5 semantic markup
- ARIA landmarks and labels
- Keyboard navigation support
- Screen reader compatibility
- Responsive design for all screen sizes

Last updated: [Date]
```

---

## 7. Quick Reference: Keyboard Shortcuts

### General Navigation
- **Tab** - Move focus forward
- **Shift + Tab** - Move focus backward
- **Enter** - Activate links and buttons
- **Space** - Activate buttons, toggle checkboxes
- **Escape** - Close modals and dialogs
- **Arrow Keys** - Navigate within components

### Screen Reader Commands

#### NVDA (Windows)
- **H** - Navigate by headings
- **D** - Navigate by landmarks
- **K** - Navigate by links
- **F** - Navigate by form controls
- **Insert + F7** - Elements list

#### VoiceOver (macOS)
- **VO + H** - Navigate by headings
- **VO + Command + H** - Headings menu
- **VO + U** - Rotor (elements list)
- **VO + Right Arrow** - Next item
- **VO + Left Arrow** - Previous item

(VO = Control + Option)

---

## Conclusion

Consistent accessibility testing ensures that isaacavazquez.com remains usable
for all visitors, regardless of their abilities or the assistive technologies
they use. This testing guide should be reviewed and updated regularly as new
features are added and accessibility standards evolve.

**Target**: Maintain WCAG 2.1 Level AA compliance across all pages and components.
