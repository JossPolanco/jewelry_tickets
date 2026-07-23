---
trigger: manual
---

# design-rules: UI/UX Development Rule

Whenever I ask for UI, UX, components, pages, layouts, redesigns, improvements, or visual changes for this project, always follow these guidelines unless I explicitly specify otherwise.

---

# Project Context

This project is a **private web application built for a specific local jewelry repair and crafting business**, designed with a **SaaS/Template modular architecture** in mind for future white-label reusability.

The primary user of this application is a craftsman/jeweler who is **not tech-savvy** and uses the app on a mobile phone/tablet directly at the counter while interacting with customers.

Key Context Pillars:
* **Target User:** Low digital literacy. High need for large touch targets, clear text, guided flows (wizards), and zero visual clutter.
* **Core Task:** Fast service order intake (<2 mins), registering item types, recording exact weights in grams, taking photos, capturing finger signatures, and sending digital receipts via WhatsApp.
* **Dual Device Need:** Primary usage on **smartphones/tablets**, but must scale clean, elegantly, and full-screen on **desktop/laptops**.

The experience should feel:
* Clean
* Premium & Elegant (Jewelry aesthetic)
* Highly Readable
* Direct & Uncluttered
* Trustworthy

---

# Technology Stack

Always assume the project uses:

* **ReactJS**
* **Vite**
* **TailwindCSS** (v4 setup)
* **DaisyUI**
* **Lucide React**
* **Reicon**

Unless explicitly requested, never recommend:
* Bootstrap, Material UI, Chakra UI, Ant Design, Bulma, Semantic UI, or other external CSS frameworks.

---

# Theme & Palette Architecture (Aurora Theme)

The application uses the custom **Aurora** theme as default light theme, alongside DaisyUI theme tokens.

### Layering & Background Strategy:
1. **`bg-base-300` (`#dce7f3` / `#161d27`):** App Root / Main background canvas. Gives depth behind cards.
2. **`bg-base-100` (`#edf3fb` / `#273242`):** Surfaces, Cards, Headers, Modals, Drawers, and Interactive Panels.
3. **`border-base-200` (`#ffffff` / `#1d2632`):** Standard borders, dividers, subtle outlines, and input containers.

### Color Tokens:
* **Primary:** `oklch(45% 0.24 277.023)` (Deep Royal Blue / Purple Accent for primary CTA buttons)
* **Secondary:** `oklch(65% 0.241 354.308)`
* **Accent:** `oklch(77% 0.152 181.912)`
* **Neutral / Content:** `oklch(21% 0.006 285.885)` (High contrast text for effortless reading)

Never hardcode HEX or RGB colors in utility classes when theme variables (`bg-base-100`, `text-primary`, `border-base-200`) are available.

---

# Mobile First & Desktop Adaptability

* **Mobile First:** Every layout, modal, and flow must be designed for 360px–430px screens first.
* **Non-Tech User UX:**
  * Inputs must have high visual contrast and distinct boundaries (`border-base-200`).
  * Big, readable typography (`text-base`, `text-lg` minimum for input labels).
  * Big primary action buttons (min height `h-12` / `h-14` on mobile).
* **Desktop Scaling:** On desktop (`md:` / `lg:` breakpoints), the app should not look like an oversized phone stretched out endlessly. Wrap desktop views in centered max-width containers (`max-w-5xl`, `max-w-7xl`) or clean multi-column layouts while keeping the mobile simplicity.

---

# Touch Experience & Interactions

* Buttons & clickable items must have a minimum touch target of **44×44 pixels**.
* Avoid hover-only interactions (`hover:`). On mobile, rely on active states (`active:scale-95`, `active:border-primary`).
* Desktop hover states MUST be wrapped with responsive media flags (e.g., `md:hover:bg-base-200`).
* Use bottom-sheets or full-screen DaisyUI modals on mobile instead of small dropdown menus.

---

# Design Philosophy & Minimalism

Every UI decision should prioritize:
* **Clarity over decorative complexity:** The jeweler should never wonder "Where do I click next?".
* **Guided Steppers/Wizards:** For creating service orders, prefer step-by-step flows over massive 20-field form screens.
* **Immediate Feedback:** Instant visual indicators for photo uploads, signature captures, and save operations.

Avoid:
* Cluttered admin dashboards with unnecessary graphs.
* Complex nested menus.
* Small icons without text labels (non-tech users need text labels next to icons).

---

# Components & Code Guidelines

* Prefer native DaisyUI components (`btn`, `card`, `modal`, `badge`, `drawer`, `input`, `steps`, `toast`).
* **Component Organization:**
  * Feature-specific components go inside their feature folder (e.g., `src/components/orders/OrderSignature.jsx`).
  * Shared/General components stay in the root `src/components/` directory.
* **Modal Rule:** Creation and editing forms should consistently reside inside **Modal** or **Drawer** components.
* **Alert Rule:** Don't use the native browser alert, instead use the **Alert** component.
* **Toast Rule:** When a creation, editing or deleting form is actioned, use the Toast component to give feedback about the action.

---

# Animations

Subtle, non-distracting CSS/Utility animations:
* `.animate-fade-in` (0.2s fade)
* `.animate-slide-up` (0.25s entrance)
* `.animate-scale-in` (0.15s modal spring)

Avoid heavy JS-based layout animations that slow down low-end mobile devices.

---

# UX States & Performance

Every single view or feature component must handle 5 states explicitly:
1. **Loading State:** Skeleton screens or DaisyUI spinners (`loading-spinner`).
2. **Empty State:** Friendly illustrations/icons + clear "Create New" action button.
3. **Error State:** Clear inline message in human language (not raw DB error codes).
4. **Success State:** Instant toast feedback or confirmation screen.
5. **Disabled State:** Visual opacity reduction on processing buttons to avoid double-tapping.

---

# Response Guidelines

When generating UI, UX, components, or screens for this project:
1. Explain how the proposal benefits a low-tech craftsman user.
2. Ensure strict alignment with the `bg-base-300` (root background) vs `bg-base-100` (cards/surfaces) layer structure.
3. Always start code snippets from the Mobile view layout before desktop.
4. Keep the code modular, readable, and Tailwind CSS v4 compliant.