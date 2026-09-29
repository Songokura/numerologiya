/* ============================================================
   АГРИППИНА - Таро и нумерология. Скрипт страницы.
   Плиты и сигнатура «Расклад»: герой - веер из трёх карт (интро по --intro,
   переворот и разлёт по --stay), плиты услуг - карта переворачивается по --open.
   Плюс: меню, якоря, бегущая строка, WhatsApp с текстом по услуге, форма в WhatsApp.
   Библиотек нет. Ссылки tel/wa не перезаписываются в момент клика,
   обработчик кликов - только делегирование в фазе захвата (совместимость с LeadBot).
   ============================================================ */
(function(){
"use strict";

/* ---------------- КОНТАКТЫ (единственное место) ---------------- */
var CONTACT = { wa: "77083374573" };

var RED = matchMedia("(prefers-reduced-motion: reduce)").matches;
var HAS_IO = typeof IntersectionObserver === "function";
var root = document.documentElement;

/* ---------------- КОНВЕРСИИ GOOGLE ADS ----------------
   Ярлыки задаёт index.html (window.CO_CONV) на этапе рекламы. Переход не блокируем. */
function conv(key){
  var id = (window.CO_CONV || {})[key];
  if (!id || typeof window.gtag !== "function") return;
  window.gtag("event", "conversion", {send_to: id, value: 1.0, currency: "USD", transport_type: "beacon"});
}
window.addEventListener("click", function(e){
  var a = e.target.closest ? e.target.closest("a[href]") : null;
  if (!a) return;
  var h = a.getAttribute("href") || "";
  if (h.indexOf("tel:") === 0) conv("phone");
  else if (h.indexOf("wa.me") > -1) conv("contact");
}, true);

/* ---------------- ТЕКСТЫ WhatsApp ПО УСЛУГАМ ---------------- */
var HI = "Здравствуйте, Агриппина! Пишу с сайта.";
var WA_TXT = {
  hero:         HI + " Хочу записаться на консультацию. Вопрос: ",
  taro:         HI + "\nХочу расклад на картах Таро.\nМой вопрос: ",
  razbor:       HI + "\nХочу разбор по дате рождения.\nДата рождения: ",
  sovmestimost: HI + "\nХочу посмотреть совместимость пары.\nДаты рождения (обе): ",
  prognoz:      HI + "\nХочу прогноз на год.\nДата рождения: ",
  situaciya:    HI + "\nХочу консультацию по ситуации.\nКоротко о ситуации: ",
  kontakty:     HI + " Вопрос: "
};
function waUrl(t){ return "https://wa.me/" + CONTACT.wa + "?text=" + encodeURIComponent(t); }
document.querySelectorAll("[data-wa]").forEach(function(a){
  a.href = waUrl(WA_TXT[a.dataset.wa] || WA_TXT.hero);
  a.target = "_blank"; a.rel = "noopener";
});

/* ---------------- БЕГУЩАЯ СТРОКА (герой) ---------------- */
var TICKS = {
  svc: ["Гадание на картах Таро", "Разбор по дате рождения", "Совместимость пары", "Прогноз на год",
        "Консультация по ситуации", "Лично и онлайн", "Отвечаю сама", "Астана", "Алматы", "Костанай", "Шымкент", "Весь Казахстан"]
};
function fillTicker(){
  document.querySelectorAll(".ticker[data-tick]").forEach(function(el){
    var list = TICKS[el.dataset.tick]; if (!list) return;
    var one = list.map(function(t){ return "<b>" + t + "</b>"; }).join("");
    el.innerHTML = one;
    var w = el.scrollWidth || 1000;
    var need = Math.max(2, Math.ceil((innerWidth * 2) / w) + 1);
    var html = "";
    for (var i = 0; i < need; i++) html += one;
    el.innerHTML = html;
    el.style.setProperty("--tkw", w + "px");
    el.style.setProperty("--tkd", Math.max(30, w / 26) + "s");
  });
}

/* ---------------- ДИСПЛЕЙНАЯ СТРОКА ГЕРОЯ: ужимаем кегль, пока не влезет ---------------- */
function fitText(){
  document.querySelectorAll(".h1 .big1").forEach(function(el){
    el.style.fontSize = "";
    if (getComputedStyle(el).whiteSpace !== "nowrap") return;
    var box = el.parentElement.parentElement;
    var bw = box.clientWidth; if (!bw) return;
    var size = parseFloat(getComputedStyle(el).fontSize), base = size;
    while (el.scrollWidth > bw + 1 && size > base * 0.5) { size *= 0.95; el.style.fontSize = size + "px"; }
  });
}

/* ---------------- ВЕЕР КАРТ: размер карты по свободному месту ----------------
   Карта должна поместиться между текстом героя и бегущей строкой, а веер из трёх карт -
   в ширину экрана. Считаем в JS, пишем --ch и --fxr на герое. */
var hero = document.getElementById("hero");
var fan = document.querySelector(".fan");
function fitFan(){
  if (!hero || !fan) return;
  var mob = innerWidth <= 760;
  var fxr = mob ? .38 : .5;
  var freeH = fan.clientHeight;
  var freeW = fan.clientWidth;
  var ch = Math.min(freeH * .94, 400, freeW / (.66 + 2 * fxr) * .98);
  ch = Math.max(140, Math.round(ch));
  hero.style.setProperty("--ch", ch + "px");
  hero.style.setProperty("--fxr", fxr);
}

var rsTimer;
addEventListener("resize", function(){
  update();
  clearTimeout(rsTimer);
  rsTimer = setTimeout(function(){ fillTicker(); fitText(); fitFan(); update(); }, 200);
});
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ fillTicker(); fitText(); fitFan(); update(); });

/* ---------------- МЕНЮ ---------------- */
var burger = document.getElementById("burger");
var mnav = document.getElementById("mnav");
function closeMenu(){
  document.body.classList.remove("menu-open");
  if (burger) burger.setAttribute("aria-expanded", "false");
}
if (burger) burger.addEventListener("click", function(){
  var open = document.body.classList.toggle("menu-open");
  burger.setAttribute("aria-expanded", open ? "true" : "false");
});
if (mnav) mnav.addEventListener("click", function(e){ if (e.target.closest("a")) closeMenu(); });
document.querySelectorAll(".menu-cta a").forEach(function(a){ a.addEventListener("click", closeMenu); });
addEventListener("keydown", function(e){ if (e.key === "Escape") closeMenu(); });

/* ---------------- ЯКОРЯ ---------------- */
var HH = function(){ return parseFloat(getComputedStyle(root).getPropertyValue("--hh")) || 68; };
document.addEventListener("click", function(e){
  var a = e.target.closest('a[href^="#"]'); if (!a) return;
  var id = a.getAttribute("href").slice(1); if (!id) return;
  var t = document.getElementById(id); if (!t) return;
  e.preventDefault();
  closeMenu();
  var top = t.getBoundingClientRect().top + scrollY - (t.classList.contains("pw") ? 0 : HH() + 10);
  scrollTo({ top: Math.max(0, top), behavior: RED ? "auto" : "smooth" });
  try { history.pushState(null, "", "#" + id); } catch(err){}
});

/* ---------------- ШАПКА ---------------- */
var hdr = document.getElementById("hdr");
function hdrState(){ if (hdr) hdr.classList.toggle("solid", scrollY > 40); }

/* ---------------- ПЛИТЫ И ИНТРО ГЕРОЯ ----------------
   Один слушатель scroll через rAF. На .pw пишем --enter/--exit/--stay/--open;
   на герое ещё --intro (карты поднимаются веером, текст всплывает). */
function clamp(v){ return v < 0 ? 0 : (v > 1 ? 1 : v); }
function easeOut(t){ return 1 - Math.pow(1 - t, 3); }
var pws = [].slice.call(document.querySelectorAll(".pw"));
var heroPw = document.getElementById("top");
var bar = document.getElementById("bar");
var kont = document.getElementById("kontakty");
var introK = 1, introDone = true;
/* ?intro=0.4 / ?open=0.5 / ?stay=0.3 в URL - только для проверки промежуточных фаз (checks/) */
var DBG = new URLSearchParams(location.search);
var dbgIntro = parseFloat(DBG.get("intro")), dbgOpen = parseFloat(DBG.get("open")), dbgStay = parseFloat(DBG.get("stay"));

function update(){
  var H = innerHeight || root.clientHeight;
  var onKont = kont && kont.getBoundingClientRect().top < H * 0.6;
  if (root.classList.contains("no-plate")) {
    hdrState();
    if (bar) bar.classList.toggle("show", scrollY > H * 0.55 && !onKont);
    return;
  }
  pws.forEach(function(pw){
    var r = pw.getBoundingClientRect();
    var enter = clamp(1 - r.top / H);
    var exit  = clamp(1 - r.bottom / H);
    var stay  = r.height > H + 1 ? clamp(-r.top / (r.height - H)) : enter;
    if (!isNaN(dbgStay) && pw === heroPw) stay = dbgStay;
    var open  = !isNaN(dbgOpen) ? dbgOpen : easeOut(clamp((enter - .3) / .55));
    pw.style.setProperty("--enter", enter.toFixed(3));
    pw.style.setProperty("--exit",  exit.toFixed(3));
    pw.style.setProperty("--stay",  stay.toFixed(3));
    pw.style.setProperty("--open",  open.toFixed(3));
    pw.classList.toggle("gone", exit >= 1);
    pw.classList.toggle("on", enter > 0.6);
    if (pw === heroPw) {
      var ip = introDone ? 1 : easeOut(introK);
      if (!isNaN(dbgIntro)) ip = dbgIntro;
      pw.style.setProperty("--intro", ip.toFixed(4));
    }
  });
  hdrState();
  if (bar) bar.classList.toggle("show", scrollY > H * 0.55 && !onKont);
}
if (RED) {
  root.classList.add("no-plate");
  root.classList.add("no-intro");
  addEventListener("scroll", function(){ update(); }, {passive:true});
  hdrState();
} else {
  var tick = false;
  addEventListener("scroll", function(){
    if (tick) return; tick = true;
    requestAnimationFrame(function(){ tick = false; update(); });
  }, {passive:true});
  addEventListener("load", update);
  /* интро 1250 мс: карты поднимаются из-под экрана и раскладываются веером, текст всплывает.
     Пропускаем при хэше / прокрутке - человек из рекламы сразу видит собранный экран. */
  var skip = location.hash || scrollY > 80;
  if (skip) {
    root.classList.add("no-intro");
    update();
  } else {
    introK = 0; introDone = false; update();
    var t0 = null;
    var step = function(ts){
      if (introDone) return;
      if (t0 === null) t0 = ts;
      var p = clamp((ts - t0) / 1250);
      introK = p;
      update();
      if (p < 1) requestAnimationFrame(step);
      else { introDone = true; update(); }
    };
    requestAnimationFrame(function(){ requestAnimationFrame(step); });
    setTimeout(function(){ if (!introDone) { introDone = true; introK = 1; update(); } }, 2400);
  }
}
[600, 1500, 3000, 5000].forEach(function(ms){ setTimeout(function(){ fitFan(); update(); }, ms); });
window.plateSync = function(){ introDone = true; introK = 1; root.classList.add("no-intro"); fitFan(); update(); };
addEventListener("hashchange", function(){ root.classList.add("no-intro"); });

/* ---------------- ПОЯВЛЕНИЕ В КАТАЛОЖНЫХ СЕКЦИЯХ ---------------- */
if (HAS_IO && !RED) {
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, {threshold:.08, rootMargin:"0px 0px -6% 0px"});
  document.querySelectorAll(".rv").forEach(function(el){ io.observe(el); });
  setTimeout(function(){ document.querySelectorAll(".rv:not(.in)").forEach(function(el){
    if (el.getBoundingClientRect().top < innerHeight) { el.classList.add("in"); io.unobserve(el); }
  }); }, 1500);
} else {
  document.querySelectorAll(".rv").forEach(function(el){ el.classList.add("in"); });
}

/* ---------------- ФОРМА → WhatsApp ---------------- */
var form = document.getElementById("zayavka");
if (form) form.addEventListener("submit", function(e){
  e.preventDefault();
  var ok = document.getElementById("fmok"), err = document.getElementById("fmerr");
  if (form.website && form.website.value) return;          /* honeypot */
  var name = form.name.value.trim(), phone = form.phone.value.trim();
  var svc = form.svc.value, msg = (form.msg.value || "").trim();
  if (!name || phone.replace(/\D/g, "").length < 10) { err.hidden = false; ok.hidden = true; return; }
  err.hidden = true;
  var t = HI + " Заявка.\nИмя: " + name + "\nТелефон: " + phone + "\nЧто смотрим: " + svc + (msg ? "\nО ситуации: " + msg : "");
  ok.hidden = false;
  conv("lead");
  window.open(waUrl(t), "_blank", "noopener");
});

/* ---------------- СТАРТ ---------------- */
var yr = document.getElementById("year");
if (yr) yr.textContent = String(new Date().getFullYear());
fillTicker();
fitText();
fitFan();
hdrState();
})();
