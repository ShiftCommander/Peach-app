## 2024-07-01 - Add ARIA expanded and controls to help toggles
**Learning:** Screen reader users need context about what a button controls (`aria-controls`) and whether that content is currently visible (`aria-expanded`), especially for custom popover implementations that do not use native `<dialog>` elements or `popover` attributes.
**Action:** When implementing custom toggles or dropdowns, always ensure `aria-expanded` and `aria-controls` are added to the HTML and dynamically updated in JavaScript alongside the visual state.
