// ==UserScript==
// @name         JobApply Prefill
// @namespace    job-search-command-center
// @version      1.0.0
// @description  Stores your profile once and auto-fills application forms on major ATS sites (Greenhouse, Lever, Workday, Instahyre, Workable, SmartRecruiters, Ashby, etc.). You still click Submit yourself.
// @author       omnaladkar
// @match        *://boards.greenhouse.io/*
// @match        *://job-boards.greenhouse.io/*
// @match        *://*.greenhouse.io/*
// @match        *://jobs.lever.co/*
// @match        *://*.workday.com/*
// @match        *://wd*.wd*.workday.com/*
// @match        *://*.instahyre.com/*
// @match        *://*.workable.com/*
// @match        *://*.smartrecruiters.com/*
// @match        *://*.ashbyhq.com/*
// @match        *://careers.smartrecruiters.com/*
// @match        *://jobs.smartrecruiters.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  const KEY = "jobapply_profile_v1";

  // ---------------------------------------------------------------- profile --
  const DEFAULT_PROFILE = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    city: "",
    years_exp: "",
    current_company: "",
    resume_url: "",
    linkedin: "",
  };

  const FIELDS = [
    ["first_name", "First name"],
    ["last_name", "Last name"],
    ["email", "Email"],
    ["phone", "Phone"],
    ["city", "City"],
    ["years_exp", "Years of experience"],
    ["current_company", "Current company"],
    ["resume_url", "Resume / portfolio URL"],
    ["linkedin", "LinkedIn URL"],
  ];

  function getProfile() {
    const raw = GM_getValue(KEY, null);
    return Object.assign({}, DEFAULT_PROFILE, raw || {});
  }

  function saveProfile(p) {
    GM_setValue(KEY, p);
  }

  // ------------------------------------------------------------------ store --
  function makeInput(key, label, value, type) {
    const wrap = document.createElement("label");
    wrap.className = "jap-label";
    wrap.style.cssText =
      "display:block;margin-top:8px;font-size:13px;color:#334155;";
    wrap.appendChild(document.createTextNode(label));
    const el = document.createElement(type || "input");
    el.value = value || "";
    el.dataset.japKey = key;
    el.style.cssText = boxCss();
    wrap.appendChild(el);
    return wrap;
  }

  function boxCss() {
    return (
      "display:block;width:100%;margin-top:4px;padding:6px 8px;" +
      "border:1px solid #cbd5e1;border-radius:6px;font-size:13px;"
    );
  }

  function btnCss(solid) {
    return (
      "margin-top:10px;padding:8px 14px;border-radius:6px;font-size:13px;" +
      "cursor:pointer;border:1px solid #0f766e;" +
      (solid
        ? "background:#0f766e;color:#fff;"
        : "background:#fff;color:#0f766e;")
    );
  }

  function showEditor() {
    const kind = "jap-editor";
    const old = document.querySelector("." + kind);
    if (old) old.remove();

    const profile = getProfile();
    const overlay = document.createElement("div");
    overlay.className = kind;
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:999999;background:rgba(15,23,42,.55);" +
      "display:flex;align-items:center;justify-content:center;";

    const card = document.createElement("div");
    card.style.cssText =
      "background:#fff;border-radius:12px;padding:20px;width:min(480px,94vw);" +
      "max-height:90vh;overflow:auto;box-shadow:0 20px 50px rgba(0,0,0,.3);";

    const title = document.createElement("h3");
    title.textContent = "JobApply Prefill — your profile";
    title.style.cssText =
      "margin:0 0 4px;font-size:16px;font-weight:700;color:#0f172a;";
    card.appendChild(title);

    const sub = document.createElement("p");
    sub.textContent =
      "Stored only in this browser. Free-text fields are never touched — you write those yourself.";
    sub.style.cssText = "margin:0 0 8px;font-size:12px;color:#64748b;";
    card.appendChild(sub);

    const inputs = FIELDS.map(([key, label]) =>
      makeInput(key, label, profile[key], key === "resume_url" ? "url" : "text")
    );
    inputs.forEach((i) => card.appendChild(i));

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.textContent = "Save";
    saveBtn.style.cssText = btnCss(true);
    const skipBtn = document.createElement("button");
    skipBtn.type = "button";
    skipBtn.textContent = "Close";
    skipBtn.style.cssText = btnCss(false);

    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:8px;";
    row.appendChild(saveBtn);
    row.appendChild(skipBtn);
    card.appendChild(row);

    saveBtn.addEventListener("click", () => {
      const next = Object.assign({}, DEFAULT_PROFILE);
      card.querySelectorAll("[data-jap-key]").forEach((el) => {
        next[el.dataset.japKey] = el.value.trim();
      });
      saveProfile(next);
      overlay.remove();
      runFill();
    });
    skipBtn.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  // ------------------------------------------------------------------- fill --
  // Match a form field to a profile key using labels, placeholder, name/id.
  const MATCHERS = [
    {
      key: "email",
      positive: /email/i,
      negative: /confirm|verify/i,
    },
    {
      key: "full_name",
      positive: /full\s*name|your\s*name|what\s*is\s*your\s*name|(^|[_\-\s])name([_\-\s]|[(:*]|$)/i,
      negative: /first|last|surname|company/i,
    },
    {
      key: "first_name",
      positive: /first\s*name|given\s*name/i,
      negative: /last|surname/i,
    },
    {
      key: "last_name",
      positive: /last\s*name|surname|family\s*name/i,
      negative: /first/i,
    },
    {
      key: "phone",
      positive: /phone|mobile|telephone/i,
      negative: /area\s*code|extension/i,
    },
    {
      key: "city",
      positive: /city|current\s*city/i,
      negative: /state|zip|postal/i,
    },
    {
      key: "years_exp",
      positive: /years?[\s\S]*experience|experience[\s\S]*years?|total\s*experience|yoe|years\s*of\s*experience/i,
      negative: /years?\s*of\s*(work|industry)/i,
    },
    {
      key: "current_company",
      positive: /current\s*company|current\s*employer|company\s*\(current\)/i,
      negative: /previous|past|desired|companies/i,
    },
    {
      key: "resume_url",
      positive: /resume|portfolio|github|cv/i,
      negative: /upload|attach|file|drop/i,
    },
    {
      key: "linkedin",
      positive: /linkedin|linked\s*in/i,
      negative: /url\s*of\s*resume/i,
    },
  ];

  function lower(s) {
    return (s || "").toLowerCase();
  }

  function fieldHint(el) {
    // Try multiple sources to know what a field is for.
    let hints = [];
    if (el.id) {
      const label = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
      if (label) hints.push(label.textContent);
    }
    if (el.name) hints.push(el.name.replace(/[\[\]_\-]/g, " "));
    const parent = el.closest("label");
    if (parent && parent.textContent) hints.push(parent.textContent);
    if (el.parentElement && el.parentElement.textContent && el.parentElement.textContent.length < 120 && el.parentElement.childElementCount === 1) {
      hints.push(el.parentElement.textContent);
    }
    if (el.placeholder) hints.push(el.placeholder);
    if (el.getAttribute("aria-label")) hints.push(el.getAttribute("aria-label"));
    if (el.getAttribute("data-test") || el.getAttribute("data-testid")) {
      hints.push(el.getAttribute("data-test") || el.getAttribute("data-testid"));
    }
    return hints.join(" | ");
  }

  function selectValue(el, val) {
    // Fill a <select> with the closest matching <option>.
    const target = String(val).toLowerCase();
    const opts = Array.from(el.options || []);
    let best = null;
    let firstReal = opts.find((o) => o.value && o.text.trim() !== "");
    for (const o of opts) {
      if (!o.value) continue;
      firstReal = firstReal || o;
      if (o.text && o.value.toLowerCase() === target) { el.value = o.value; return true; }
    }
    for (const o of opts) {
      if (o.text && lower(o.text).includes(target)) { el.value = o.value; return true; }
    }
    if (best) { el.value = best.value; return true; }
    void firstReal;
    return false;
  }

  function matchesAny(text, field) {
    const t = lower(text);
    if (!field.positive.test(t)) return false;
    if (field.negative && field.negative.test(t)) return false;
    return true;
  }

  function fillField(el, value) {
    if (!el || el.dataset.japFilled) return false;
    if (el.readOnly || el.disabled) return false;
    const tv = el.value;
    if (tv && String(tv).trim() !== "") return false; // never overwrite user input

    if (el.type === "file") return false; // cannot set file inputs programmatically
    if (el.tagName.toLowerCase() === "select") {
      if (selectValue(el, value)) {
        el.dataset.japFilled = "1";
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      return false;
    }

    const proto = el.tagName.toLowerCase() === "textarea" ? String.prototype : Object.getPrototypeOf(el);
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dataset.japFilled = "1";
    return true;
  }

  function valueFor(key) {
    const p = getProfile();
    if (key !== "full_name") return p[key];
    return [p["first_name"], p["last_name"]].filter(Boolean).join(" ");
  }

  function runFill() {
    if (!getProfile()["email"]) return; // profile not configured yet
    const seen = new Set();
    document.querySelectorAll("input, select, textarea").forEach((el) => {
      if (el.type === "hidden" || el.type === "file") return;
      const hint = fieldHint(el);
      if (!hint.replace(/\s/g, "").length) return;
      for (const field of MATCHERS) {
        if (seen.has(field.key + "|" + hint)) continue;
        if (matchesAny(hint, field)) {
          seen.add(field.key + "|" + hint);
          fillField(el, valueFor(field.key));
          break;
        }
      }
    });

    showToast(
      document.querySelector("[data-jap-filled]") ? "JobApply Prefill: filled your fields." : "JobApply Prefill: nothing to fill here.",
      3000
    );
  }

  // Avoid firing repeatedly for SPA pages — watch for fields added later.
  function watchPage() {
    const mo = new MutationObserver(() => {
      if (getProfile()["email"] && !document.querySelector("[data-jap-filled]")) {
        runFill();
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 15000); // stop after the form has loaded
  }

  function showToast(msg, ms) {
    const kind = "jap-toast";
    const old = document.querySelector("." + kind);
    if (old) old.remove();
    const t = document.createElement("div");
    t.className = kind;
    t.textContent = msg;
    t.style.cssText =
      "position:fixed;bottom:16px;right:16px;z-index:999999;background:#0f172a;" +
      "color:#fff;padding:10px 14px;border-radius:8px;font-size:13px;" +
      "box-shadow:0 8px 24px rgba(0,0,0,.25);";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  // ----------------------------------------------------------- menu/commands --
  GM_registerMenuCommand("JobApply — Edit profile", showEditor);
  GM_registerMenuCommand("JobApply — Prefill form now", runFill);

  // ------------------------------------------------------------------ boot --
  if (!getProfile()["email"]) {
    // No profile yet: show a small nudge chip that opens the editor.
    const chip = document.createElement("button");
    chip.textContent = "⚙ Set up JobApply prefill";
    chip.style.cssText =
      "position:fixed;bottom:16px;right:16px;z-index:999999;padding:10px 14px;" +
      "border-radius:8px;border:none;background:#0f766e;color:#fff;font-size:13px;" +
      "cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25);";
    chip.addEventListener("click", showEditor);
    document.body.appendChild(chip);
    setTimeout(() => chip.remove(), 30000);
  } else {
    runFill();
    watchPage();
  }
})();