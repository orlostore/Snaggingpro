# SnaggingPro marketing flyers

Standalone HTML flyers (not part of the app). Each one is print-ready
A4 portrait, single page.

| File                  | Language | Phone              |
|-----------------------|----------|--------------------|
| `flyer-en-sohan.html` | English  | +971 52 132 4918   |
| `flyer-en-orlo.html`  | English  | +971 55 547 7206   |
| `flyer-ar-sohan.html` | Arabic   | +971 52 132 4918   |
| `flyer-ar-orlo.html`  | Arabic   | +971 55 547 7206   |

The `sohan` / `orlo` suffix is for internal filing only — no contact
name is rendered on the flyer itself.

`_template-en.html` and `_template-ar.html` are the base templates. To
regenerate, edit the template and run from this folder:

```
sed 's|__PHONE__|+971 52 132 4918|g' _template-en.html > flyer-en-sohan.html
sed 's|__PHONE__|+971 55 547 7206|g' _template-en.html > flyer-en-orlo.html
sed 's|__PHONE__|+971 52 132 4918|g' _template-ar.html > flyer-ar-sohan.html
sed 's|__PHONE__|+971 55 547 7206|g' _template-ar.html > flyer-ar-orlo.html
```

## Printing to PDF

1. Open the `.html` in Chrome (drag-and-drop into the address bar).
2. ⌘P (Mac) / Ctrl+P (Windows).
3. Destination: **Save as PDF**.
4. Paper: **A4**.
5. Margins: **None**.
6. Scale: **Default**.
7. **Background graphics: ON** (this is critical — without it the brand
   colours and badges don't render).
8. Save.
