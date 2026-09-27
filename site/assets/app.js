(function () {
  "use strict";

  const core = window.AlmanacCore;
  if (!core) throw new Error("黄历核心未加载");

  const elements = Object.fromEntries(
    [
      "displayDate", "weekday", "datePicker", "lunarDate", "ganZhiText", "zodiac", "solarTerm",
      "yiList", "jiList", "chong", "sha", "wealth", "joy", "fortune", "dependency", "fullRows",
      "fullPanel", "toggleFull", "explanationModal", "explanationTitle", "explanationOriginal",
      "explanationPlain", "explanationDeep", "calendarModal", "calendarTitle", "calendarGrid"
    ].map((id) => [id, document.getElementById(id)])
  );

  const state = {
    selectedDate: initialDate(),
    calendarYear: 0,
    calendarMonth: 0,
    almanac: null
  };

  function initialDate() {
    const requested = new URLSearchParams(window.location.search).get("date");
    if (requested) {
      try {
        core.assertSupportedDate(requested);
        return requested;
      } catch (_) {}
    }
    return core.getTodayInConfiguredZone();
  }

  function text(id, value) {
    elements[id].textContent = value || "—";
  }

  function renderTags(container, values) {
    container.replaceChildren();
    for (const value of values.length ? values : ["无"]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "term-tag";
      button.dataset.explainType = "activity";
      button.dataset.explainValue = value;
      button.textContent = value;
      container.append(button);
    }
  }

  const detailRows = [
    ["建除十二神", "twelveOfficer", (data) => `${data.twelveOfficer}日`],
    ["黄道 / 黑道", "huangHei", (data) => `${data.dayGod.type}${data.dayGod.luck ? ` · ${data.dayGod.luck}` : ""}`],
    ["值神", "dayGod", (data) => data.dayGod.name],
    ["彭祖百忌", "pengZu", (data) => data.pengZu.join("；")],
    ["二十八宿", "mansion", (data) => data.mansion.label],
    ["纳音", "naYin", (data) => data.naYin],
    ["常用吉神", "auspiciousGods", (data) => data.auspiciousGods.join("、") || "无"],
    ["常用凶神", "inauspiciousGods", (data) => data.inauspiciousGods.join("、") || "无"]
  ];

  function renderFullRows(data) {
    elements.fullRows.replaceChildren();
    for (const [label, type, getValue] of detailRows) {
      const value = getValue(data);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "detail-row";
      button.dataset.explainType = type;
      button.dataset.explainValue = type === "dayGod" ? data.dayGod.name : value;
      const labelElement = document.createElement("span");
      labelElement.textContent = label;
      const valueElement = document.createElement("strong");
      valueElement.textContent = value;
      button.append(labelElement, valueElement);
      elements.fullRows.append(button);
    }
  }

  function render(date) {
    const data = core.buildAlmanac(date);
    state.selectedDate = date;
    state.almanac = data;
    text("displayDate", data.displayDate);
    text("weekday", data.weekday);
    elements.datePicker.value = date;
    text("lunarDate", data.lunarDate);
    text("ganZhiText", `${data.ganZhi.year}年 · ${data.ganZhi.month}月 · ${data.ganZhi.day}日`);
    text("zodiac", `${data.zodiac}年`);
    text("solarTerm", data.solarTerm.label);
    elements.solarTerm.title = data.solarTerm.detail;
    renderTags(elements.yiList, data.yi);
    renderTags(elements.jiList, data.ji);
    text("chong", data.chong);
    text("sha", data.sha);
    text("wealth", data.directions.wealth);
    text("joy", data.directions.joy);
    text("fortune", data.directions.fortune);
    text("dependency", `${data.dependency} · ${data.timezone} · ${data.supportedRange.start}—${data.supportedRange.end}`);
    renderFullRows(data);
    window.history.replaceState(null, "", `${window.location.pathname}?date=${date}`);
    window.__H5_ALMANAC_STATE__ = { currentDate: date, almanac: data };
  }

  function selectDate(date) {
    try {
      core.assertSupportedDate(date);
      render(date);
      closeModal("calendarModal");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      window.alert(error.message);
    }
  }

  function openModal(id) {
    document.getElementById(id).hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeModal(id) {
    document.getElementById(id).hidden = true;
    if (!document.querySelector(".modal:not([hidden])")) document.body.classList.remove("modal-open");
  }

  function showExplanation(type, value) {
    const explanation = core.getExplanation(type, value);
    text("explanationTitle", explanation.original);
    text("explanationOriginal", explanation.original);
    text("explanationPlain", explanation.plain_explanation);
    text("explanationDeep", explanation.deep_explanation);
    openModal("explanationModal");
  }

  function valueForSource(source) {
    if (source === "lunarDate") return state.almanac.lunarDate;
    if (source === "ganZhiText") return elements.ganZhiText.textContent;
    if (source === "zodiac") return state.almanac.zodiac;
    if (source === "solarTerm") return state.almanac.solarTerm.label;
    if (["wealth", "joy", "fortune"].includes(source)) return state.almanac.directions[source];
    return state.almanac[source] || "";
  }

  function formatDate(year, month, day) {
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function openCalendar() {
    const { year, month } = core.parseDateString(state.selectedDate);
    state.calendarYear = year;
    state.calendarMonth = month;
    renderCalendar();
    openModal("calendarModal");
  }

  function moveCalendar(delta) {
    const monthIndex = state.calendarYear * 12 + state.calendarMonth - 1 + delta;
    state.calendarYear = Math.floor(monthIndex / 12);
    state.calendarMonth = (monthIndex % 12 + 12) % 12 + 1;
    if (state.calendarYear < 1901) { state.calendarYear = 1901; state.calendarMonth = 1; }
    if (state.calendarYear > 2100) { state.calendarYear = 2100; state.calendarMonth = 12; }
    renderCalendar();
  }

  function renderCalendar() {
    elements.calendarTitle.textContent = `${state.calendarYear}年${state.calendarMonth}月`;
    elements.calendarGrid.replaceChildren();
    const firstWeekday = new Date(Date.UTC(state.calendarYear, state.calendarMonth - 1, 1)).getUTCDay();
    const previousMonthDate = new Date(Date.UTC(state.calendarYear, state.calendarMonth - 2, 1));
    const previousYear = previousMonthDate.getUTCFullYear();
    const previousMonth = previousMonthDate.getUTCMonth() + 1;
    const previousDays = core.daysInMonth(previousYear, previousMonth);
    const currentDays = core.daysInMonth(state.calendarYear, state.calendarMonth);

    for (let cell = 0; cell < 42; cell += 1) {
      let year = state.calendarYear;
      let month = state.calendarMonth;
      let day = cell - firstWeekday + 1;
      let outside = false;
      if (day < 1) {
        year = previousYear;
        month = previousMonth;
        day += previousDays;
        outside = true;
      } else if (day > currentDays) {
        const next = new Date(Date.UTC(state.calendarYear, state.calendarMonth, 1));
        year = next.getUTCFullYear();
        month = next.getUTCMonth() + 1;
        day -= currentDays;
        outside = true;
      }

      const date = formatDate(year, month, day);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `calendar-day${outside ? " outside" : ""}${date === state.selectedDate ? " selected" : ""}`;
      button.dataset.date = date;
      button.disabled = date < core.SUPPORTED_DATE_RANGE.start || date > core.SUPPORTED_DATE_RANGE.end;
      const calendarDay = button.disabled ? { lunarLabel: "", solarTerm: "" } : core.buildCalendarDay(date);
      const dayElement = document.createElement("strong");
      dayElement.textContent = String(day);
      const detailElement = document.createElement("small");
      detailElement.textContent = calendarDay.solarTerm || calendarDay.lunarLabel;
      button.append(dayElement, detailElement);
      elements.calendarGrid.append(button);
    }
  }

  document.getElementById("previousDay").addEventListener("click", () => selectDate(core.shiftDate(state.selectedDate, -1)));
  document.getElementById("nextDay").addEventListener("click", () => selectDate(core.shiftDate(state.selectedDate, 1)));
  document.getElementById("todayButton").addEventListener("click", () => selectDate(core.getTodayInConfiguredZone()));
  elements.datePicker.addEventListener("change", (event) => selectDate(event.target.value));
  document.getElementById("openCalendar").addEventListener("click", openCalendar);
  document.getElementById("calendarPrevious").addEventListener("click", () => moveCalendar(-1));
  document.getElementById("calendarNext").addEventListener("click", () => moveCalendar(1));
  elements.calendarGrid.addEventListener("click", (event) => {
    const day = event.target.closest("[data-date]");
    if (day && !day.disabled) selectDate(day.dataset.date);
  });

  elements.toggleFull.addEventListener("click", () => {
    const expanded = elements.toggleFull.getAttribute("aria-expanded") === "true";
    elements.toggleFull.setAttribute("aria-expanded", String(!expanded));
    elements.fullPanel.hidden = expanded;
    elements.toggleFull.firstChild.textContent = expanded ? "查看完整黄历 " : "收起完整黄历 ";
  });

  document.addEventListener("click", (event) => {
    const closeButton = event.target.closest("[data-close-modal]");
    if (closeButton) closeModal(closeButton.dataset.closeModal);
    const target = event.target.closest("[data-explain-type]");
    if (!target) return;
    const value = target.dataset.explainValue || valueForSource(target.dataset.valueSource);
    showExplanation(target.dataset.explainType, value);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    for (const modal of document.querySelectorAll(".modal:not([hidden])")) closeModal(modal.id);
  });

  render(state.selectedDate);
  window.__H5_ALMANAC_API__ = Object.freeze({ selectDate, openCalendar, showExplanation });
})();
