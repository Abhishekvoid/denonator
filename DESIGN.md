# Design

## Theme

Light Typewriter Monospace Spec Sheet

## Colors
- **Background**: `#f6f5f0` (Warm off-white paper)
- **Foreground (Text)**: `#17150f` (Solid Dark Ink)
- **Muted text / secondary**: `#5c574a` or `#737b8c` (Charcoal / Slate gray)
- **Border**: `#d4d0c5` (Thin hairline spec dividers)
- **Primary Accent (Ink)**: `#17150f` (High-contrast typewriter prints and primary CTAs)
- **Success (Emerald)**: `#10b981` (Granted credentials and green pulses)
- **Warning (Amber)**: `#ffb000` (Temporary delegations)
- **Danger (Crimson)**: `#ef4444` (Blocked requests and voided credentials)

## Typography
- **Display Font**: `var(--font-mono)`, Geist Mono, IBM Plex Mono, monospace
- **Body Font**: `var(--font-mono)`, Geist Mono, IBM Plex Mono, monospace
- **Weight Scales**: 400 (Regular), 500 (Medium), 700 (Bold)

## Layout & Components
- **Solid Technical Lines**: Rendered with thin solid borders `#d4d0c5` and a slightly lighter background shading `#faf9f5` inside the main layout. Include a header bar with digital tabs and three status LED dots (`red`, `yellow`, `green` icons) representing terminal frames.
- **Visual Texture**: A subtle paper/digital noise texture (opacity `0.02`) overlays the entire page. CRT scanlines are disabled for optimal light contrast.
- **CTAs**: Large, solid Dark Ink rectangles (`bg-[#17150f] text-[#f6f5f0] hover:bg-[#2c2923]`) with sharp corners.
