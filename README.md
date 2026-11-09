# Connext for present

Current release: **v1.15.3**

Standalone retail presentation dashboard. Serve this repository root using a local static web server, then open `index.html` in Chrome or Edge. No build step is required.

Load CSV files 1–5 from your local data folder. Optional files add product groups, customer volume, promotion performance, and item-size detail (`10_item_size.csv`). Business CSV files are not included in this repository.

## Latest features

- Eight report pages, including Product Group by Item after Product Groups by Region.
- Item-size tables: Top/Bottom 3 eligible size groups, ordered by supplied item ranks; up to 10 items per group and 15 per table.
- Class export: Subclass Total pages 1–2 first, then pages 1, 3–8 for the subclasses confirmed in the selection dialog.
- Movable and resizable charts, independent X/Y scaling, floating font controls, grid/alignment tools, and portable `display_template.js` layouts.
- Product trend lines: Single solid, Family dotted, Multi dashed, Bundle grey dash-dot; matching legends.
- Store names: left aligned, one line, tail clipped, left anchor preserved during horizontal scaling.

## PowerPoint export

Choose your local PowerPoint file with **Template PPTX**, then click **Export PowerPoint**. The business PowerPoint template is intentionally not distributed in this public repository. Capture and image copy do not require that template.

Release source: Connext Site commit `63ae2cf11aae16fb50405f508d10100793092816`.
