// Cooking view: follow a recipe step by step on a phone.
// Reads the "Ingredienti" and "Preparazione" sections already on the page.
(() => {
    "use strict";

    const article = document.querySelector("article.md-content__inner");
    if (!article) return;
    const heads = [...article.querySelectorAll(":scope > h2")];
    const hIng = heads.find((h) => h.textContent.includes("Ingredienti"));
    const hPrep = heads.find((h) => h.textContent.includes("Preparazione"));
    if (!hIng || !hPrep) return;

    const LETTER = "a-zà-öø-ÿ";
    const clean = (s) => s.replace(/\s+/g, " ").trim();
    const esc = (s) =>
        s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

    function after(h) {
        const out = [];
        for (let el = h.nextElementSibling; el && el.tagName !== "H2"; el = el.nextElementSibling) out.push(el);
        return out;
    }
    function ownText(li) {
        const copy = li.cloneNode(true);
        copy.querySelectorAll("ul, ol").forEach((n) => n.remove());
        return clean(copy.textContent);
    }
    function isLabel(el) {
        const nodes = [...el.childNodes].filter((n) => n.nodeType === 1 || n.textContent.trim());
        return (
            el.tagName === "P" &&
            nodes.length > 0 &&
            nodes.every((n) => n.nodeType === 1 && /^(STRONG|B)$/.test(n.tagName))
        );
    }

    // ---------- Quantities ----------
    const FRACTIONS = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 };
    const NUM = "(?:\\d+\\s*\\/\\s*\\d+|\\d+(?:[.,]\\d+)?\\s*[½¼¾⅓⅔]?|[½¼¾⅓⅔])";
    const QTY = new RegExp(
        `^(${NUM})(?:\\s*(?:-|–|o)\\s*(${NUM}))?\\s*(g|gr|kg|ml|cl|l|cm)?(?![${LETTER}])\\.?\\s*`,
        "i",
    );
    const UNIT_WORDS = [
        ["cucchiaio", "cucchiai"],
        ["cucchiaino", "cucchiaini"],
        ["spicchio", "spicchi"],
        ["costa", "coste"],
        ["bicchiere", "bicchieri"],
        ["tazza", "tazze"],
        ["tazzina", "tazzine"],
        ["bustina", "bustine"],
        ["foglia", "foglie"],
        ["rametto", "rametti"],
        ["pizzico", "pizzichi"],
        ["filetto", "filetti"],
        ["mestolo", "mestoli"],
        ["spruzzata", "spruzzate"],
        ["fetta", "fette"],
        ["pezzo", "pezzi"],
        ["litro", "litri"],
        ["ciuffo", "ciuffi"],
        ["scatola", "scatole"],
        ["barattolo", "barattoli"],
        ["manciata", "manciate"],
        ["goccia", "gocce"],
        ["bacca", "bacche"],
        ["stella", "stelle"],
        ["noce", "noci"],
        ["cubetto", "cubetti"],
    ];
    function toNumber(s) {
        s = s.replace(/\s+/g, "");
        if (s.includes("/")) {
            const [a, b] = s.split("/").map(Number);
            return b ? a / b : NaN;
        }
        const tail = s.slice(-1);
        if (FRACTIONS[tail] !== undefined) return (Number(s.slice(0, -1).replace(",", ".")) || 0) + FRACTIONS[tail];
        return Number(s.replace(",", "."));
    }
    function formatNumber(v, metric) {
        if (metric) {
            if (v >= 20) return String(Math.round(v / 5) * 5);
            if (v >= 2) return String(Math.round(v));
            return String(Math.round(v * 10) / 10).replace(".", ",");
        }
        const r = Math.max(0.25, Math.round(v * 4) / 4);
        const whole = Math.floor(r);
        const part = { 0: "", 0.25: "¼", 0.5: "½", 0.75: "¾" }[r - whole];
        return (whole ? String(whole) : "") + part;
    }
    function parseIngredient(text) {
        const m = text.match(QTY);
        if (!m) return { text, qtyText: "", name: text, amounts: null };
        let rest = text.slice(m[0].length);
        let unit = m[3] || "";
        let unitForms = null;
        const word = rest.match(new RegExp(`^([${LETTER}]+)\\s*`, "i"));
        if (!unit && word) {
            const forms = UNIT_WORDS.find((f) => f.includes(word[1].toLowerCase()));
            if (forms) {
                unitForms = forms;
                rest = rest.slice(word[0].length);
            }
        }
        const qtyText = clean(text.slice(0, text.length - rest.length));
        rest = rest.replace(/^(di|d['’])\s*/i, "");
        const amounts = [toNumber(m[1]), m[2] ? toNumber(m[2]) : null];
        if (Number.isNaN(amounts[0])) return { text, qtyText: "", name: text, amounts: null };
        return {
            text,
            qtyText,
            name: rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : text,
            amounts,
            unit,
            unitForms,
        };
    }
    function scaledQty(ing, factor) {
        if (!ing.amounts) return "";
        if (factor === 1) return ing.qtyText;
        const metric = /^(g|gr|kg|ml|cl|l)$/i.test(ing.unit);
        const vals = ing.amounts.filter((v) => v !== null).map((v) => v * factor);
        let out = vals.map((v) => formatNumber(v, metric)).join("-");
        if (ing.unit) out += " " + ing.unit;
        if (ing.unitForms) out += " " + ing.unitForms[Math.max(...vals) > 1 ? 1 : 0];
        return out;
    }

    // ---------- Matching ingredients to steps ----------
    const STOP = new Set(
        (
            "di del della dei degli delle con senza per o e a al alla allo ai in da il la lo le gli un una uno " +
            "fresco fresca freschi fresche secco secca secchi secche medio media piccolo piccola grande grandi intero intera " +
            "interi tritato tritata grattugiato grattugiata finissimo morbido fuso tiepido tiepida freddo fredda extra vergine " +
            "oliva tipo circa facoltativo facoltativa facoltativi qb abbondante cotti cotto puliti pulito sgocciolato dissalati " +
            "denocciolate alcune alcuni gusto piacere sottile sottili lunghi rosso rossa bianco bianca nero nera verde verdi " +
            "scatola liquida intera persona persone ogni"
        ).split(" "),
    );
    function wordPattern(w) {
        // Short endings only (cipoll-e, pomodor-ini), so "pasta" does not match "pasticcera".
        if (w.length <= 3) return w; // rum, gin
        if (w.length === 4) return w.slice(0, -1) + "[aeiou]"; // olio, sale, uovo/uova
        return w.replace(/[aeiouàèéìòù]$/, "") + `[${LETTER}]{0,3}`;
    }
    function keywords(name) {
        return [
            ...new Set(
                name
                    .toLowerCase()
                    .replace(/\(.*?\)/g, " ")
                    .split(new RegExp(`[^${LETTER}]+`)),
            ),
        ].filter((w) => w.length >= 3 && !STOP.has(w));
    }
    function findAll(re, text) {
        const out = [];
        for (const m of text.matchAll(re)) out.push([m.index + m[1].length, m.index + m[0].length]);
        return out;
    }
    const boundary = (p) => new RegExp(`(^|[^${LETTER}])(${p})(?![${LETTER}])`, "gi");

    // ---------- Read the page ----------
    const title = clean(article.querySelector("h1")?.textContent || document.title);
    let base = null;
    let baseUnit = "persone";
    const ingredients = [];
    let group = "";
    for (const el of after(hIng)) {
        if (isLabel(el)) group = clean(el.textContent);
        if (el.tagName !== "UL" && el.tagName !== "OL") continue;
        for (const li of el.querySelectorAll(":scope > li")) {
            const text = ownText(li);
            const dose = text.match(/^Dose per (\d+) (persone|muffin|pancakes|bicchieri)\b/i);
            if (dose) {
                if (base === null) {
                    base = Number(dose[1]);
                    baseUnit = dose[2].toLowerCase();
                }
                continue;
            }
            const ing = parseIngredient(text);
            ing.patterns = keywords(ing.name).map((w) => boundary(wordPattern(w)));
            ing.group = group;
            ingredients.push(ing);
        }
    }
    const steps = [];
    let section = "";
    for (const el of after(hPrep)) {
        if (el.tagName === "OL" || el.tagName === "UL") {
            for (const li of el.querySelectorAll(":scope > li")) {
                const sub = [...li.querySelectorAll(":scope > ul > li, :scope > ol > li")].map(ownText);
                steps.push({ text: ownText(li), sub, section });
            }
        } else if (el.tagName === "P") {
            if (isLabel(el)) section = clean(el.textContent);
            else if (clean(el.textContent)) steps.push({ text: clean(el.textContent), sub: [], section });
        }
    }
    if (!steps.length) return;

    let extra = {};
    try {
        extra = JSON.parse(document.getElementById("cucina-abbinamenti")?.textContent || "{}") || {};
    } catch (e) {
        extra = {};
    }
    const OIL_VERBS = boundary("(?:soffrigg|rosol|frigg)[" + LETTER + "]*");
    const EGG_PARTS = boundary("(?:tuorl|album|uov)[" + LETTER + "]*");
    const SALT_VERBS = boundary("sal(?:are|ate|ando)");
    const groupPatterns = [...new Set(ingredients.map((i) => i.group).filter(Boolean))].map((name) => [
        name,
        keywords(name).map((w) => boundary(wordPattern(w))),
    ]);

    // Which ingredients a step uses, and which ranges of its text to underline.
    function analyse(step) {
        const text = step.text + " " + step.sub.join(" ");
        const used = new Set();
        const ranges = [];
        ingredients.forEach((ing, k) => {
            for (const re of ing.patterns) {
                const hits = findAll(re, step.text);
                if (hits.length || findAll(re, text).length) used.add(k);
                ranges.push(...hits);
            }
        });
        for (const [phrase, names] of Object.entries(extra)) {
            const hits = findAll(boundary(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), step.text);
            if (!hits.length && !findAll(boundary(phrase), text).length) continue;
            ranges.push(...hits);
            [].concat(names).forEach((n) => {
                ingredients.forEach((ing, k) => {
                    if (ing.name.toLowerCase().includes(String(n).toLowerCase())) used.add(k);
                });
            });
        }
        if (findAll(OIL_VERBS, step.text).length) {
            ingredients.forEach((ing, k) => {
                if (/\bolio\b/i.test(ing.name)) used.add(k);
            });
        }
        if (findAll(SALT_VERBS, step.text).length) {
            ingredients.forEach((ing, k) => {
                if (/\bsale\b/i.test(ing.name)) used.add(k);
            });
        }
        // Yolks and whites come from the eggs.
        if (findAll(EGG_PARTS, step.text).length) {
            ingredients.forEach((ing, k) => {
                if (/\b(uov|tuorl|album)/i.test(ing.name)) used.add(k);
            });
        }
        // A step naming an ingredient group ("il soffritto", "i liquidi") uses the whole group.
        groupPatterns.forEach(([name, patterns]) => {
            if (patterns.some((re) => findAll(re, step.text).length)) {
                ingredients.forEach((ing, k) => {
                    if (ing.group === name) used.add(k);
                });
            }
        });
        // "tutti gli ingredienti": all of them, or the group matching the step's sub-section.
        // "gli altri ingredienti": those no earlier step has used yet.
        if (/altri ingredienti/i.test(step.text)) {
            ingredients.forEach((_, k) => {
                if (!seen.has(k)) used.add(k);
            });
        }
        if (/tutti gli ingredienti/i.test(step.text)) {
            const own = groupPatterns.filter(([, patterns]) => patterns.some((re) => findAll(re, step.section).length));
            ingredients.forEach((ing, k) => {
                if (!own.length || own.some(([name]) => ing.group === name)) used.add(k);
            });
        }
        // "tutti ... a parte il riso": take out what follows "a parte", "tranne", "salvo", ...
        const except = step.text.match(
            new RegExp(`(?:a parte|tranne|salvo|eccetto|esclus[oaie])\\s+(?:(?:il|lo|la|i|gli|le)\\s+|l['’])?([${LETTER}]+)`, "i"),
        );
        if (except) {
            const start = except.index;
            const end = start + except[0].length;
            ingredients.forEach((ing, k) => {
                if (ing.patterns.some((re) => findAll(re, except[1]).length)) used.delete(k);
            });
            for (let i = ranges.length - 1; i >= 0; i--) {
                if (ranges[i][0] >= start && ranges[i][1] <= end) ranges.splice(i, 1);
            }
        }
        ranges.sort((a, b) => a[0] - b[0]);
        let html = "";
        let at = 0;
        for (const [s, e] of ranges) {
            if (s < at) continue;
            html += esc(step.text.slice(at, s)) + "<mark>" + esc(step.text.slice(s, e)) + "</mark>";
            at = e;
        }
        html += esc(step.text.slice(at));
        return { used, html };
    }
    const seen = new Set();
    const analysed = steps.map((step) => {
        const result = analyse(step);
        result.used.forEach((k) => seen.add(k));
        return result;
    });

    // ---------- Timers ----------
    function timerFor(text) {
        const t = text.toLowerCase();
        let m = t.match(/(\d+)\s*(?:-\s*\d+\s*)?(?:ore|ora)\b/);
        if (m) return Number(m[1]) * 3600;
        if (/\bun['’]\s*ora\b/.test(t)) return 3600;
        m = t.match(/(\d+)\s*(?:-\s*\d+\s*)?(?:minuti|min\b|['’](?!\w))/);
        if (m) return Number(m[1]) * 60;
        if (/decina di minuti/.test(t)) return 600;
        return 0;
    }
    const mmss = (s) =>
        (s >= 3600
            ? Math.floor(s / 3600) + ":" + String(Math.floor((s % 3600) / 60)).padStart(2, "0")
            : Math.floor(s / 60)) +
        ":" +
        String(s % 60).padStart(2, "0");

    // ---------- State ----------
    const KEY = "cucina:" + location.pathname;
    let state = { step: 0, serv: base };
    try {
        state = { ...state, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch (e) {}
    state.step = Math.min(steps.length, Math.max(0, state.step | 0));
    if (base === null) state.serv = null;
    let drawerOpen = false;
    let timer = null;
    let wakeLock = null;
    const save = () => {
        try {
            localStorage.setItem(KEY, JSON.stringify({ step: state.step, serv: state.serv }));
        } catch (e) {}
    };

    // ---------- Markup ----------
    const root = document.createElement("div");
    root.className = "cucina";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Modalità cucina: " + title);
    root.innerHTML = `
        <aside class="ck-ing">
            <div class="ck-dose"></div>
            <button class="ck-drawer" type="button" aria-expanded="false">
                <span class="ck-drawer-title">Ingredienti</span>
                <span class="ck-drawer-count"></span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <div class="ck-chips"></div>
            <ul class="ck-list"></ul>
        </aside>
        <div class="ck-main">
            <header class="ck-head">
                <button class="ck-close" type="button" aria-label="Esci dalla modalità cucina">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
                <div class="ck-title"><span>${esc(title)}</span><small class="ck-count"></small></div>
                <span class="ck-awake" hidden>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
                    Schermo acceso
                </span>
            </header>
            <div class="ck-bars" aria-hidden="true"></div>
            <div class="ck-stage">
                <div class="ck-mise" hidden>
                    <h2 class="ck-mise-title">Mise en place</h2>
                    <div class="ck-mise-dose"></div>
                    <ul class="ck-mise-list"></ul>
                </div>
                <button class="ck-prev-step" type="button"></button>
                <div class="ck-current" aria-live="polite">
                    <span class="ck-num"></span>
                    <div class="ck-body">
                        <span class="ck-section"></span>
                        <p class="ck-text"></p>
                        <ul class="ck-sub"></ul>
                        <button class="ck-timer" type="button" hidden></button>
                    </div>
                </div>
                <button class="ck-next-step" type="button"></button>
            </div>
            <nav class="ck-nav">
                <button class="ck-back" type="button">‹ Indietro</button>
                <button class="ck-forward" type="button"></button>
            </nav>
        </div>`;
    document.body.appendChild(root);
    const $ = (sel) => root.querySelector(sel);

    const opener = document.createElement("button");
    opener.type = "button";
    opener.className = "cucina-apri md-button md-button--primary";
    opener.textContent = "Modalità cucina";
    hIng.parentNode.insertBefore(opener, hIng);

    // ---------- Rendering ----------
    function unitLabel(n) {
        if (baseUnit === "persone") return n === 1 ? "1 persona" : n + " persone";
        if (baseUnit === "bicchieri") return n === 1 ? "1 bicchiere" : n + " bicchieri";
        return n + " " + baseUnit;
    }
    // Screen 0 is the mise en place (all ingredients, choose the dose); screens 1..N are the steps.
    function render() {
        const step = state.step;
        const mise = step === 0;
        const cur = mise ? null : steps[step - 1];
        const { used, html } = mise ? { used: new Set(), html: "" } : analysed[step - 1];
        const factor = base ? state.serv / base : 1;
        root.classList.toggle("ck-mise-on", mise);
        $(".ck-mise").hidden = !mise;
        $(".ck-current").hidden = mise;

        // Dose: chosen only on the mise en place screen, fixed afterwards.
        $(".ck-dose").innerHTML = base === null ? "" : `<span>Dose per ${esc(unitLabel(state.serv))}</span>`;
        $(".ck-mise-dose").innerHTML =
            base === null
                ? ""
                : `<span>Dose per</span>
                <button type="button" class="ck-less" aria-label="Meno">−</button>
                <strong class="${factor === 1 ? "" : "ck-changed"}">${esc(unitLabel(state.serv))}</strong>
                <button type="button" class="ck-more" aria-label="Più">+</button>`;
        $(".ck-mise-list").innerHTML = ingredients
            .map(
                (ing) =>
                    `<li><span class="ck-qty">${esc(scaledQty(ing, factor))}</span><span class="ck-name">${esc(ing.name)}</span></li>`,
            )
            .join("");

        // Ingredients: those used in this step first, the others in recipe order.
        const order = [...used].sort((a, b) => a - b).concat(ingredients.map((_, k) => k).filter((k) => !used.has(k)));
        $(".ck-list").innerHTML = order
            .map((k, i) => {
                const ing = ingredients[k];
                const on = used.has(k);
                const gap = !on && i > 0 && used.has(order[i - 1]) ? " ck-gap" : "";
                return `<li class="${on ? "ck-on" : ""}${gap}"><span class="ck-qty">${esc(scaledQty(ing, factor))}</span><span class="ck-name">${esc(ing.name)}</span></li>`;
            })
            .join("");
        $(".ck-chips").innerHTML = used.size
            ? [...used]
                  .sort((a, b) => a - b)
                  .map(
                      (k) =>
                          `<span><b>${esc(scaledQty(ingredients[k], factor))}</b> ${esc(ingredients[k].name.split(" (")[0])}</span>`,
                  )
                  .join("")
            : `<em>Nessun ingrediente in questo passo</em>`;
        $(".ck-drawer-count").textContent = ingredients.length + " in tutto";
        $(".ck-drawer").setAttribute("aria-expanded", String(drawerOpen));
        root.classList.toggle("ck-drawer-open", drawerOpen);

        // Steps
        $(".ck-count").textContent = mise ? "Prima di iniziare" : `Passo ${step} di ${steps.length}`;
        $(".ck-bars").innerHTML = steps.map((_, k) => `<span class="${k < step ? "ck-done" : ""}"></span>`).join("");
        const next = steps[step];
        $(".ck-prev-step").hidden = mise;
        $(".ck-prev-step").textContent =
            step === 1 ? "Mise en place" : step > 1 ? `${step - 1}. ${steps[step - 2].text}` : "";
        $(".ck-next-step").hidden = mise || !next;
        $(".ck-next-step").textContent = next ? `${step + 1}. ${next.text}` : "";
        $(".ck-back").disabled = mise;
        $(".ck-forward").textContent = mise ? "Inizia ›" : next ? "Avanti ›" : "Fine";
        if (!mise) {
            $(".ck-num").textContent = step;
            $(".ck-section").textContent = cur.section;
            $(".ck-section").hidden = !cur.section;
            $(".ck-text").innerHTML = html;
            $(".ck-sub").innerHTML = cur.sub.map((s) => `<li>${esc(s)}</li>`).join("");
        }

        // Timer
        const seconds = mise ? 0 : timerFor(cur.text + " " + cur.sub.join(" "));
        const t = $(".ck-timer");
        t.hidden = !seconds;
        if (seconds) {
            const running = timer && timer.step === step;
            const left = running ? timer.left : seconds;
            t.classList.toggle("ck-running", !!running);
            t.classList.toggle("ck-ring", !!running && left <= 0);
            t.textContent = !running ? "Avvia " + mmss(seconds) : left > 0 ? mmss(left) + " · ferma" : "Tempo! · ferma";
        }
        save();
    }

    function go(delta) {
        const next = state.step + delta;
        if (next > steps.length) return close();
        state.step = Math.max(0, next);
        render();
    }
    function toggleTimer() {
        if (timer && timer.step === state.step) {
            clearInterval(timer.id);
            timer = null;
        } else {
            if (timer) clearInterval(timer.id);
            const step = state.step;
            const cur = steps[step - 1];
            timer = { step, left: timerFor(cur.text + " " + cur.sub.join(" ")) };
            timer.id = setInterval(() => {
                timer.left -= 1;
                if (timer.left === 0) ring();
                if (state.step === timer.step) render();
            }, 1000);
        }
        render();
    }
    function ring() {
        try {
            navigator.vibrate && navigator.vibrate([300, 150, 300, 150, 300]);
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            [0, 0.4, 0.8].forEach((at) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.frequency.value = 880;
                g.gain.value = 0.2;
                o.connect(g).connect(ctx.destination);
                o.start(ctx.currentTime + at);
                o.stop(ctx.currentTime + at + 0.25);
            });
        } catch (e) {}
    }

    async function keepAwake() {
        try {
            if (!("wakeLock" in navigator) || root.hidden) return;
            wakeLock = await navigator.wakeLock.request("screen");
            $(".ck-awake").hidden = false;
            wakeLock.addEventListener("release", () => {
                $(".ck-awake").hidden = true;
            });
        } catch (e) {
            $(".ck-awake").hidden = true;
        }
    }
    function open() {
        root.hidden = false;
        document.documentElement.classList.add("cucina-aperta");
        render();
        keepAwake();
        $(".ck-forward").focus();
    }
    function close() {
        root.hidden = true;
        document.documentElement.classList.remove("cucina-aperta");
        if (wakeLock) wakeLock.release().catch(() => {});
        wakeLock = null;
        opener.focus();
    }

    opener.addEventListener("click", open);
    $(".ck-close").addEventListener("click", close);
    $(".ck-back").addEventListener("click", () => go(-1));
    $(".ck-forward").addEventListener("click", () => go(1));
    $(".ck-prev-step").addEventListener("click", () => go(-1));
    $(".ck-next-step").addEventListener("click", () => go(1));
    $(".ck-timer").addEventListener("click", toggleTimer);
    $(".ck-drawer").addEventListener("click", () => {
        drawerOpen = !drawerOpen;
        render();
    });
    $(".ck-mise-dose").addEventListener("click", (e) => {
        if (e.target.closest(".ck-less")) state.serv = Math.max(1, state.serv - 1);
        else if (e.target.closest(".ck-more")) state.serv = Math.min(base * 6, state.serv + 1);
        else return;
        render();
    });
    root.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close();
        else if (e.key === "ArrowRight") go(1);
        else if (e.key === "ArrowLeft") go(-1);
    });
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && !root.hidden) keepAwake();
    });
})();
