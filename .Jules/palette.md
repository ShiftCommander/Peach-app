## 2024-05-18 - Missing focus indicators for custom buttons
**Learning:** Because this app uses `button { outline: none; }` without a global `:focus-visible` fallback, any new custom button or dynamically injected button (like `.glass-help-close` or `.saved-item__menu button`) completely loses keyboard focus styling. Screen reader users and keyboard navigators might get stuck or not know where they are.
**Action:** When creating new interactive elements, always verify they have a `:focus-visible` style explicitly assigned in `styles.css` if a global rule doesn't cover them.
