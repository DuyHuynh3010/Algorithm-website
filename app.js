const modes = {
  sort: {
    kicker: "Bubble sort",
    title: "Watch data organize itself",
    signal:
      "Bubble sort repeatedly compares adjacent values and pushes larger values to the right.",
    time: "O(n²)",
    space: "O(1)",
  },
  path: {
    kicker: "Breadth-first search",
    title: "Find the shortest route through a grid",
    signal:
      "BFS expands level by level, so the first time it reaches the target is the shortest path.",
    time: "O(V + E)",
    space: "O(V)",
  },
  hash: {
    kicker: "Separate chaining",
    title: "See collisions become linked buckets",
    signal:
      "Keys are reduced to bucket indexes. Collisions are stored in chains instead of overwriting data.",
    time: "O(1) avg",
    space: "O(n)",
  },
};

const state = {
  mode: "sort",
  running: false,
  sortValues: [],
  comparisons: 0,
  moves: 0,
  hashKeys: [],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const els = {
  comparisons: $("#metric-comparisons"),
  moves: $("#metric-swaps"),
  status: $("#metric-status"),
  run: $("#run-button"),
  shuffle: $("#shuffle-button"),
  kicker: $("#mode-kicker"),
  title: $("#mode-title"),
  signal: $("#signal-text"),
  time: $("#time-complexity"),
  space: $("#space-complexity"),
  trace: $("#trace-list"),
  sort: $("#sort-visual"),
  path: $("#path-visual"),
  hash: $("#hash-visual"),
};

function setStatus(label) {
  els.status.textContent = label;
}

function updateMetrics() {
  els.comparisons.textContent = state.comparisons;
  els.moves.textContent = state.moves;
}

function resetMetrics() {
  state.comparisons = 0;
  state.moves = 0;
  updateMetrics();
}

function trace(message) {
  const item = document.createElement("li");
  item.textContent = message;
  els.trace.prepend(item);
  while (els.trace.children.length > 8) {
    els.trace.lastElementChild.remove();
  }
}

function clearTrace(message) {
  els.trace.innerHTML = "";
  if (message) trace(message);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createSortValues() {
  state.sortValues = Array.from({ length: 24 }, () => randomInt(14, 98));
}

function renderSort(highlights = {}) {
  els.sort.innerHTML = "";
  state.sortValues.forEach((value, index) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${value}%`;
    bar.title = String(value);
    if (highlights.compare?.includes(index)) bar.classList.add("compare");
    if (highlights.swap?.includes(index)) bar.classList.add("swap");
    els.sort.append(bar);
  });
}

function buildGrid() {
  els.path.innerHTML = "";
  const total = 16 * 12;
  const guaranteedPath = new Set();
  for (let col = 0; col < 16; col += 1) guaranteedPath.add(col);
  for (let row = 1; row < 12; row += 1) guaranteedPath.add(row * 16 + 15);

  const walls = new Set();
  for (let i = 0; i < 38; i += 1) {
    const wall = randomInt(0, total - 1);
    if (!guaranteedPath.has(wall) && wall !== 0 && wall !== total - 1) walls.add(wall);
  }

  for (let index = 0; index < total; index += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = index;
    if (walls.has(index)) cell.classList.add("wall");
    if (index === 0) cell.classList.add("start");
    if (index === total - 1) cell.classList.add("end");
    els.path.append(cell);
  }
}

function createHashKeys() {
  state.hashKeys = Array.from({ length: 15 }, () => randomInt(12, 99));
}

function renderHash(activeKey = null) {
  els.hash.innerHTML = "";
  const buckets = Array.from({ length: 7 }, () => []);
  state.hashKeys.forEach((key) => buckets[key % buckets.length].push(key));

  buckets.forEach((chain, index) => {
    const bucket = document.createElement("div");
    bucket.className = "bucket";
    bucket.innerHTML = `<div class="bucket-index">${index}</div><div class="bucket-chain"></div>`;
    const chainEl = bucket.querySelector(".bucket-chain");
    chain.forEach((key) => {
      const node = document.createElement("span");
      node.className = `hash-node${key === activeKey ? " new" : ""}`;
      node.textContent = key;
      chainEl.append(node);
    });
    els.hash.append(bucket);
  });
}

function switchMode(mode) {
  if (state.running) return;
  state.mode = mode;
  const config = modes[mode];
  els.kicker.textContent = config.kicker;
  els.title.textContent = config.title;
  els.signal.textContent = config.signal;
  els.time.textContent = config.time;
  els.space.textContent = config.space;
  $$(".mode-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
  $$(".visual").forEach((visual) => visual.classList.remove("active"));
  $(`#${mode}-visual`).classList.add("active");
  resetMetrics();
  setStatus("Ready");
  clearTrace(`${config.kicker} loaded.`);
}

async function runSort() {
  setStatus("Sorting");
  clearTrace("Starting adjacent comparisons.");
  const values = state.sortValues;

  for (let pass = 0; pass < values.length - 1; pass += 1) {
    for (let index = 0; index < values.length - pass - 1; index += 1) {
      state.comparisons += 1;
      updateMetrics();
      renderSort({ compare: [index, index + 1] });
      await sleep(42);

      if (values[index] > values[index + 1]) {
        [values[index], values[index + 1]] = [values[index + 1], values[index]];
        state.moves += 1;
        updateMetrics();
        renderSort({ swap: [index, index + 1] });
        trace(`Swapped ${values[index]} and ${values[index + 1]}.`);
        await sleep(54);
      }
    }
  }

  renderSort();
  setStatus("Sorted");
  trace("Array is now sorted.");
}

function neighbors(index, width, total) {
  const options = [];
  const row = Math.floor(index / width);
  const col = index % width;
  if (row > 0) options.push(index - width);
  if (row < total / width - 1) options.push(index + width);
  if (col > 0) options.push(index - 1);
  if (col < width - 1) options.push(index + 1);
  return options;
}

async function runPath() {
  setStatus("Searching");
  clearTrace("Queue starts at the green cell.");
  const width = 16;
  const total = 16 * 12;
  const cells = $$("#path-visual .cell");
  const queue = [0];
  const visited = new Set([0]);
  const parent = new Map();

  while (queue.length) {
    const current = queue.shift();
    state.moves += 1;
    updateMetrics();

    if (current === total - 1) break;

    for (const next of neighbors(current, width, total)) {
      state.comparisons += 1;
      const cell = cells[next];
      if (visited.has(next) || cell.classList.contains("wall")) continue;
      visited.add(next);
      parent.set(next, current);
      queue.push(next);
      cell.classList.add("visited");
      if (visited.size % 10 === 0) trace(`Visited ${visited.size} cells.`);
      updateMetrics();
      await sleep(18);
    }
  }

  if (!parent.has(total - 1)) {
    setStatus("Blocked");
    trace("No path found in this layout.");
    return;
  }

  let step = total - 1;
  while (step !== 0) {
    cells[step].classList.add("path");
    step = parent.get(step);
    await sleep(28);
  }
  setStatus("Found");
  trace("Shortest path highlighted.");
}

async function runHash() {
  setStatus("Hashing");
  clearTrace("Inserting keys by modulo bucket.");
  const keys = [...state.hashKeys];
  state.hashKeys = [];
  renderHash();

  for (const key of keys) {
    state.comparisons += 1;
    state.moves += 1;
    state.hashKeys.push(key);
    renderHash(key);
    updateMetrics();
    trace(`${key} maps to bucket ${key % 7}.`);
    await sleep(260);
  }

  renderHash();
  setStatus("Stored");
  trace("All keys inserted.");
}

async function runActiveMode() {
  if (state.running) return;
  state.running = true;
  els.run.disabled = true;
  els.shuffle.disabled = true;

  if (state.mode === "sort") await runSort();
  if (state.mode === "path") await runPath();
  if (state.mode === "hash") await runHash();

  els.run.disabled = false;
  els.shuffle.disabled = false;
  state.running = false;
}

function rebuildActiveMode() {
  if (state.running) return;
  resetMetrics();
  setStatus("Ready");

  if (state.mode === "sort") {
    createSortValues();
    renderSort();
    clearTrace("Fresh random array generated.");
  }

  if (state.mode === "path") {
    buildGrid();
    clearTrace("New grid generated.");
  }

  if (state.mode === "hash") {
    createHashKeys();
    renderHash();
    clearTrace("New key set generated.");
  }
}

$$(".mode-button").forEach((button) => {
  button.addEventListener("click", () => {
    switchMode(button.dataset.mode);
    rebuildActiveMode();
  });
});

els.run.addEventListener("click", runActiveMode);
els.shuffle.addEventListener("click", rebuildActiveMode);

createSortValues();
buildGrid();
createHashKeys();
renderSort();
renderHash();
switchMode("sort");
