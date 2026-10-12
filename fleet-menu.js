// Copied byte-identical across the fleet (vanilla pages). Mirrors components/FleetMenu.tsx;
// styled only by fleet.css + --fleet-* tokens. Spec: ~/Developer/DESIGN.md "Fleet menu + footer".
(function () {
  var FLEET_URL = "https://crystalprism.io/apps.json";
  var FOCUSABLE = "a[href],button:not([disabled])";
  var SVG = "http://www.w3.org/2000/svg";
  var panelCount = 0;

  function isApp(o) {
    if (!o || typeof o !== "object") return false;
    var keys = ["key", "name", "url", "icon", "tagline"];
    for (var i = 0; i < keys.length; i++) {
      if (typeof o[keys[i]] !== "string") return false;
    }
    return o.status === "live" || o.status === "hidden";
  }

  function shapeFleet(raw, currentKey, fallback) {
    var hosted = Array.isArray(raw) ? raw.filter(isApp) : [];
    var list = hosted.length ? hosted : (Array.isArray(fallback) ? fallback : []).filter(isApp);
    return list
      .filter(function (app) { return app.status === "live" || app.key === currentKey; })
      .map(function (app) {
        var entry = {};
        for (var k in app) if (Object.prototype.hasOwnProperty.call(app, k)) entry[k] = app[k];
        entry.current = app.key === currentKey;
        return entry;
      });
  }

  function getFleetApps(currentKey, opts) {
    opts = opts || {};
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, 3000);
    return new Promise(function (resolve) {
      // Settles on the timeout even where fetch ignores the abort signal
      var late = setTimeout(function () { resolve(shapeFleet(null, currentKey, opts.fallback)); }, 3100);
      fetch(opts.url || FLEET_URL, controller ? { signal: controller.signal } : {})
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (json) { resolve(shapeFleet(json, currentKey, opts.fallback)); })
        .catch(function () { resolve(shapeFleet(null, currentKey, opts.fallback)); })
        .then(function () { clearTimeout(timer); clearTimeout(late); });
    });
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function gridGlyph() {
    var svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("width", "18");
    svg.setAttribute("height", "18");
    svg.setAttribute("viewBox", "0 0 18 18");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("fill", "currentColor");
    [2, 8, 14].forEach(function (y) {
      [2, 8, 14].forEach(function (x) {
        var c = document.createElementNS(SVG, "circle");
        c.setAttribute("cx", String(x + 1));
        c.setAttribute("cy", String(y + 1));
        c.setAttribute("r", "1.6");
        svg.appendChild(c);
      });
    });
    return svg;
  }

  function mountMenu(container, opts) {
    var apps = opts.apps || [];
    var user = opts.user || null;
    var rows = opts.rows || [];
    var placement = opts.placement === "up-start" ? "up-start" : "down-end";
    var panelId = "fleet-panel-" + (++panelCount);
    var trigger = el("button", "fleet-trigger");
    var scrim = null;
    var panel = null;
    var pos = {};
    trigger.type = "button";
    trigger.setAttribute("aria-expanded", "false");
    container.appendChild(trigger);

    // The user's label, trimmed; "" when blank, so nothing renders an empty initial or line
    function who() {
      return user && typeof user.label === "string" ? user.label.trim() : "";
    }

    function paintTrigger() {
      while (trigger.firstChild) trigger.removeChild(trigger.firstChild);
      if (who()) {
        var initial = el("span", null, who().charAt(0).toUpperCase());
        initial.setAttribute("aria-hidden", "true");
        trigger.appendChild(initial);
        trigger.setAttribute("aria-label", "Apps and account, " + who());
      } else {
        trigger.appendChild(gridGlyph());
        trigger.setAttribute("aria-label", user ? "Apps and account" : "Apps and sign in");
      }
    }

    function fillPanel() {
      while (panel.firstChild) panel.removeChild(panel.firstChild);
      if (user || rows.length) {
        var account = el("div", "fleet-account");
        if (who()) account.appendChild(el("p", "fleet-email", who()));
        rows.forEach(function (row) {
          var node;
          if (row.href) {
            node = el("a", "fleet-row", row.label);
            node.href = row.href;
          } else {
            node = el("button", "fleet-row", row.label);
            node.type = "button";
            node.addEventListener("click", function () {
              hide(false);
              if (row.onSelect) row.onSelect();
            });
          }
          account.appendChild(node);
        });
        panel.appendChild(account);
      }
      var list = el("ul", "fleet-apps");
      apps.forEach(function (app) {
        var li = el("li");
        var a = el("a", "fleet-app");
        a.href = app.url;
        if (app.current) a.setAttribute("aria-current", "page");
        var img = el("img");
        img.src = app.icon;
        img.alt = "";
        img.width = 40;
        img.height = 40;
        img.loading = "eager";
        img.decoding = "async";
        a.appendChild(img);
        a.appendChild(el("span", null, app.name));
        li.appendChild(a);
        list.appendChild(li);
      });
      panel.appendChild(list);
    }

    function onKey(e) {
      if (e.key === "Escape") return hide(true);
      if (e.key !== "Tab" || !panel) return;
      var items = panel.querySelectorAll(FOCUSABLE);
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); if (last) last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); if (first) first.focus(); }
    }

    function onDown(e) {
      if ((panel && panel.contains(e.target)) || trigger.contains(e.target)) return;
      hide(true);
    }

    function onResize() { hide(false); }

    function show() {
      var r = trigger.getBoundingClientRect();
      // clientWidth/Height, not innerWidth/Height: a fixed panel's offsets are
      // measured from the viewport inside a classic scrollbar (0 where there is no layout)
      var vw = document.documentElement.clientWidth || window.innerWidth;
      var vh = document.documentElement.clientHeight || window.innerHeight;
      pos = placement === "up-start"
        ? { bottom: vh - r.top + 8, left: Math.max(16, r.left), maxBlockSize: Math.max(160, Math.min(640, r.top - 24)) }
        : { top: r.bottom + 8, right: Math.max(16, vw - r.right), maxBlockSize: Math.max(160, Math.min(640, vh - r.bottom - 24)) };
      scrim = el("div", "fleet-scrim");
      scrim.setAttribute("aria-hidden", "true");
      panel = el("div", "fleet-panel");
      panel.id = panelId;
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("aria-label", "Crystal Prism apps and account");
      for (var k in pos) panel.style[k] = pos[k] + "px";
      fillPanel();
      document.body.appendChild(scrim);
      document.body.appendChild(panel);
      trigger.setAttribute("aria-expanded", "true");
      trigger.setAttribute("aria-controls", panelId);
      var first = panel.querySelector(FOCUSABLE);
      if (first) first.focus();
      document.addEventListener("keydown", onKey);
      document.addEventListener("pointerdown", onDown);
      window.addEventListener("resize", onResize);
      window.addEventListener("scroll", onResize, { passive: true });
    }

    function hide(refocus) {
      if (!panel) return;
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
      if (scrim.parentNode) scrim.parentNode.removeChild(scrim);
      if (panel.parentNode) panel.parentNode.removeChild(panel);
      scrim = null;
      panel = null;
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("aria-controls");
      if (refocus) trigger.focus();
    }

    trigger.addEventListener("click", function () {
      if (panel) hide(false);
      else show();
    });
    paintTrigger();

    return {
      setApps: function (next) {
        apps = next || [];
        if (panel) fillPanel();
      },
      setUser: function (nextUser, nextRows) {
        user = nextUser || null;
        rows = nextRows || [];
        paintTrigger();
        if (panel) fillPanel();
      },
      close: function () { hide(false); },
    };
  }

  function renderFooter(parent) {
    var footer = el("footer", "fleet-footer");
    var home = el("a", null, "© 2017–" + new Date().getFullYear() + " Crystal Prism");
    home.href = "https://crystalprism.io";
    var dot = el("span", null, "·");
    dot.setAttribute("aria-hidden", "true");
    var all = el("a", null, "All apps");
    all.href = "https://crystalprism.io/#projects";
    footer.appendChild(home);
    footer.appendChild(dot);
    footer.appendChild(all);
    parent.appendChild(footer);
    return footer;
  }

  window.FleetKit = { FLEET_URL: FLEET_URL, shapeFleet: shapeFleet, getFleetApps: getFleetApps, mountMenu: mountMenu, renderFooter: renderFooter };
})();
