(function () {
  "use strict";

  var WIDGET_HOST = "https://supabase-scanner.vercel.app";
  var CACHE_TTL = 300000; // 5 minutes
  var cache = {};

  var GRADE_COLORS = {
    A: { bg: "#d1fae5", text: "#047857", border: "#a7f3d0" },
    B: { bg: "#ecfccb", text: "#4d7c0f", border: "#d9f99d" },
    C: { bg: "#fef3c7", text: "#a16207", border: "#fde68a" },
    D: { bg: "#ffedd5", text: "#c2410c", border: "#fed7aa" },
    F: { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" },
  };

  var SEVERITY_COLORS = {
    critical: "#b91c1c",
    high: "#c2410c",
    medium: "#a16207",
    low: "#1d4ed8",
  };

  function getStyles(theme) {
    var isDark = theme === "dark";
    var bg = isDark ? "#1c1917" : "#ffffff";
    var text = isDark ? "#faf9f7" : "#1c1917";
    var muted = isDark ? "#a8a29e" : "#78716c";
    var border = isDark ? "#44403c" : "#e8e5e0";
    var cardBg = isDark ? "#292524" : "#faf9f7";

    return (
      ":host { display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; }" +
      ".ss-widget { background: " + bg + "; color: " + text + "; border: 1px solid " + border + "; border-radius: 12px; padding: 16px; min-width: 200px; max-width: 360px; box-sizing: border-box; }" +
      ".ss-widget a { color: " + muted + "; text-decoration: none; font-size: 11px; }" +
      ".ss-widget a:hover { text-decoration: underline; }" +
      ".ss-header { display: flex; align-items: center; gap: 12px; }" +
      ".ss-grade { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 600; flex-shrink: 0; border: 2px solid transparent; }" +
      ".ss-grade-compact { width: 32px; height: 32px; font-size: 16px; }" +
      ".ss-info { flex: 1; min-width: 0; }" +
      ".ss-label { font-size: 14px; font-weight: 600; margin: 0; }" +
      ".ss-date { font-size: 12px; color: " + muted + "; margin: 2px 0 0; }" +
      ".ss-findings { margin-top: 12px; padding-top: 12px; border-top: 1px solid " + border + "; }" +
      ".ss-findings-title { font-size: 12px; font-weight: 600; color: " + muted + "; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px; }" +
      ".ss-findings-grid { display: flex; gap: 8px; flex-wrap: wrap; }" +
      ".ss-finding-badge { font-size: 12px; padding: 2px 8px; border-radius: 9999px; font-weight: 500; background: " + cardBg + "; }" +
      ".ss-footer { margin-top: 12px; text-align: right; }" +
      ".ss-placeholder { text-align: center; padding: 12px; color: " + muted + "; font-size: 13px; }" +
      ".ss-error { text-align: center; padding: 12px; color: #b91c1c; font-size: 13px; }" +
      "@keyframes ss-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }" +
      ".ss-loading .ss-grade { background: " + border + "; animation: ss-pulse 1.5s infinite; }" +
      ".ss-loading .ss-label { background: " + border + "; border-radius: 4px; height: 16px; width: 100px; animation: ss-pulse 1.5s infinite; }" +
      ".ss-loading .ss-date { background: " + border + "; border-radius: 4px; height: 12px; width: 80px; display: inline-block; animation: ss-pulse 1.5s infinite; }"
    );
  }

  function resolveTheme(preference) {
    if (preference === "light" || preference === "dark") return preference;
    if (typeof window.matchMedia === "function") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  }

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "";
    }
  }

  function renderLoading(container, isCompact) {
    container.innerHTML =
      '<div class="ss-widget ss-loading">' +
      '<div class="ss-header">' +
      '<div class="ss-grade' + (isCompact ? " ss-grade-compact" : "") + '"></div>' +
      (isCompact
        ? ""
        : '<div class="ss-info"><div class="ss-label"></div><div class="ss-date"></div></div>') +
      "</div></div>";
  }

  function renderError(container, message) {
    container.innerHTML =
      '<div class="ss-widget"><div class="ss-error">' + message + "</div></div>";
  }

  function renderWidget(container, data, options) {
    var isCompact = options.size === "compact";
    var showFindings = options.showFindings && !isCompact;
    var colors = GRADE_COLORS[data.grade] || GRADE_COLORS.F;

    var gradeClass = "ss-grade" + (isCompact ? " ss-grade-compact" : "");
    var gradeStyle =
      "background:" + colors.bg + ";color:" + colors.text + ";border-color:" + colors.border + ";";

    var html =
      '<div class="ss-widget">' +
      '<div class="ss-header">' +
      '<div class="' + gradeClass + '" style="' + gradeStyle + '">' + data.grade + "</div>";

    if (!isCompact) {
      html +=
        '<div class="ss-info">' +
        '<p class="ss-label">' + data.label + "</p>" +
        '<p class="ss-date">Scanned ' + formatDate(data.scanDate) + "</p>" +
        "</div>";
    }

    html += "</div>";

    if (showFindings && data.totalFindings > 0) {
      html += '<div class="ss-findings">';
      html += '<p class="ss-findings-title">Findings</p>';
      html += '<div class="ss-findings-grid">';

      var severities = [
        { key: "critical", count: data.critical },
        { key: "high", count: data.high },
        { key: "medium", count: data.medium },
        { key: "low", count: data.low },
      ];

      for (var i = 0; i < severities.length; i++) {
        var s = severities[i];
        if (s.count > 0) {
          html +=
            '<span class="ss-finding-badge" style="color:' +
            SEVERITY_COLORS[s.key] +
            '">' +
            s.count + " " + s.key +
            "</span>";
        }
      }

      html += "</div></div>";
    }

    html +=
      '<div class="ss-footer">' +
      '<a href="' + WIDGET_HOST + '" target="_blank" rel="noopener">Secured by SupaScanner</a>' +
      "</div></div>";

    container.innerHTML = html;
  }

  function fetchData(projectId, callback) {
    var cacheKey = projectId;
    var cached = cache[cacheKey];
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      callback(null, cached.data);
      return;
    }

    var url = WIDGET_HOST + "/api/widget/" + encodeURIComponent(projectId);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.timeout = 10000;

    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          cache[cacheKey] = { data: data, ts: Date.now() };
          callback(null, data);
        } catch (e) {
          callback("Invalid response");
        }
      } else if (xhr.status === 404) {
        callback("Project not found");
      } else if (xhr.status === 429) {
        callback("Rate limit exceeded");
      } else {
        callback("Failed to load");
      }
    };

    xhr.onerror = function () {
      callback("Network error");
    };
    xhr.ontimeout = function () {
      callback("Request timed out");
    };
    xhr.send();
  }

  function initWidget(script) {
    var projectId = script.getAttribute("data-project");
    if (!projectId) return;

    var themePreference = script.getAttribute("data-theme") || "auto";
    var size = script.getAttribute("data-size") || "full";
    var showFindings = script.getAttribute("data-show-findings") !== "false";

    var wrapper = document.createElement("div");
    script.parentNode.insertBefore(wrapper, script.nextSibling);

    var shadow = wrapper.attachShadow({ mode: "closed" });
    var theme = resolveTheme(themePreference);

    var styleEl = document.createElement("style");
    styleEl.textContent = getStyles(theme);
    shadow.appendChild(styleEl);

    var container = document.createElement("div");
    shadow.appendChild(container);

    var isCompact = size === "compact";
    renderLoading(container, isCompact);

    fetchData(projectId, function (err, data) {
      if (err) {
        renderError(container, err);
        return;
      }
      renderWidget(container, data, {
        size: size,
        showFindings: showFindings,
      });
    });

    if (themePreference === "auto" && typeof window.matchMedia === "function") {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onThemeChange = function () {
        var newTheme = mq.matches ? "dark" : "light";
        styleEl.textContent = getStyles(newTheme);
      };
      if (mq.addEventListener) {
        mq.addEventListener("change", onThemeChange);
      }
    }
  }

  var scripts = document.querySelectorAll('script[data-project][src*="widget"]');
  for (var i = 0; i < scripts.length; i++) {
    initWidget(scripts[i]);
  }
})();
