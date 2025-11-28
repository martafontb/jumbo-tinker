# Tinker - Shopify Theme Development Guide

## Architecture Overview

This is **Tinker**, a modern Shopify theme built with a component-based architecture. The theme uses:
- **Liquid templates** for server-side rendering
- **Web Components** (Custom Elements) for client-side interactivity
- **Inline CSS** using `{% stylesheet %}` blocks for component-scoped styles
- **View Transitions API** for smooth page navigation

### Key Structural Patterns

**Sections vs Blocks vs Snippets:**
- `sections/`: Top-level page sections with schema definitions (e.g., `section.liquid`, `hero.liquid`)
- `blocks/`: Reusable components that nest within sections, prefixed with `_` when internal (e.g., `_content.liquid`, `_heading.liquid`)
- `snippets/`: Render-only partials without schemas, used via `{% render %}` (e.g., `group.liquid`, `section.liquid`)

**Content Composition Pattern:**
The theme uses a novel `{% content_for 'blocks' %}` pattern for nested block composition:
```liquid
{% capture children %}
  {% content_for 'blocks' %}
{% endcapture %}
{% render 'group', children: children, settings: block.settings %}
```
This enables flexible, hierarchical layouts without tight coupling.

## Component Architecture

### JavaScript Components (Web Components)

All interactive components extend the base `Component` class from `assets/component.js`:

```javascript
import { Component } from '@theme/component';

class MyComponent extends Component {
  // Refs automatically collected from [ref="name"] attributes
  refs = {}; 
  
  // Define required refs that must exist
  requiredRefs = ['button', 'panel'];
}
customElements.define('my-component', MyComponent);
```

**Key Component Features:**
- **Declarative event binding:** Use `on:click="MyComponent/handleClick"` attributes instead of `addEventListener`
- **Auto-ref management:** Elements with `ref="name"` are auto-collected into `this.refs.name`
- **Array refs:** Use `ref="items[]"` for multiple elements collected as `this.refs.items`
- **Scoped styles:** Components use `{% stylesheet %}` blocks that compile to scoped CSS

**Import Path Alias:**
Use `@theme/*` alias to import from `assets/` (configured in `assets/jsconfig.json`):
```javascript
import { requestIdleCallback } from '@theme/utilities';
```

### Liquid Documentation Pattern

Snippets use `{%- doc -%}` blocks for inline documentation:
```liquid
{%- doc -%}
  Renders block content for groups.
  
  @param {string} children - The DOM content of the group block.
  @param {object} settings - The settings of the group block.
  @param {string} shopify_attributes - Shopify editor attributes.
{%- enddoc -%}
```

## Styling System

### CSS Custom Properties Approach

The theme uses a sophisticated CSS variable system generated from Liquid settings:

**Spacing:** `snippets/spacing-style.liquid` generates responsive spacing with automatic scaling:
```liquid
<div class="spacing-style" style="{% render 'spacing-style', settings: section.settings %}">
```
Generates: `--padding-block-start: max(20px, calc(var(--spacing-scale) * 48px));`

**Layout:** `snippets/layout-panel-style.liquid` generates flex layout variables:
- Handles `horizontal_alignment`, `vertical_alignment`, `content_direction`
- Adjusts properties based on mobile/desktop breakpoints

**Common Pattern:**
```liquid
<div 
  class="section border-style spacing-style size-style"
  style="
    {% render 'border-override', settings: settings %}
    {% render 'spacing-style', settings: settings %}
    {% render 'size-style', settings: settings %}
  "
>
```

### Inline Stylesheets

Use `{% stylesheet %}` blocks for component-scoped CSS that compiles inline:
```liquid
{% stylesheet %}
  .my-component {
    display: flex;
  }
{% endstylesheet %}
```

## Schema Conventions

### Section/Block Schema Structure

All sections and blocks include JSON schema ending with `{% schema %}...{% endschema %}`:

**Common Settings Pattern:**
```json
{
  "type": "range",
  "id": "padding-block-start",
  "label": "t:settings.top",
  "min": 0,
  "max": 100,
  "step": 1,
  "unit": "px",
  "default": 0
}
```

**Translation Keys:** Use `t:` prefix for all user-facing strings (e.g., `"label": "t:settings.alignment"`)

**Block Type Conventions:**
- `@theme`: Allows all theme blocks
- `@app`: Allows app blocks
- `_blockname`: Internal blocks prefixed with underscore (e.g., `_content`, `_heading`)

## Critical Files

### Main Entry Points
- `layout/theme.liquid`: Main layout, includes `{% sections 'header-group' %}` and `{% sections 'footer-group' %}`
- `assets/critical.js`: Parser-blocking script for essential functionality
- `assets/global.d.ts`: TypeScript definitions for Shopify and Theme globals

### Utility Systems
- `assets/utilities.js`: View Transitions API helpers, `requestIdleCallback`, animation utilities
- `assets/component.js`: Base web component class with ref management and declarative events
- `snippets/section.liquid`: Universal section wrapper rendering

## Development Workflows

### Adding New Components

1. **JavaScript Component:**
   - Create `assets/my-component.js`
   - Extend `Component` class
   - Define `customElements.define('my-component', MyComponent)`
   - Use TypeScript JSDoc for type checking (enabled in `jsconfig.json`)

2. **Liquid Block:**
   - Create `blocks/_my-block.liquid` (prefix `_` for internal blocks)
   - Add `{% schema %}` with settings
   - Use `{% content_for 'blocks' %}` for nested content

3. **Snippet:**
   - Create `snippets/my-snippet.liquid`
   - Add `{%- doc -%}` block documenting parameters
   - No schema needed for snippets

### Styling Patterns

**Prefer utility snippets over custom CSS:**
- Use `spacing-style`, `layout-panel-style`, `gap-style` snippets
- Leverage CSS custom properties for theming
- Add inline `{% stylesheet %}` for component-specific styles

**Color Schemes:**
- Use `color-{{ settings.color_scheme }}` classes
- Color schemes defined in `config/settings_schema.json` color_scheme_group

### View Transitions

Pages use View Transitions API for smooth navigation:
- Configure via `data-page-transition-enabled="{{ settings.page_transition_enabled }}"`
- Special handling for product grids with `viewTransitionTypes['product-grid']` in `utilities.js`
- View transition names set dynamically: `style="view-transition-name: product-card-{{ product.id }}"`

## Common Patterns

### Product Context Passing
```liquid
{% content_for 'block', type: '_product-card', closest.product: product %}
```
Pass Shopify objects (product, collection) via `closest.` namespace for nested block access.

### Responsive Breakpoints
- Desktop-first approach with mobile overrides
- `mobile-column` class for mobile vertical layouts
- CSS variables like `--vertical-alignment-mobile` for responsive adjustments

### Theme Editor Support
- Use `{{ block.shopify_attributes }}` or `{{ section.shopify_attributes }}` for editor compatibility
- Check `{% if request.design_mode %}` for editor-specific behavior
- Special handling: `.group-block-content--design-mode` to re-enable pointer events

### Translation System
All user-facing text uses Shopify translation system:
- Schema labels: `"label": "t:settings.alignment"`
- Content: `{{ 'accessibility.skip_to_text' | t }}`
- Translations in `locales/` directory

## Type Safety

JavaScript files use JSDoc for TypeScript checking:
```javascript
/**
 * @typedef {Record<string, Element | Element[] | undefined>} Refs
 */

/** @type {Refs} */
refs = {};
```

`compilerOptions` in `assets/jsconfig.json`:
- `checkJs: true` - Enable type checking
- `strictNullChecks: true` - Enforce null safety
- `noUncheckedIndexedAccess: true` - Safe array access
