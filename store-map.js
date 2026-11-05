(function () {
  const TILE_SIZE = 256;
  const MIN_ZOOM = 4;
  const MAX_ZOOM = 12;
  const GROUP_COLOURS = ["#1771c8", "#7b4db7", "#e07a32", "#1b9aaa", "#c49a13", "#d15163", "#2f8a58", "#5b6f8a"];

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function project(latitude, longitude, zoom) {
    const size = TILE_SIZE * 2 ** zoom;
    const lat = Math.max(-85.0511, Math.min(85.0511, latitude));
    const sin = Math.sin(lat * Math.PI / 180);
    return { x: (longitude + 180) / 360 * size, y: (.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size };
  }

  function unproject(x, y, zoom) {
    const size = TILE_SIZE * 2 ** zoom;
    const longitude = x / size * 360 - 180;
    const n = Math.PI - 2 * Math.PI * y / size;
    return { latitude: 180 / Math.PI * Math.atan(.5 * (Math.exp(n) - Math.exp(-n))), longitude };
  }

  function hashColour(value) {
    let hash = 0;
    for (const character of String(value)) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    return GROUP_COLOURS[hash % GROUP_COLOURS.length];
  }

  function growthClass(value) {
    if (!Number.isFinite(value)) return "na";
    if (value > .0005) return "positive";
    if (value < -.0005) return "negative";
    return "neutral";
  }

  function formatGrowth(value) {
    if (!Number.isFinite(value)) return "N/A";
    return `${value > 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
  }

  class InteractiveStoreMap {
    constructor(root, tiles, markers, legend) {
      this.root = root;
      this.tiles = tiles;
      this.markers = markers;
      this.legend = legend;
      this.points = [];
      this.colourMode = "format";
      this.showLabels = false;
      this.zoom = 6;
      this.center = { latitude: 13.2, longitude: 101.2 };
      this.drag = null;
      this.popup = document.createElement("div");
      this.popup.className = "store-map-popup";
      this.popup.hidden = true;
      this.root.appendChild(this.popup);
      this.bindInteractions();
      if (window.ResizeObserver) new window.ResizeObserver(() => this.render()).observe(this.root);
      else window.addEventListener("resize", () => this.render());
    }

    bindInteractions() {
      this.root.addEventListener("wheel", event => {
        event.preventDefault();
        const rect = this.root.getBoundingClientRect();
        this.zoomBy(event.deltaY < 0 ? 1 : -1, event.clientX - rect.left, event.clientY - rect.top);
      }, { passive: false });
      this.root.addEventListener("pointerdown", event => {
        if (event.target.closest("button,a")) return;
        const projected = project(this.center.latitude, this.center.longitude, this.zoom);
        this.drag = { x: event.clientX, y: event.clientY, centerX: projected.x, centerY: projected.y };
        this.root.classList.add("is-panning");
        this.root.setPointerCapture(event.pointerId);
      });
      this.root.addEventListener("pointermove", event => {
        if (!this.drag) return;
        const next = unproject(this.drag.centerX - (event.clientX - this.drag.x), this.drag.centerY - (event.clientY - this.drag.y), this.zoom);
        this.center = next;
        this.render();
      });
      const endPan = event => {
        if (!this.drag) return;
        this.drag = null;
        this.root.classList.remove("is-panning");
        if (this.root.hasPointerCapture(event.pointerId)) this.root.releasePointerCapture(event.pointerId);
      };
      this.root.addEventListener("pointerup", endPan);
      this.root.addEventListener("pointercancel", endPan);
      this.root.addEventListener("click", event => {
        const zoomButton = event.target.closest("[data-map-zoom]");
        if (zoomButton) { this.zoomBy(zoomButton.dataset.mapZoom === "in" ? 1 : -1); return; }
        const marker = event.target.closest("[data-map-point]");
        if (marker) this.showPopup(Number(marker.dataset.mapPoint));
        else if (!event.target.closest(".store-map-popup")) this.popup.hidden = true;
      });
    }

    setPoints(points) {
      this.points = points;
      this.popup.hidden = true;
      this.fit();
    }

    setColourMode(mode) {
      this.colourMode = mode;
      this.popup.hidden = true;
      this.render();
    }

    setLabels(showLabels) {
      this.showLabels = showLabels;
      this.renderMarkers();
    }

    zoomBy(delta, anchorX = this.root.clientWidth / 2, anchorY = this.root.clientHeight / 2) {
      const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.zoom + delta));
      if (nextZoom === this.zoom || !this.root.clientWidth) return;
      const oldCenter = project(this.center.latitude, this.center.longitude, this.zoom);
      const geographicAnchor = unproject(oldCenter.x + anchorX - this.root.clientWidth / 2, oldCenter.y + anchorY - this.root.clientHeight / 2, this.zoom);
      const nextAnchor = project(geographicAnchor.latitude, geographicAnchor.longitude, nextZoom);
      this.zoom = nextZoom;
      this.center = unproject(nextAnchor.x - anchorX + this.root.clientWidth / 2, nextAnchor.y - anchorY + this.root.clientHeight / 2, nextZoom);
      this.render();
    }

    fit() {
      const width = this.root.clientWidth || 900;
      const height = this.root.clientHeight || 500;
      if (!this.points.length) {
        this.zoom = 6;
        this.center = { latitude: 13.2, longitude: 101.2 };
        this.render();
        return;
      }
      const projected = this.points.map(point => project(point.latitude, point.longitude, 0));
      const minX = Math.min(...projected.map(point => point.x));
      const maxX = Math.max(...projected.map(point => point.x));
      const minY = Math.min(...projected.map(point => point.y));
      const maxY = Math.max(...projected.map(point => point.y));
      const spanX = Math.max(.0001, maxX - minX);
      const spanY = Math.max(.0001, maxY - minY);
      this.zoom = Math.max(MIN_ZOOM, Math.min(10, Math.floor(Math.log2(Math.min((width - 120) / spanX, (height - 100) / spanY)))));
      this.zoom = Math.min(MAX_ZOOM, this.zoom + 1);
      this.center = unproject((minX + maxX) / 2, (minY + maxY) / 2, 0);
      this.render();
    }

    pointColour(point) {
      if (this.colourMode === "format" || this.colourMode === "cluster") return hashColour(point[this.colourMode] || "Unknown");
      return { positive: "#1d9b55", negative: "#d94858", neutral: "#8a96a5", na: "#8a96a5" }[growthClass(point[this.colourMode])];
    }

    renderLegend() {
      if (["format", "cluster"].includes(this.colourMode)) {
        const values = [...new Set(this.points.map(point => point[this.colourMode] || "Unknown"))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        this.legend.innerHTML = values.map(value => `<span><i style="--legend-colour:${hashColour(value)}"></i>${escapeHtml(value)}</span>`).join("");
      } else {
        this.legend.innerHTML = `<span><i style="--legend-colour:#1d9b55"></i>Positive</span><span><i style="--legend-colour:#d94858"></i>Negative</span><span><i style="--legend-colour:#8a96a5"></i>No change / No growth data</span>`;
      }
    }

    renderTiles() {
      const width = this.root.clientWidth;
      const height = this.root.clientHeight;
      if (!width || !height) return;
      this.tiles.classList.remove("offline-basemap");
      const center = project(this.center.latitude, this.center.longitude, this.zoom);
      const left = center.x - width / 2;
      const top = center.y - height / 2;
      const startX = Math.floor(left / TILE_SIZE);
      const endX = Math.floor((left + width) / TILE_SIZE);
      const startY = Math.max(0, Math.floor(top / TILE_SIZE));
      const tileCount = 2 ** this.zoom;
      const endY = Math.min(tileCount - 1, Math.floor((top + height) / TILE_SIZE));
      const output = [];
      for (let tileY = startY; tileY <= endY; tileY++) {
        for (let tileX = startX; tileX <= endX; tileX++) {
          const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
          output.push(`<img src="https://tile.openstreetmap.org/${this.zoom}/${wrappedX}/${tileY}.png" alt="" draggable="false" style="left:${tileX * TILE_SIZE - left}px;top:${tileY * TILE_SIZE - top}px">`);
        }
      }
      this.tiles.innerHTML = output.join("");
      this.tiles.querySelectorAll("img").forEach(tile => {
        tile.addEventListener("error", () => this.tiles.classList.add("offline-basemap"), { once: true });
      });
    }

    renderMarkers() {
      const width = this.root.clientWidth;
      const height = this.root.clientHeight;
      if (!width || !height) return;
      const center = project(this.center.latitude, this.center.longitude, this.zoom);
      this.markers.innerHTML = this.points.map((point, index) => {
        const projected = project(point.latitude, point.longitude, this.zoom);
        const left = projected.x - center.x + width / 2;
        const top = projected.y - center.y + height / 2;
        const colour = this.pointColour(point);
        return `<button class="store-map-marker" data-map-point="${index}" type="button" style="left:${left}px;top:${top}px;--marker-colour:${colour}" aria-label="${escapeHtml(point.name)}" title="${escapeHtml(point.name)}"><i></i>${this.showLabels ? `<span>${escapeHtml(point.name)}</span>` : ""}</button>`;
      }).join("");
      this.renderLegend();
    }

    showPopup(index) {
      const point = this.points[index];
      if (!point) return;
      const metric=(label,value,text,cls='')=>Number.isFinite(value)?`<div><dt>${label}</dt><dd class="${cls}">${text}</dd></div>`:'';
      const delta=Number.isFinite(point.salesTY)&&Number.isFinite(point.salesLY)?point.salesTY-point.salesLY:null;
      this.popup.innerHTML = `<button type="button" aria-label="Close store details">×</button><strong>${escapeHtml(point.name)}</strong><span>${escapeHtml(point.format)}</span><dl>${metric('Sales TY',point.salesTY,Connext.money(point.salesTY))}${metric('Sales LY',point.salesLY,Connext.money(point.salesLY))}${metric('Growth',delta,(delta>0?'+':'')+Connext.money(delta),growthClass(delta))}${metric('%Growth',point.salesGrowth,formatGrowth(point.salesGrowth),growthClass(point.salesGrowth))}</dl><a href="https://www.google.com/maps?q=${point.latitude},${point.longitude}" target="_blank" rel="noopener">Open in Google Maps ↗</a>`;
      this.popup.hidden = false;
      this.popup.querySelector("button").addEventListener("click", () => { this.popup.hidden = true; });
    }

    render() {
      this.renderTiles();
      this.renderMarkers();
    }
  }

  window.createInteractiveStoreMap = (root, tiles, markers, legend) => new InteractiveStoreMap(root, tiles, markers, legend);
})();
