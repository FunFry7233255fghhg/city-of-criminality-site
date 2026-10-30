/* ============ City of Criminality — Launcher logic ============ */

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const electronAPI = window.cocAPI || null; // доступен только внутри Electron

/* ---------- уведомления ---------- */
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- навигация ---------- */
$$(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    const page = btn.dataset.page;

    if (page === "exit") {
      if (electronAPI) electronAPI.quit();
      else toast("Выход доступен в десктоп-версии");
      return;
    }

    $$(".nav-item").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    $$(".page").forEach((p) => p.classList.remove("active"));
    $("#page-" + page).classList.add("active");
  });
});

/* ---------- настройки ---------- */
const settings = Object.assign(
  { nick: "Игрок", ram: 4, size: "1920x1080", fullscreen: false, keepopen: true },
  JSON.parse(localStorage.getItem("coc-settings") || "{}")
);

function saveSettings() {
  settings.nick = $("#set-nick").value.trim() || "Игрок";
  settings.ram = Math.min(16, Math.max(1, Number($("#set-ram").value) || 4));
  settings.size = $("#set-size").value;
  settings.fullscreen = $("#set-fullscreen").checked;
  settings.keepopen = $("#set-keepopen").checked;
  localStorage.setItem("coc-settings", JSON.stringify(settings));
  applySettings();
}

function applySettings() {
  $("#set-nick").value = settings.nick;
  $("#set-ram").value = settings.ram;
  $("#set-size").value = settings.size;
  $("#set-fullscreen").checked = settings.fullscreen;
  $("#set-keepopen").checked = settings.keepopen;
  $$(".user-name").forEach((el) => (el.textContent = settings.nick));
}

$$(".set-row input, .set-row select").forEach((el) =>
  el.addEventListener("change", () => {
    saveSettings();
    toast("Настройки сохранены");
  })
);
applySettings();

/* ---------- копирование ---------- */
function copyText(text) {
  navigator.clipboard?.writeText(text).then(
    () => toast("Скопировано: " + text),
    () => toast("Не удалось скопировать")
  );
}
$("#copy-ip")?.addEventListener("click", () => copyText($("#server-ip").textContent));
$$("[data-copy]").forEach((b) =>
  b.addEventListener("click", () => copyText(b.dataset.copy))
);

/* ---------- кнопки окна ---------- */
$("#btn-min")?.addEventListener("click", () => electronAPI && electronAPI.minimize());
$("#btn-max")?.addEventListener("click", () => electronAPI && electronAPI.maximize());
$("#btn-close")?.addEventListener("click", () =>
  electronAPI ? electronAPI.close() : toast("Закрытие доступно в десктоп-версии")
);

/* ---------- запуск игры ---------- */
const overlay = $("#launch-overlay");
const bar = $("#launch-progress");
const status = $("#launch-status");
let launching = false;

$("#play-btn").addEventListener("click", async () => {
  if (launching) return;
  launching = true;
  overlay.classList.add("show");
  bar.style.width = "0%";

  const steps = [
    [8, "Проверка файлов игры..."],
    [25, "Загрузка модов City of Criminality..."],
    [48, "Аутентификация: " + settings.nick + "..."],
    [70, "Проверка обновлений сервера..."],
    [90, "Запуск Minecraft " + (settings.version || "1.20.4") + "..."],
    [100, "Готово! Игра запускается..."],
  ];

  try {
    if (electronAPI) {
      // Реальный запуск через Electron
      const { ram, nick, fullscreen, size } = settings;
      const [w, h] = size.split("x").map(Number);
      await electronAPI.launchGame({
        username: nick,
        ram,
        width: w,
        height: h,
        fullscreen,
        server: "play.cityofcriminality.ru",
      });
      for (const [pct, text] of steps) {
        status.textContent = text;
        bar.style.width = pct + "%";
        await sleep(420);
      }
      toast("Minecraft запущен!");
      if (!settings.keepopen) setTimeout(() => electronAPI.close(), 900);
    } else {
      // Демо-режим (открытие index.html в браузере)
      for (const [pct, text] of steps) {
        status.textContent = text;
        bar.style.width = pct + "%";
        await sleep(520);
      }
      toast("Демо-режим: установите десктоп-версию для запуска игры");
    }
  } catch (err) {
    status.textContent = "Ошибка запуска: " + (err?.message || err);
    toast("Ошибка запуска игры");
    await sleep(1800);
  } finally {
    launching = false;
    overlay.classList.remove("show");
  }
});

$("#launch-cancel").addEventListener("click", () => {
  if (launching) {
    launching = false;
    overlay.classList.remove("show");
    toast("Запуск отменён");
  }
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- живой онлайн ---------- */
let online = 342;
setInterval(() => {
  online = Math.max(300, Math.min(420, online + Math.round((Math.random() - 0.5) * 14)));
  $("#online-count").textContent = online + " / 1000";
  const c = $(".ss-count");
  if (c) c.innerHTML = online + ' <span>/ 1000</span>';
  const b = $(".ss-bar i");
  if (b) b.style.width = (online / 10).toFixed(1) + "%";
}, 5000);
