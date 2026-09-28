/* ============================================================
   НУМЕРОЛОГ ЭЛЬВИРА - скрипт страницы.
   Плиты и сигнатура «свёртка даты» (герой: кадр складывается из трёх экспозиций
   по --intro, цифры сходятся по --stay; плиты услуг: --open на каждом .fr) ·
   живой расчёт числа по дате рождения в герое · меню · бегущая строка ·
   WhatsApp с текстом по услуге · форма в WhatsApp.
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
var HI = "Здравствуйте, Эльвира! Пишу с сайта.";
var WA_TXT = {
  hero:         HI + " Хочу записаться на консультацию. Вопрос: ",
  razbor:       HI + "\nУслуга: разбор по дате рождения.\nДата рождения: ",
  sovmestimost: HI + "\nУслуга: совместимость пары.\nДаты рождения (обе): ",
  prognoz:      HI + "\nУслуга: прогноз на год.\nДата рождения: ",
  "imya-data":  HI + "\nУслуга: нумерология имени и выбор даты.\nИмя, дата рождения и событие: ",
  biznes:       HI + "\nУслуга: консультация по финансам и работе.\nДата рождения и вопрос: ",
  karty:        HI + "\nУслуга: консультация на картах.\nВопрос: ",
  kontakty:     HI + " Вопрос: "
};
function waUrl(t){ return "https://wa.me/" + CONTACT.wa + "?text=" + encodeURIComponent(t); }
document.querySelectorAll("[data-wa]").forEach(function(a){
  a.href = waUrl(WA_TXT[a.dataset.wa] || WA_TXT.hero);
  a.target = "_blank"; a.rel = "noopener";
});

/* ---------------- ЖИВОЙ РАСЧЁТ ЧИСЛА ПО ДАТЕ (герой) ----------------
   Пример 12.04.1987 показан по умолчанию. Человек нажимает на цифры, вводит свою дату -
   ячейки заполняются, сумма пересчитывается, ссылка «спросить Эльвиру» получает дату и число. */
var sum = document.getElementById("sum");
var bd = document.getElementById("bd");
var cells = [].slice.call(document.querySelectorAll("#sum .dg span"));
var res = document.getElementById("sum-res");
var hint = document.getElementById("sum-hint");
var ask = document.getElementById("ask");
var bigEl = document.getElementById("big");
var EXAMPLE = "12041987";
function reduceChain(digits){
  var chain = [], s = digits.reduce(function(a, b){ return a + b; }, 0);
  chain.push(digits.join("+") + " = " + s);
  while (s > 9) {
    var ds = String(s).split("").map(Number);
    s = ds.reduce(function(a, b){ return a + b; }, 0);
    chain.push(ds.join("+") + " = " + s);
  }
  return { chain: chain, n: s };
}
function validDate(d){
  var dd = +d.slice(0, 2), mm = +d.slice(2, 4), yy = +d.slice(4, 8);
  if (mm < 1 || mm > 12 || dd < 1 || yy < 1900 || yy > new Date().getFullYear()) return false;
  var dim = new Date(yy, mm, 0).getDate();
  return dd <= dim;
}
function renderSum(d, own){
  var digits = d.split("").map(Number);
  var r = reduceChain(digits);
  var html = "";
  r.chain.forEach(function(step, i){
    var last = i === r.chain.length - 1;
    var t = last ? step.replace(/= (\d+)$/, "= <b>$1</b>") : step;
    html += '<span class="' + (i === 0 ? "s1" : "s2") + '">' + t + "</span>";
  });
  res.innerHTML = html;
  res.classList.remove("bad");
  if (bigEl) bigEl.textContent = String(r.n);
  var pretty = d.slice(0, 2) + "." + d.slice(2, 4) + "." + d.slice(4, 8);
  if (ask) ask.href = own
    ? waUrl(HI + " Моя дата рождения: " + pretty + ", число " + r.n + ". Что оно значит?")
    : waUrl(HI + " Хочу узнать, что значит число моей даты рождения. Дата: ");
  if (hint) hint.lastElementChild.textContent = own
    ? "Ваше число - " + r.n + ". Что за ним стоит, расскажет Эльвира"
    : "Это пример. Нажмите на цифры и введите свою дату";
}
function onInput(){
  var v = (bd.value || "").replace(/\D/g, "").slice(0, 8);
  bd.value = v;
  var own = v.length > 0;
  sum.classList.toggle("own", own);
  cells.forEach(function(c, i){
    var ch = own ? (v[i] || "·") : EXAMPLE[i];
    c.textContent = ch;
    c.parentElement.classList.toggle("empty", own && !v[i]);
    c.parentElement.classList.toggle("cur", own ? i === v.length : false);
  });
  if (!own) { renderSum(EXAMPLE, false); return; }
  if (v.length < 8) {
    res.innerHTML = '<span class="s2">введите дату полностью: день, месяц, год</span>';
    res.classList.remove("bad");
    if (hint) hint.lastElementChild.textContent = "Осталось цифр: " + (8 - v.length);
    return;
  }
  if (!validDate(v)) {
    res.innerHTML = '<span class="s2">проверьте дату: день, месяц, год</span>';
    res.classList.add("bad");
    if (hint) hint.lastElementChild.textContent = "Например, 12041987";
    return;
  }
  renderSum(v, true);
}
if (bd && sum) {
  bd.addEventListener("input", onInput);
  bd.addEventListener("focus", function(){ if (!bd.value) cells.forEach(function(c, i){ c.parentElement.classList.toggle("cur", i === 0); }); sum.classList.add("focus"); });
  bd.addEventListener("blur", function(){ if (!bd.value) cells.forEach(function(c){ c.parentElement.classList.remove("cur"); }); });
  /* ссылка «спросить» без своей даты ведёт в WhatsApp с просьбой указать дату */
  renderSum(EXAMPLE, false);
}
/* поле даты в форме: только цифры, точки расставляем сами */
var fbday = document.getElementById("fbday");
if (fbday) fbday.addEventListener("input", function(){
  var v = fbday.value.replace(/\D/g, "").slice(0, 8), out = v;
  if (v.length > 4) out = v.slice(0, 2) + "." + v.slice(2, 4) + "." + v.slice(4);
  else if (v.length > 2) out = v.slice(0, 2) + "." + v.slice(2);
  fbday.value = out;
});

/* ---------------- БЕГУЩАЯ СТРОКА: услуги (герой) ---------------- */
var TICKS = {
  svc: ["Разбор по дате рождения", "Совместимость пары", "Прогноз на год", "Нумерология имени", "Выбор даты для события",
        "Финансы и работа", "Консультация на картах", "Лично и онлайн", "Астана", "Алматы", "Костанай", "Шымкент", "Отвечает сама"]
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

/* дисплейная строка героя в одну строку: ужимаем кегль, пока не влезет */
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

var rsTimer;
addEventListener("resize", function(){
  update();
  clearTimeout(rsTimer);
  rsTimer = setTimeout(function(){ fillTicker(); fitText(); update(); }, 200);
});
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ fillTicker(); fitText(); update(); });

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

/* ---------------- ПЛИТЫ, ИНТРО ГЕРОЯ, КАДРЫ ----------------
   Один слушатель scroll через rAF. На .pw пишем --enter/--exit/--stay;
   на герое --intro (кадр складывается из экспозиций), на каждом .fr - --open по его положению. */
function clamp(v){ return v < 0 ? 0 : (v > 1 ? 1 : v); }
function easeOut(t){ return 1 - Math.pow(1 - t, 3); }
var pws = [].slice.call(document.querySelectorAll(".pw"));
var frames = [].slice.call(document.querySelectorAll(".fr:not(.fr-hero)"));
var heroPw = document.getElementById("top");
var hero = document.getElementById("hero");
var bar = document.getElementById("bar");
var kont = document.getElementById("kontakty");
var introK = 1, introDone = true;
/* ?intro=0.4 / ?open=0.5 в URL - только для проверки промежуточных фаз (checks/) */
var DBG = new URLSearchParams(location.search);
var dbgIntro = parseFloat(DBG.get("intro")), dbgOpen = parseFloat(DBG.get("open"));

function update(){
  var H = innerHeight || root.clientHeight;
  if (root.classList.contains("no-plate")) {
    hdrState();
    if (bar) bar.classList.toggle("show", scrollY > H * 0.55 && !(kont && kont.getBoundingClientRect().top < H * 0.6));
    return;
  }
  pws.forEach(function(pw){
    var r = pw.getBoundingClientRect();
    var enter = clamp(1 - r.top / H);
    var exit  = clamp(1 - r.bottom / H);
    var stay  = r.height > H + 1 ? clamp(-r.top / (r.height - H)) : enter;
    pw.style.setProperty("--enter", enter.toFixed(3));
    pw.style.setProperty("--exit",  exit.toFixed(3));
    pw.style.setProperty("--stay",  stay.toFixed(3));
    pw.classList.toggle("gone", exit >= 1);
    pw.classList.toggle("on", enter > 0.6);
    if (pw === heroPw) {
      var ip = introDone ? 1 : easeOut(introK);
      if (!isNaN(dbgIntro)) ip = dbgIntro;
      pw.style.setProperty("--intro", ip.toFixed(4));
    }
  });
  frames.forEach(function(f){
    var r = f.getBoundingClientRect();
    var e = clamp(1 - r.top / H);                       /* верх кадра вошёл во вьюпорт */
    var open = !isNaN(dbgOpen) ? dbgOpen : easeOut(clamp((e - .18) / .6));
    f.style.setProperty("--open", open.toFixed(3));
  });
  hdrState();
  var onKont = kont && kont.getBoundingClientRect().top < H * 0.6;
  if (bar) bar.classList.toggle("show", scrollY > H * 0.55 && !onKont);
}
if (RED) {
  root.classList.add("no-plate");
  root.classList.add("no-intro");
  if (hero) hero.classList.add("on");
  addEventListener("scroll", function(){ hdrState(); if (bar) bar.classList.toggle("show", scrollY > innerHeight * 0.55); }, {passive:true});
  hdrState();
} else {
  var tick = false;
  addEventListener("scroll", function(){
    if (tick) return; tick = true;
    requestAnimationFrame(function(){ tick = false; update(); });
  }, {passive:true});
  addEventListener("load", update);
  /* интро 1250 мс: три экспозиции складываются в кадр, цифры падают в строку, черта суммы прочерчивается.
     Пропускаем при хэше / прокрутке - человек из рекламы сразу видит собранный экран. */
  var skip = location.hash || scrollY > 80;
  if (skip) {
    root.classList.add("no-intro");
    if (hero) hero.classList.add("on");
    update();
  } else {
    introK = 0; introDone = false; update();
    var t0 = null;
    var step = function(ts){
      if (introDone) return;
      if (t0 === null) t0 = ts;
      var p = clamp((ts - t0) / 1250);
      introK = p;
      if (p > .3 && hero) hero.classList.add("on");
      update();
      if (p < 1) requestAnimationFrame(step);
      else { introDone = true; update(); }
    };
    requestAnimationFrame(function(){ requestAnimationFrame(step); });
    setTimeout(function(){ if (hero) hero.classList.add("on"); }, 700);
    setTimeout(function(){ if (!introDone) { introDone = true; introK = 1; update(); } }, 2400);
  }
}
[1500, 3000, 5000].forEach(function(ms){ setTimeout(update, ms); });
window.plateSync = function(){ introDone = true; introK = 1; if (hero) hero.classList.add("on"); update(); };
addEventListener("hashchange", function(){ root.classList.add("no-intro"); });

/* ---------------- ПОЯВЛЕНИЕ В КАТАЛОЖНЫХ СЕКЦИЯХ ---------------- */
if (HAS_IO) {
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
var form = document.getElementById("form");
if (form) form.addEventListener("submit", function(e){
  e.preventDefault();
  var ok = document.getElementById("fmok"), err = document.getElementById("fmerr");
  if (form.website && form.website.value) return;          /* honeypot */
  var name = form.name.value.trim(), phone = form.phone.value.trim();
  var bday = form.bday.value.trim(), svc = form.svc.value;
  if (!name || phone.replace(/\D/g, "").length < 10) { err.hidden = false; ok.hidden = true; return; }
  err.hidden = true;
  var t = HI + " Заявка.\nИмя: " + name + "\nТелефон: " + phone + "\nДата рождения: " + (bday || "уточню в разговоре") + "\nКонсультация: " + svc;
  ok.hidden = false;
  conv("lead");
  window.open(waUrl(t), "_blank", "noopener");
});

/* ---------------- СТАРТ ---------------- */
fillTicker();
fitText();
hdrState();
})();
