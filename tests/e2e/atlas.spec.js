import { expect, test } from "@playwright/test";

async function waitForGraph(page) {
  await expect(page.locator(".stage")).not.toHaveClass(/data-loading/, { timeout: 30000 });
  await expect(page.locator("#visible-nodes")).not.toHaveText("—", { timeout: 30000 });
}

async function chooseOption(page, name, value) {
  await page.getByRole('combobox', { name, exact: true }).click();
  await page.locator('.select-menu:not([hidden])').locator(`[role="option"][data-value="${value}"]`).click();
}

test.describe("Atlas graph explorer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForGraph(page);
  });

  test("loads the graph with production security headers", async ({ page }) => {
    const response = await page.goto("/");
    await waitForGraph(page);
    expect(response.headers()["content-security-policy"]).toContain("default-src 'self'");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    await expect(page.locator("#visible-nodes")).toHaveText("76.3K");
    await expect(page.locator(".layer-tab")).toHaveCount(3);
    await expect(page.locator("#graph-select option")).toHaveCount(1);
  });

  test("switches between datasets from the graph selector", async ({ page }) => {
    await page.route("**/graph-data/index.json", async (route) => {
      const response = await route.fetch();
      const registry = await response.json();
      const alternate = { ...registry.graphs[0], id: "alternate-test-graph", name: "Alternate architecture" };
      await route.fulfill({ response, json: { ...registry, graphs: [registry.graphs[0], alternate] } });
    });
    await page.reload();
    await expect(page.locator("#graph-select option")).toHaveCount(2);
    await chooseOption(page, 'Select graph dataset', 'alternate-test-graph');
    await expect(page.locator("#graph-select option:checked")).toContainText("Alternate architecture");
    await expect(page.locator("#visible-nodes")).toHaveText("76.3K");
  });

  test("renders a fitted donut for every architecture layer", async ({ page }) => {
    const expectedCounts = { BUSINESS: "799", API: "73.6K", RUNTIME: "1.9K" };
    for (const [layer, count] of Object.entries(expectedCounts)) {
      await page.locator(`.layer-tab[data-layer="${layer}"]`).click();
      await expect(page.locator(".stage")).toHaveClass(/layer-donut/);
      await expect(page.locator(".stage")).toHaveAttribute("data-active-layer", layer);
      await expect(page.locator("#visible-nodes")).toHaveText(count);
    }
  });

  test("switches between all visualization modes", async ({ page }) => {
    const viewPicker = page.locator("#layout-mode");
    await expect(viewPicker.locator("option")).toHaveCount(3);
    await expect(viewPicker.locator("option")).toHaveText([
      "Constellation Donut", "Constellation V1", "Organizational",
    ]);
    for (const mode of ["constellation-v1", "hierarchy", "donut"]) {
      await chooseOption(page, 'Graph layout', mode);
      await expect(viewPicker).toHaveValue(mode);
    }
  });

  test("provides indexed entity suggestions and opens a result", async ({ page }) => {
    await chooseOption(page, 'Choose an entity type to browse', 'API');
    await expect(page.locator(".search-result-heading")).toContainText("1,842 available");
    await page.locator("#graph-search").fill("Credit Card");
    await expect(page.locator(".search-result").first()).toContainText("Credit Card API");
    await page.locator(".search-result").first().click();
    await expect(page.locator("#inspector")).toHaveClass(/open/);
    await expect(page.locator("#inspector-type")).toContainText("API / API");
  });

  test("builds and applies a schema-aware relationship condition", async ({ page }) => {
    await chooseOption(page, 'Condition entity type', 'API');
    await page.locator(".condition-suggestions button").first().click();
    await page.getByRole('combobox', { name: 'Condition relationship', exact: true }).click();
    await page.getByRole('option', { name: 'CONTAINS → API Version', exact: true }).click();
    await page.locator("#apply-conditions").click();
    await expect(page.locator("#conditional-status")).toContainText("matching entities");
    await expect(page.locator("#visible-nodes")).not.toHaveText("76.3K");
  });

  test("browses every connected entity in batches and opens an appended result", async ({ page }) => {
    await chooseOption(page, 'Choose an entity type to browse', 'APPLICATION');
    await page.locator("#graph-search").fill("Apigee");
    await page.locator(".search-result").filter({ has: page.getByText("Apigee", { exact: true }) }).click();
    await expect(page.locator("#inspector-id")).toHaveText("APPLICATION:Apigee");
    const rows = page.locator(".connection-row");
    const more = page.locator(".more-connections");
    await expect(rows).toHaveCount(25);
    await expect(page.locator(".connection-pagination-status")).toHaveText("Showing 25 of 101 connected entities");
    for (const count of [50, 75, 100, 101]) {
      await more.click();
      await expect(rows).toHaveCount(count);
      await expect(page.locator(".connection-row:focus")).toBeInViewport();
    }
    await expect(more).toBeHidden();
    await expect(page.locator(".connection-pagination-status")).toHaveText("Showing 101 of 101 connected entities");
    const ids = await rows.evaluateAll((buttons) => buttons.map((button) => button.title.split("\n").at(-1)));
    expect(new Set(ids).size).toBe(101);
    const lastName = await rows.last().locator("b").textContent();
    await rows.last().click();
    await expect(page.locator("#inspector-name")).toHaveText(lastName);
    await expect(page.locator("#inspector-id")).not.toHaveText("APPLICATION:Apigee");
    expect(await page.locator(".connection-row").count()).toBeLessThanOrEqual(25);
  });

  test('uses the supplied logo, removes the footer, and switches all four themes', async ({ page }) => {
    await expect(page.getByAltText('APIwiz')).toBeVisible();
    expect(await page.getByAltText('APIwiz').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(page.locator('.sidebar-footer')).toHaveCount(0);
    await expect(page.locator('#theme-select')).toHaveCount(0);
    for (const [theme, label] of [['dark', 'Midnight'], ['ocean', 'Ocean'], ['sunset', 'Sunset'], ['light', 'Light']]) {
      const button = page.getByRole('group', { name: 'Color theme' }).getByRole('button', { name: label, exact: true });
      await button.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.theme-switch [aria-pressed="true"]')).toHaveCount(1);
      await expect(button.locator('svg')).toHaveCount(1);
    }
    await page.getByRole('button', { name: 'Ocean', exact: true }).click();
    await page.reload();
    await waitForGraph(page);
    await expect(page.getByRole('button', { name: 'Ocean', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('opens settings only on request and closes it when navigating away', async ({ page }) => {
    const settings = page.locator('#settings-panel');
    const button = page.getByRole('button', { name: 'Settings', exact: true });
    await expect(settings).toBeHidden();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await page.getByRole('navigation', { name: 'Explorer sections' }).getByRole('button', { name: 'Relationships', exact: true }).click();
    await expect(settings).toBeHidden();
    await expect(button).not.toHaveClass(/active/);
    for (const target of ['Discover graph', 'Architecture layers', 'Graph entities', 'Relationships', 'Conditional filters', 'Advanced traversal']) {
      await button.click();
      await expect(settings).toBeVisible();
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      await page.getByRole('navigation', { name: 'Explorer sections' }).getByRole('button', { name: target, exact: true }).click();
      await expect(settings).toBeHidden();
      await expect(button).toHaveAttribute('aria-expanded', 'false');
    }
    await button.click();
    await page.locator('.dock-tabs [data-dock-target="conditions"]').click();
    await expect(settings).toBeHidden();
    await button.click();
    await page.locator('#sidebar-toggle').click();
    await expect(settings).toBeHidden();
    await button.click();
    await expect(page.locator('body')).not.toHaveClass(/sidebar-collapsed/);
    await expect(settings).toBeVisible();
    await page.reload();
    await waitForGraph(page);
    await expect(settings).toBeHidden();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('changes overall text size, preserves graph state, and restores the preference', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1000 });
    await page.locator('.layer-tab[data-layer="BUSINESS"]').click();
    await expect(page.locator('#visible-nodes')).toHaveText('799');
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    const sizes = [['Small', .9], ['Medium', 1.1], ['Large', 1.25], ['X-Large', 1.5], ['Default', 1]];
    const selectors = ['.sidebar-intro h2', '.section-help', '.select-trigger', '#apply-conditions', '.filter-name', '.stage-title strong', '.theme-switch button'];
    const fonts = () => page.evaluate(selectors => selectors.map(selector => parseFloat(globalThis.getComputedStyle(globalThis.document.querySelector(selector)).fontSize)), selectors);
    const original = await fonts();
    for (const [name, scale] of sizes) {
      await page.getByRole('radio', { name, exact: true }).check();
      const current = await fonts();
      current.forEach((size, index) => expect(size).toBeCloseTo(original[index] * scale, 1));
      await expect(page.locator('#visible-nodes')).toHaveText('799');
      await expect(page.locator('#layout-mode')).toHaveValue('donut');
    }
    await page.getByRole('radio', { name: 'X-Large', exact: true }).check();
    await page.reload();
    await waitForGraph(page);
    await expect(page.locator('html')).toHaveAttribute('data-text-size', 'xlarge');
    await expect(page.locator('#settings-panel')).toBeHidden();
    const restored = await fonts();
    restored.forEach((size, index) => expect(size).toBeCloseTo(original[index] * 1.5, 1));
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.getByRole('radio', { name: 'X-Large', exact: true })).toBeChecked();
    await page.getByRole('radio', { name: 'X-Large', exact: true }).press('ArrowLeft');
    await expect(page.getByRole('radio', { name: 'Large', exact: true })).toBeChecked();
    await page.getByRole('radio', { name: 'Default', exact: true }).check();
    expect(await fonts()).toEqual(original);
  });

  test('keeps extra-large controls usable across themes and narrow panels', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('radio', { name: 'X-Large', exact: true }).check();
    for (const theme of ['Light', 'Midnight', 'Ocean', 'Sunset']) {
      await page.getByRole('button', { name: theme, exact: true }).click();
      await expect(page.locator('html')).toHaveAttribute('data-text-size', 'xlarge');
    }
    for (const width of [1440, 1100, 900, 740]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await expect(page.getByRole('radio', { name: 'Default', exact: true })).toBeInViewport();
      const overflows = await page.locator('.topbar, .sidebar, .query-dock').evaluateAll(elements => elements.filter(element => element.scrollWidth > element.clientWidth + 2).map(element => element.className));
      expect(overflows).toEqual([]);
      const graph = await page.locator('#sigma-container').boundingBox();
      expect(graph.height).toBeGreaterThan(300);
      await page.getByRole('button', { name: 'Conditional filters', exact: true }).click();
      await chooseOption(page, 'Condition entity type', 'API');
      await expect(page.locator('.condition-type')).toHaveValue('API');
    }
  });

  test('falls back to default for an invalid stored text size', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('atlas-v2-text-size', 'invalid'));
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-text-size', 'default');
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.getByRole('radio', { name: 'Default', exact: true })).toBeChecked();
  });

  test('paints readable node hover overlays after switching each theme', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1000 });
    // Observe the actual hover canvas paints, not just the selected theme flag.
    await page.addInitScript(() => {
      const { CanvasRenderingContext2D } = globalThis;
      const fill = CanvasRenderingContext2D.prototype.fill;
      const fillText = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fill = function (...args) {
        if (this.canvas.classList.contains('sigma-hovers')) this.canvas.dataset.hoverBackground = this.fillStyle;
        return fill.apply(this, args);
      };
      CanvasRenderingContext2D.prototype.fillText = function (...args) {
        if (this.canvas.classList.contains('sigma-hovers')) {
          this.canvas.dataset.hoverText = this.fillStyle;
          this.canvas.dataset.hoverLabel = args[0];
        }
        return fillText.apply(this, args);
      };
    });
    await page.reload();
    await waitForGraph(page);
    await chooseOption(page, 'Choose an entity type to browse', 'API');
    await page.locator('#graph-search').fill('Credit Card');
    await page.locator('.search-result').first().click();
    const bounds = await page.locator('#sigma-container').boundingBox();
    const hover = page.locator('.sigma-hovers');
    for (const [theme, background, foreground] of [
      ['Midnight', '#20242c', '#f4f6fa'], ['Ocean', '#102f3d', '#edfcff'],
      ['Sunset', '#392435', '#fff2eb'], ['Light', '#fffefa', '#20211f'],
    ]) {
      await page.getByRole('button', { name: theme, exact: true }).click();
      await expect.poll(async () => {
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        return hover.getAttribute('data-hover-background');
      }).toBe(background);
      await expect(hover).toHaveAttribute('data-hover-text', foreground);
      // During the camera transition another real API may be under the pointer.
      await expect(hover).toHaveAttribute('data-hover-label', /\S/);
    }
  });

  test('keeps relationship labels and checkbox states readable in every theme', async ({ page }) => {
    await page.locator('#edge-section-toggle').click();
    const row = page.locator('#edge-filters .filter-item').filter({ hasText: 'HAS EXPOSURE' });
    const checkbox = row.locator('input');
    function contrast(first, second) {
      const luminance = color => {
        const [r, g, b] = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => value / 255)
          .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
        return .2126 * r + .7152 * g + .0722 * b;
      };
      const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
      return (values[0] + .05) / (values[1] + .05);
    }
    for (const theme of ['Ocean', 'Sunset', 'Midnight', 'Light']) {
      await page.getByRole('button', { name: theme, exact: true }).click();
      if (!await checkbox.isChecked()) await row.click();
      await expect(checkbox).toBeChecked();
      const selected = await row.evaluate(label => {
        const styles = element => element.ownerDocument.defaultView.getComputedStyle(element);
        const mark = label.querySelector('.edge-check');
        return {
          text: styles(label.querySelector('.filter-name')).color,
          count: styles(label.querySelector('.filter-count')).color,
          surface: styles(label.closest('.sidebar')).backgroundColor,
          fill: styles(mark).backgroundColor,
          check: label.ownerDocument.defaultView.getComputedStyle(mark, '::after').borderBottomColor,
        };
      });
      expect(contrast(selected.text, selected.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(selected.count, selected.surface)).toBeGreaterThanOrEqual(4.5);
      expect(selected.fill).not.toBe('rgba(0, 0, 0, 0)');
      expect(contrast(selected.fill, selected.surface)).toBeGreaterThanOrEqual(3);
      expect(contrast(selected.check, selected.fill)).toBeGreaterThanOrEqual(3);
      await row.click();
      await expect(checkbox).not.toBeChecked();
      const unselected = await row.locator('.edge-check').evaluate(mark => {
        const style = mark.ownerDocument.defaultView.getComputedStyle(mark);
        return { fill: style.backgroundColor, border: style.borderColor };
      });
      expect(unselected.fill).toBe('rgba(0, 0, 0, 0)');
      expect(contrast(unselected.border, selected.surface)).toBeGreaterThanOrEqual(3);
      await row.click();
    }
  });

  test('supports keyboard dropdown selection, checkmarks, dismissal, and disabled controls', async ({ page }) => {
    const relationship = page.getByRole('combobox', { name: 'Condition relationship', exact: true });
    await expect(relationship).toBeDisabled();
    const layout = page.getByRole('combobox', { name: 'Graph layout', exact: true });
    await layout.press('Enter');
    await expect(page.getByRole('option', { name: 'Constellation Donut', exact: true })).toHaveAttribute('aria-selected', 'true');
    await layout.press('ArrowDown');
    await layout.press('Enter');
    await expect(page.locator('#layout-mode')).toHaveValue('constellation-v1');
    await expect(layout).toContainText('Constellation V1');
    await layout.click();
    await layout.press('Escape');
    await expect(layout).toBeFocused();
    await expect(page.locator('.select-menu:not([hidden])')).toHaveCount(0);
    await layout.click();
    await page.locator('.stage').click({ position: { x: 12, y: 12 } });
    await expect(layout).toHaveAttribute('aria-expanded', 'false');
    await page.locator('.layer-tab[data-layer="BUSINESS"]').click();
    await expect(layout).toContainText('Constellation Donut');
    const depth = page.getByRole('combobox', { name: 'Traversal depth', exact: true });
    await depth.click();
    await depth.press('End');
    await depth.press('Enter');
    await expect(page.locator('#traversal-depth')).toHaveValue('6');
    await expect(depth).toContainText('6 hops');
  });

  test('drags both panel widths, preserves them, and supports keyboard resize and reset', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    for (const [name, panel, delta] of [['Resize explorer panel', '#controls-panel', 75], ['Resize query panel', '#query-panel', -65]]) {
      const handle = page.getByRole('separator', { name });
      const original = (await page.locator(panel).boundingBox()).width;
      const rect = await handle.boundingBox();
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height * .42);
      await page.mouse.down();
      await page.mouse.move(rect.x + rect.width / 2 + delta, rect.y + rect.height * .42, { steps: 6 });
      await page.mouse.up();
      await expect.poll(async () => (await page.locator(panel).boundingBox()).width).toBeGreaterThan(original + 50);
    }
    const before = await page.locator('#controls-panel').boundingBox();
    await page.reload();
    await waitForGraph(page);
    expect((await page.locator('#controls-panel').boundingBox()).width).toBe(before.width);
    const left = page.getByRole('separator', { name: 'Resize explorer panel' });
    await left.press('ArrowRight');
    await expect(left).toHaveAttribute('aria-valuenow', String(before.width + 16));
    await left.press('Home');
    await expect(left).toHaveAttribute('aria-valuenow', '260');
    await left.dblclick();
    await expect(left).toHaveAttribute('aria-valuenow', '320');
    await page.locator('#sidebar-toggle').click();
    await expect(left).toBeHidden();
    await page.locator('#sidebar-toggle').click();
    await expect(left).toBeVisible();
    expect((await page.locator('.stage').boundingBox()).width).toBeGreaterThanOrEqual(340);
  });

  test('keeps icon menus and the resizable query overlay usable on narrow screens', async ({ page }) => {
    await page.setViewportSize({ width: 720, height: 900 });
    await expect(page.getByRole('group', { name: 'Color theme' })).toBeInViewport();
    await page.getByRole('button', { name: 'Conditional filters', exact: true }).click();
    await expect(page.locator('#query-panel')).toBeInViewport();
    const handle = page.getByRole('separator', { name: 'Resize query panel' });
    await expect(handle).toBeVisible();
    const original = Number(await handle.getAttribute('aria-valuenow'));
    await handle.press('ArrowLeft');
    await expect(handle).toHaveAttribute('aria-valuenow', String(original + 16));
    await page.getByRole('combobox', { name: 'Condition entity type', exact: true }).click();
    await expect(page.locator('.select-menu:not([hidden])')).toBeInViewport();
    await page.getByRole('option', { name: 'API', exact: true }).click();
    await expect(page.locator('.condition-type')).toHaveValue('API');
    await page.locator('#query-dock-close').click();
    await expect(handle).toBeHidden();
  });
});
