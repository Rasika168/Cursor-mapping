# Design Guidelines: Interactive Freeform Gradient Canvas Tool

## Design Approach: Professional Design Tool System

**Selected Approach:** Design System - inspired by Figma, Linear, and Adobe Creative Suite
**Rationale:** This is a utility-focused professional design tool requiring precision, efficiency, and stability. The interface must support complex interactions while maintaining clarity and performance.

**Core Principles:**
- Precision over decoration: Every pixel serves functionality
- Dark theme for extended use and canvas focus
- Immediate visual feedback for all interactions
- Consistent, learnable patterns across all controls

---

## Color Palette

### Dark Theme Foundation
**Canvas Background:** `#333333` (Studio Grey - as specified)
**App Background:** `217 15% 12%` (Darker charcoal for UI chrome)
**Panel Background:** `217 15% 16%` (Subtle elevation)
**Border/Divider:** `217 10% 25%` (Low-contrast separation)

### Interactive Elements
**Primary Action:** `210 90% 58%` (Vibrant blue for main actions)
**Selected State:** `210 90% 62%` (Lighter blue for active selections)
**Hover State:** `210 85% 50%` (Darker blue for hover)
**Danger/Delete:** `0 75% 55%` (Red for destructive actions)

### Gradient Nodes
**Node Stroke:** `0 0% 100%` (White ring for visibility)
**Influence Overlay:** `210 90% 58%` at 15% opacity (Subtle blue glow)
**Selection Ring:** `210 100% 65%` (Bright blue for selected nodes)

### Text Hierarchy
**Primary Text:** `0 0% 98%` (Near-white for labels)
**Secondary Text:** `0 0% 70%` (Medium grey for descriptions)
**Disabled Text:** `0 0% 45%` (Low-contrast for inactive)

---

## Typography

**Font Stack:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

**Scale:**
- Tool Labels: 13px, medium weight (500)
- Panel Headers: 14px, semibold (600)
- Input Values: 12px, regular (400), monospace for hex/RGB
- Tooltips: 11px, regular (400)
- Property Names: 11px, medium (500), uppercase, letter-spacing: 0.5px

**Line Heights:** 1.5 for readability in compact panels

---

## Layout System

**Spacing Primitives:** Use Tailwind units of `2, 3, 4, 6, 8` exclusively
- Component padding: `p-3` or `p-4`
- Section gaps: `gap-4` or `gap-6`
- Icon margins: `mr-2` or `ml-2`
- Panel spacing: `space-y-4`

**Grid System:**
- Canvas: Full viewport minus fixed sidebars
- Left Sidebar: 240px fixed width for tools
- Right Panel: 280px fixed width for properties (collapsible)
- Top Toolbar: 48px height with main actions

---

## Component Library

### Canvas & Grid
- **Background:** Studio grey `#333333` with subtle grid lines at 20px intervals
- **Grid Lines:** `#404040` at 0.5px stroke weight
- **Zoom Indicator:** Bottom-right corner, 12px text, `bg-black/40` backdrop blur

### Gradient Nodes
- **Size:** 16px diameter circles (8px inner fill + 4px stroke)
- **Default State:** White stroke, color fill, subtle drop-shadow (0 2px 4px rgba(0,0,0,0.3))
- **Hover State:** Scale to 18px, increase shadow to (0 4px 8px rgba(0,0,0,0.4))
- **Selected State:** 20px diameter, blue selection ring, influence overlay visible
- **Influence Handle:** 8px circle on radius edge, blue fill

### Color Picker Panel
- **Position:** Floating 320px × 400px panel near selected node
- **Sections:** Color swatch grid (top), HSB sliders (middle), HEX/RGB inputs (bottom)
- **Input Style:** Dark background `#2a2a2a`, 1px border `#404040`, rounded corners `4px`

### Controls & Inputs
- **Sliders:** 4px track height, 16px circular thumb, blue fill for active range
- **Number Inputs:** 60px width, right-aligned text, increment arrows on hover
- **Dropdowns:** Full-width, chevron icon, 8px padding, max-height 240px scroll
- **Buttons:** 32px height, 8px horizontal padding, rounded `6px`

### Context Menus
- **Background:** `217 15% 18%` with 8px border-radius
- **Items:** 32px height, 12px padding, hover bg `217 15% 22%`
- **Dividers:** 1px solid `217 10% 25%`, 4px vertical margin

### Tooltips
- **Background:** `rgba(0, 0, 0, 0.9)` with backdrop blur
- **Position:** 8px offset from trigger element
- **Padding:** 6px horizontal, 4px vertical
- **Arrow:** 4px centered triangle

---

## Interaction Patterns

### Dragging & Movement
- **Cursor:** Grab cursor on nodes, grabbing while dragging
- **Constraint:** Nodes snap to pixel grid when shift-key held
- **Visual Feedback:** Ghost outline shows final position during drag

### Selection States
- Single-click: Select node, show properties panel
- Shift-click: Multi-select nodes
- Click canvas: Deselect all, close properties panel

### Keyboard Shortcuts
- Arrow keys: Move selected node by 1px (10px with shift)
- Delete/Backspace: Remove selected nodes
- Cmd/Ctrl+Z: Undo, Cmd/Ctrl+Shift+Z: Redo
- Cmd/Ctrl+D: Duplicate selected node

---

## Accessibility & Touch

- **Minimum Touch Targets:** 44px × 44px for all interactive elements
- **Focus Indicators:** 2px blue outline with 2px offset on keyboard focus
- **Tooltips:** Appear on hover after 500ms, on focus immediately
- **ARIA Labels:** All icons and controls properly labeled
- **Keyboard Navigation:** Full tab order through all controls

---

## Animation Philosophy

**Minimize Motion:** Professional tools prioritize stability
- **Allowed:** Smooth 150ms ease transitions for hover states, 200ms for panel open/close
- **Avoid:** Decorative animations, bounces, complex keyframes
- **Exception:** Real-time gradient rendering updates instantly (no animation)

---

## Export Overlays

When export dialog appears:
- **Modal Backdrop:** `rgba(0, 0, 0, 0.7)` with backdrop blur
- **Dialog:** 480px width, centered, white background for preview
- **Options:** Checkboxes for "Include overlays", "Include grid"
- **Format Buttons:** Radio group for PNG/SVG/PDF selection

---

## Images

**No hero images needed** - this is a professional application tool, not a marketing site. The canvas itself is the primary visual focus.