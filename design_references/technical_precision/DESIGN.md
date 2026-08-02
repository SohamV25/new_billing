---
name: Technical Precision
colors:
  surface: "#131314"
  surface-dim: "#131314"
  surface-bright: "#39393a"
  surface-container-lowest: "#0e0e0f"
  surface-container-low: "#1c1b1c"
  surface-container: "#201f20"
  surface-container-high: "#2a2a2b"
  surface-container-highest: "#353436"
  on-surface: "#e5e2e3"
  on-surface-variant: "#c3c6d1"
  inverse-surface: "#e5e2e3"
  inverse-on-surface: "#313031"
  outline: "#8d919b"
  outline-variant: "#424750"
  surface-tint: "#a8c8ff"
  primary: "#b5cfff"
  on-primary: "#003061"
  primary-container: "#8ab4f8"
  on-primary-container: "#0d4582"
  inverse-primary: "#315f9d"
  secondary: "#adc7ff"
  on-secondary: "#002e68"
  secondary-container: "#026be0"
  on-secondary-container: "#f2f4ff"
  tertiary: "#afd8bb"
  on-tertiary: "#113723"
  tertiary-container: "#94bca0"
  on-tertiary-container: "#274c36"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  primary-fixed: "#d5e3ff"
  primary-fixed-dim: "#a8c8ff"
  on-primary-fixed: "#001b3c"
  on-primary-fixed-variant: "#114784"
  secondary-fixed: "#d8e2ff"
  secondary-fixed-dim: "#adc7ff"
  on-secondary-fixed: "#001a41"
  on-secondary-fixed-variant: "#004493"
  tertiary-fixed: "#c3edcf"
  tertiary-fixed-dim: "#a7d0b3"
  on-tertiary-fixed: "#002110"
  on-tertiary-fixed-variant: "#294e38"
  background: "#131314"
  on-background: "#e5e2e3"
  surface-variant: "#353436"
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: "600"
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: "500"
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.02em
  mono-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: "400"
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is built for "Stitch Billing," targeting developers and financial operators who require a high-density, high-precision interface. The aesthetic is inspired by modern developer environments: professional, focused, and systematic.

The style leverages **Corporate Minimalism** with a **Technical Dark Mode** execution. It prioritizes clarity and information density over decorative elements. The visual language uses subtle tonal shifts to indicate hierarchy, creating a layered environment that feels deep yet organized. The interface should evoke feelings of reliability, speed, and systematic control.

## Colors

The palette is optimized for long-duration focused work, minimizing eye strain through a slate-tinted dark gray foundation.

- **Backgrounds:** The base layer is a deep slate `#131314`. Surfaces use `#1E1F22` for primary containers and `#212327` for secondary components or hover states.
- **Accents:** The primary accent (`#8AB4F8`) is used for active states, links, and high-visibility indicators. The primary button uses the more saturated `#1A73E8` to ensure it commands attention against dark surfaces.
- **Borders:** All UI boundaries are defined by a fine `#2D2F34` border to maintain structural integrity without creating visual noise.

## Typography

This design system utilizes **Inter** for its systematic and neutral character across primary UI elements. For technical data, billing IDs, and code-related labels, **Geist** is used to provide a monospaced, developer-friendly feel.

Headlines should use tighter letter spacing to maintain a compact, modern appearance. Body text is optimized for readability at 14px, which is the standard for high-density billing dashboards. Mobile variants for `headline-lg` should scale down to 24px to ensure fit on narrow viewports.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a base unit of 4px. This allows for the high density required by financial applications.

- **Desktop:** A 12-column grid with 16px gutters. Main content is housed in cards that span the necessary column count.
- **Mobile:** A 4-column grid with 16px margins.
- **Rhythm:** Use 8px (2 units) for related elements and 16px (4 units) for separate sections within a container. Large layout sections should be separated by 32px or 48px to provide breathing room in an otherwise dense UI.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** rather than heavy shadows.

1. **Level 0 (Base):** `#131314` – Used for the main application background.
2. **Level 1 (Surface):** `#1E1F22` – Used for main content cards and navigation sidebars. Includes a 1px border of `#2D2F34`.
3. **Level 2 (Elevated):** `#212327` – Used for modals, tooltips, and floating menus. These should have a subtle, diffused shadow (0px 8px 24px rgba(0,0,0,0.5)) to distinguish them from the surface layer.

Avoid using purely white or high-brightness colors for elevations to maintain the dark-mode integrity.

## Shapes

The shape language is controlled and sophisticated. Containers and cards use a **12px to 16px radius** to soften the technical nature of the data.

- **Cards/Containers:** 12px default, 16px for large dashboard sections.
- **Buttons/Inputs:** 8px to maintain a precise, interactive feel.
- **Chips:** Fully rounded (pill) for status indicators to contrast against the rectangular grid.

## Components

- **Buttons:** The primary action button uses a solid background of `#1A73E8` with white text. Secondary buttons are outlined using the `#2D2F34` border with `#8AB4F8` text.
- **Input Fields:** Background matches the surface level (`#1E1F22`). Active state is indicated by a 1px `#8AB4F8` border and a subtle inner glow. Labels use the `label-md` Geist font.
- **Cards:** Always feature a 1px border of `#2D2F34`. Content should have 24px internal padding.
- **Navigation:** A sleek dark bottom bar for mobile using `#131314` with a subtle top border. Icons use `#8AB4F8` for active states and `#9AA0A6` for inactive states.
- **Data Tables:** Use a header background of `#212327`. Rows are separated by 1px `#2D2F34` lines. Typography for numeric data should use the `mono-sm` Geist style for tabular alignment.
- **Status Chips:** Small, low-contrast pills. For example, "Paid" uses a dark green background with `#C4EED0` text.
