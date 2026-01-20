# FeedbackFlow Design System

## Brand Identity

FeedbackFlow uses a **retro-modern aesthetic** - clean, bold, with a hint of nostalgia. Think developer tool meets vintage print design.

### Tone

- **Direct** - No fluff, say what it does
- **Slightly irreverent** - "We see everything. Even the bugs you hid."
- **Developer-friendly** - Speaks to people who ship fast

---

## Colors

### Primary Palette

```css
:root {
  --retro-paper: #f7f5f0; /* Background, cards */
  --retro-black: #1a1a1a; /* Text, borders, primary buttons */
  --retro-yellow: #f3c952; /* Accents, highlights, brand */
  --retro-red: #e85d52; /* Errors, high priority, bugs */
  --retro-blue: #6b9ac4; /* Links, info, active states */
  --retro-lavender: #d4c4e8; /* Secondary accents, tags */
  --retro-peach: #f4a261; /* Warnings, medium priority */
}
```

### Extended Palette

```css
:root {
  /* Page background (slightly darker than paper) */
  --bg-page: #e8e6e1;

  /* Stone variants for subtle UI */
  --stone-50: #fafaf9;
  --stone-100: #f5f5f4;
  --stone-200: #e7e5e4;
  --stone-300: #d6d3d1;
  --stone-400: #a8a29e;
  --stone-500: #78716c;
  --stone-600: #57534e;

  /* Status colors */
  --status-new: var(--retro-blue);
  --status-triaging: var(--retro-yellow);
  --status-drafted: var(--retro-lavender);
  --status-exported: var(--stone-400);
  --status-resolved: #22c55e;
}
```

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        "retro-paper": "#F7F5F0",
        "retro-black": "#1a1a1a",
        "retro-yellow": "#F3C952",
        "retro-red": "#E85D52",
        "retro-blue": "#6B9AC4",
        "retro-lavender": "#D4C4E8",
        "retro-peach": "#F4A261",
      },
    },
  },
};
```

---

## Typography

### Fonts

```css
/* Primary - UI text */
font-family: "Inter", sans-serif;

/* Mono - Code, IDs, technical info */
font-family: "JetBrains Mono", monospace;
```

### Scale

| Name    | Size    | Weight  | Use                  |
| ------- | ------- | ------- | -------------------- |
| Display | 5xl-9xl | 500     | Hero headlines       |
| H1      | 3xl-4xl | 500     | Page titles          |
| H2      | 2xl     | 500     | Section headers      |
| H3      | xl      | 500     | Card titles          |
| Body    | base    | 400     | Paragraphs           |
| Small   | sm      | 400     | Secondary text       |
| Tiny    | xs      | 400-700 | Labels, badges       |
| Mono    | xs-sm   | 400-500 | IDs, code, technical |

### Tracking

- Headlines: `tracking-tighter` (-0.05em)
- Body: `tracking-tight` (-0.025em) or default
- Uppercase labels: `tracking-wider` or `tracking-widest`

---

## Borders & Shadows

### The Retro Box

The signature look uses **thick borders** and **offset shadows**.

```html
<!-- Standard card -->
<div class="border-retro-black border-2 bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
  Content
</div>

<!-- Hover state - shadow shrinks, element shifts -->
<div
  class="border-retro-black border-2 bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
>
  Interactive card
</div>

<!-- Large shadow variant -->
<div class="border-retro-black border-2 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
  Hero element
</div>
```

### Colored Shadows

```html
<!-- Yellow accent -->
<button class="shadow-[6px_6px_0px_0px_#F3C952]">Action</button>

<!-- Red accent -->
<button class="shadow-[6px_6px_0px_0px_#E85D52]">Danger</button>

<!-- Blue accent -->
<button class="shadow-[6px_6px_0px_0px_#6B9AC4]">Info</button>
```

### Dividers

Use `divide-x-2` or `divide-y-2` with `divide-retro-black` for grid layouts.

---

## Components

### Buttons

```html
<!-- Primary (Black) -->
<button
  class="bg-retro-black border-retro-black border-2 px-6 py-3 font-medium text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]"
>
  Primary Action
</button>

<!-- Secondary (Outline) -->
<button
  class="text-retro-black border-retro-black border-2 bg-white px-6 py-3 font-medium transition-all hover:bg-stone-50"
>
  Secondary Action
</button>

<!-- Pill button -->
<button
  class="bg-retro-black rounded-full px-5 py-2 text-white transition-all hover:scale-105 hover:bg-stone-800"
>
  <span>Get Access</span>
  <iconify-icon icon="solar:arrow-right-linear"></iconify-icon>
</button>

<!-- Icon button -->
<button
  class="rounded border border-transparent p-2 transition-colors hover:border-stone-200 hover:bg-stone-100"
>
  <iconify-icon icon="solar:settings-linear" width="20"></iconify-icon>
</button>
```

### Cards

```html
<!-- Feature card -->
<div
  class="border-retro-black border-2 bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
>
  <div
    class="bg-retro-blue/20 text-retro-blue border-retro-blue mb-4 flex h-12 w-12 items-center justify-center rounded-full border"
  >
    <iconify-icon icon="solar:camera-linear" width="24"></iconify-icon>
  </div>
  <h3 class="mb-2 text-xl font-medium tracking-tight">Feature Title</h3>
  <p class="text-sm text-stone-600">Description text goes here.</p>
</div>

<!-- Feedback ticket card -->
<div
  class="hover:border-retro-black cursor-pointer border-2 border-transparent bg-white p-4 transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
>
  <!-- Content -->
</div>

<!-- Active/selected ticket -->
<div
  class="border-retro-blue translate-x-[2px] translate-y-[2px] border-2 bg-white p-4 shadow-[4px_4px_0px_0px_#6B9AC4]"
>
  <!-- Content -->
</div>
```

### Badges & Tags

```html
<!-- Priority badges -->
<span
  class="text-retro-red bg-retro-red/10 border-retro-red/20 rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase"
>
  High Priority
</span>

<span
  class="text-retro-peach bg-retro-peach/10 border-retro-peach/20 rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase"
>
  Medium
</span>

<span
  class="rounded border border-stone-200 bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-stone-500 uppercase"
>
  Low
</span>

<!-- Type badges -->
<span
  class="text-retro-red bg-retro-red/10 border-retro-red/20 rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase"
>
  Bug
</span>

<span
  class="text-retro-blue bg-retro-blue/10 border-retro-blue/20 rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase"
>
  Feature
</span>

<!-- Metadata tags -->
<span
  class="border-retro-black border bg-white px-2 py-1 font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
>
  iPhone 14
</span>
```

### Inputs

```html
<!-- Text input -->
<input
  type="text"
  class="focus:border-retro-black w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-3 text-sm transition-colors outline-none"
  placeholder="Enter text..."
/>

<!-- Search input with icon -->
<div class="relative">
  <iconify-icon
    icon="solar:magnifer-linear"
    class="absolute top-1/2 left-3 -translate-y-1/2 text-stone-400"
  >
  </iconify-icon>
  <input
    type="text"
    class="focus:border-retro-black w-48 rounded-full border-2 border-stone-200 bg-stone-50 py-1.5 pr-4 pl-9 text-sm transition-colors outline-none"
    placeholder="Search..."
  />
</div>

<!-- Chat/message input -->
<div class="relative">
  <input
    type="text"
    class="focus:border-retro-blue w-full rounded border-2 border-stone-200 bg-stone-50 py-3 pr-10 pl-4 text-sm transition-colors outline-none"
    placeholder="Type a message..."
  />
  <button
    class="hover:text-retro-blue absolute top-1/2 right-2 -translate-y-1/2 p-1.5 text-stone-400"
  >
    <iconify-icon icon="solar:plain-3-linear" width="20"></iconify-icon>
  </button>
</div>
```

### Filter Pills

```html
<!-- Filter pill (active) -->
<button class="rounded px-2 py-1 font-mono text-xs bg-retro-black text-white transition-colors">
  All (12)
</button>

<!-- Filter pill (inactive) -->
<button class="rounded px-2 py-1 font-mono text-xs bg-stone-100 text-stone-600 transition-colors hover:bg-stone-200">
  Bugs
</button>

<!-- Filter pill group -->
<div class="flex gap-2">
  <button class="rounded px-2 py-1 font-mono text-xs bg-retro-black text-white">All (12)</button>
  <button class="rounded px-2 py-1 font-mono text-xs bg-stone-100 text-stone-600 hover:bg-stone-200">Bugs</button>
  <button class="rounded px-2 py-1 font-mono text-xs bg-stone-100 text-stone-600 hover:bg-stone-200">Features</button>
</div>
```

### Navigation

```html
<!-- Sidebar nav item (active) -->
<a
  href="#"
  class="bg-retro-lavender/30 text-retro-black border-retro-lavender flex items-center gap-3 rounded border px-3 py-1.5 text-sm font-medium"
>
  <iconify-icon icon="solar:inbox-linear" width="18"></iconify-icon>
  Inbox
</a>

<!-- Sidebar nav item (inactive) -->
<a
  href="#"
  class="hover:text-retro-black flex items-center gap-3 rounded px-3 py-1.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100"
>
  <iconify-icon icon="solar:bookmark-linear" width="18"></iconify-icon>
  Backlog
</a>

<!-- Project item (active) -->
<button
  class="border-retro-black flex w-full items-center gap-3 border-2 bg-white px-3 py-2 text-left shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
>
  <div class="bg-retro-blue h-2 w-2 animate-pulse rounded-full"></div>
  <span class="truncate text-sm font-medium">Project Name</span>
  <span class="ml-auto border border-stone-200 bg-stone-100 px-1 font-mono text-xs">12</span>
</button>
```

### Status Indicators

```html
<!-- Online/active pulse -->
<div class="bg-retro-blue h-2 w-2 animate-pulse rounded-full"></div>
<div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>

<!-- Status dot (static) -->
<div class="h-2 w-2 rounded-full bg-stone-300"></div>

<!-- Checkbox status -->
<div
  class="border-retro-black bg-retro-red flex h-4 w-4 items-center justify-center rounded-full border"
>
  <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
</div>
```

---

## Layout Patterns

### Grid with Borders

```html
<div
  class="divide-retro-black border-retro-black grid grid-cols-1 divide-y-2 border-2 lg:grid-cols-12 lg:divide-x-2 lg:divide-y-0"
>
  <div class="p-8 lg:col-span-8">Left content</div>
  <div class="bg-retro-blue p-8 lg:col-span-4">Right sidebar</div>
</div>
```

### Dashboard Layout

```html
<!-- Outer wrapper with retro background -->
<div class="flex h-screen flex-col bg-[#e8e6e1] p-2 font-sans antialiased overflow-hidden">
  <!-- Main application shell with retro border and shadow -->
  <div class="mx-auto flex w-full max-w-[1800px] flex-1 flex-col overflow-hidden border-2 border-retro-black bg-retro-paper shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] md:flex-row">

    <!-- Left sidebar -->
    <aside class="flex w-64 flex-shrink-0 flex-col border-b-2 border-retro-black bg-stone-50 md:border-b-0 md:border-r-2">
      <!-- Brand -->
      <div class="flex items-center gap-2 border-b-2 border-retro-black bg-retro-yellow p-4">
        <iconify-icon icon="solar:infinite-linear" width="24"></iconify-icon>
        <span class="text-sm font-bold uppercase tracking-tight">Feedback Flow</span>
      </div>
      <!-- Projects & Nav -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6">Navigation</div>
      <!-- User -->
      <div class="border-t-2 border-retro-black bg-white p-4">User info</div>
    </aside>

    <!-- Main content -->
    <main class="flex min-w-0 flex-1 flex-col bg-stone-100">
      <header class="flex h-16 flex-shrink-0 items-center justify-between border-b-2 border-retro-black bg-white px-6">
        <!-- Title + Filter pills -->
        <div class="flex items-center gap-4">
          <h1 class="text-lg font-semibold tracking-tight">Inbox</h1>
          <div class="h-6 w-px bg-stone-300"></div>
          <div class="flex gap-2">
            <button class="rounded px-2 py-1 font-mono text-xs bg-retro-black text-white">All (12)</button>
            <button class="rounded px-2 py-1 font-mono text-xs bg-stone-100 text-stone-600">Bugs</button>
          </div>
        </div>
        <!-- Search + Actions -->
        <div class="flex items-center gap-3">Search, Sort</div>
      </header>
      <div class="flex-1 overflow-y-auto p-4">Content</div>
    </main>

    <!-- Right sidebar (desktop) -->
    <aside class="relative z-10 hidden w-[480px] flex-shrink-0 flex-col border-l-2 border-retro-black bg-retro-paper lg:flex">
      <!-- Panel header -->
      <div class="flex h-16 items-center justify-between border-b-2 border-retro-black bg-white px-6">
        <span class="font-mono text-lg font-bold">#402</span>
        <div class="flex gap-2">Action buttons</div>
      </div>
      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">Detail content</div>
      <!-- Footer with actions -->
      <div class="z-20 space-y-3 border-t-2 border-retro-black bg-white p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        Export buttons
      </div>
    </aside>

  </div>
</div>
```

### Section with Label

```html
<div class="relative border border-stone-200 bg-stone-50 p-6">
  <div
    class="absolute -top-3 left-1/2 -translate-x-1/2 border border-stone-200 bg-white px-2 font-mono text-xs text-stone-400"
  >
    LABEL
  </div>
  Content
</div>
```

---

## Icons

Use **Solar Icons** via Iconify.

```html
<script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"></script>

<!-- Usage -->
<iconify-icon icon="solar:camera-linear" width="24" height="24"></iconify-icon>
<iconify-icon icon="solar:bug-linear" width="20"></iconify-icon>
<iconify-icon icon="solar:magic-stick-3-linear" width="16"></iconify-icon>
```

### Common Icons

| Purpose    | Icon                                                   |
| ---------- | ------------------------------------------------------ |
| Screenshot | `solar:camera-linear`                                  |
| Record     | `solar:record-linear`                                  |
| Bug        | `solar:bug-linear`                                     |
| Feature    | `solar:lightbulb-linear`                               |
| AI         | `solar:magic-stick-3-linear` or `solar:robot-2-linear` |
| Settings   | `solar:settings-linear`                                |
| Export     | `solar:export-linear`                                  |
| Linear     | `solar:ticket-linear`                                  |
| Notion     | `solar:notes-linear`                                   |
| JSON       | `solar:code-file-linear`                               |
| Search     | `solar:magnifer-linear`                                |
| Close      | `solar:close-square-linear`                            |
| Arrow      | `solar:arrow-right-linear`                             |
| Check      | `solar:check-square-linear`                            |
| User       | `solar:user-circle-linear`                             |
| Team       | `solar:users-group-rounded-linear`                     |

---

## Animations

### Hover Interactions

```css
/* Shadow shrink + translate */
.hover-card {
  @apply shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)];
}

/* Scale up */
.hover-grow {
  @apply transition-transform hover:scale-105;
}

/* Rotate icon */
.hover-rotate {
  @apply transition-transform hover:rotate-90;
}
```

### Loading States

```html
<!-- Spinner (for buttons) -->
<iconify-icon icon="solar:spinner-linear" class="animate-spin"></iconify-icon>

<!-- Pulse (for indicators) -->
<div class="bg-retro-blue h-2 w-2 animate-pulse rounded-full"></div>

<!-- AI processing indicator -->
<div
  class="bg-retro-black/10 border-retro-black/20 flex items-center gap-3 rounded border p-3 font-mono text-xs"
>
  <iconify-icon icon="solar:magic-stick-3-linear" class="animate-spin"></iconify-icon>
  <span>AI processing...</span>
</div>
```

---

## Responsive Breakpoints

```css
/* Mobile first */
sm: 640px   /* Tablet */
md: 768px   /* Tablet landscape */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Common Patterns

```html
<!-- Stack on mobile, row on desktop -->
<div class="flex flex-col gap-4 md:flex-row">
  <!-- Hide on mobile, show on desktop -->
  <aside class="hidden lg:flex">
    <!-- Full width mobile, constrained desktop -->
    <div class="w-full md:w-auto md:max-w-md">
      <!-- Responsive grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"></div>
    </div>
  </aside>
</div>
```

---

## Component Checklist

When building components, ensure:

- [ ] Matches retro design aesthetic
- [ ] Uses correct colors from palette
- [ ] Has proper border (2px black where appropriate)
- [ ] Has shadow effect where appropriate
- [ ] Has hover state for interactive elements
- [ ] Uses Inter for text, JetBrains Mono for code/IDs
- [ ] Is responsive (mobile-first)
- [ ] Uses Solar icons consistently
- [ ] Has loading state if async
- [ ] Has error state if applicable
