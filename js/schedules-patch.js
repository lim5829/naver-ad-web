// schedules-patch.js — 노출 시간대 표시/편집 UI

// ─────────────────────────────────────────────
// 1. 상수 / 유틸리티
// ─────────────────────────────────────────────

var SCH_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
var SCH_DAY_LABELS = { SUN: '일', MON: '월', TUE: '화', WED: '수', THU: '목', FRI: '금', SAT: '토' };
var SCH_ALL_HOURS = 16777215; // 2^24 - 1 (리터럴, 비트연산 없음)

// 2의 거듭제곱 테이블 (0~23시) — <<, ~, & 연산자 완전 제거
var SCH_POW2 = (function() {
  var t = []; var v = 1;
  for (var i = 0; i < 24; i++) { t.push(v); v = v * 2; }
  return t;
})();

function schHasBit(mask, h) {
  return Math.floor(mask / SCH_POW2[h]) % 2 === 1;
}
function schSetBit(mask, h) {
  return schHasBit(mask, h) ? mask : mask + SCH_POW2[h];
}
function schClearBit(mask, h) {
  return schHasBit(mask, h) ? mask - SCH_POW2[h] : mask;
}

function schParseSchedules(schedules) {
  var result = {};
  SCH_DAYS.forEach(function(day) {
    var val = schedules && schedules[day];
    result[day] = (val === undefined || val === null) ? SCH_ALL_HOURS : val;
  });
  return result;
}

function schGetActiveHours(mask) {
  var hours = [];
  for (var h = 0; h < 24; h++) { if (schHasBit(mask, h)) hours.push(h); }
  return hours;
}

function schHoursToBitmask(hours) {
  var mask = 0;
  hours.forEach(function(h) { mask = schSetBit(mask, h); });
  return mask;
}

function schPad2(n) { var s = String(n); return s.length < 2 ? '0' + s : s; }

function schFormatHourRanges(hours) {
  if (!hours.length) return '없음';
  if (hours.length === 24) return '전체';
  var sorted = hours.slice().sort(function(a, b) { return a - b; });
  var ranges = [];
  var start = sorted[0], end = sorted[0];
  for (var i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) { end = sorted[i]; }
    else {
      ranges.push(start === end ? schPad2(start)+'시' : schPad2(start)+'~'+schPad2(end)+'시');
      start = end = sorted[i];
    }
  }
  ranges.push(start === end ? schPad2(start)+'시' : schPad2(start)+'~'+schPad2(end)+'시');
  return ranges.join(', ');
}

function schFormatSummary(schedules) {
  var parsed = schParseSchedules(schedules);
  if (SCH_DAYS.every(function(d) { return parsed[d] === SCH_ALL_HOURS; })) return '전체 시간대';
  if (SCH_DAYS.every(function(d) { return parsed[d] === 0; })) return '비활성';
  var activeDays = SCH_DAYS.filter(function(d) { return parsed[d] !== 0; });
  if (!activeDays.length) return '비활성';
  var timeStr = schFormatHourRanges(schGetActiveHours(parsed[activeDays[0]]));
  return activeDays.map(function(d) { return SCH_DAY_LABELS[d]; }).join('') + ' / ' + timeStr;
}

// ─────────────────────────────────────────────
// 2. 모달 상태
// ─────────────────────────────────────────────

var _schModalAg = null;
var _schEditData = {};
var _schDragging = false;
var _schDragActive = null;

// ─────────────────────────────────────────────
// 3. 광고그룹 카드 섹션 렌더
// ─────────────────────────────────────────────

function renderScheduleSection(adGroup) {
  var summary = schFormatSummary(adGroup.schedules);
  var id = adGroup.id || adGroup.adgroupId || '';
  return (
    '<div class="schedule-section" style="margin-top:10px;padding:8px 10px;background:rgba(0,0,0,0.03);border-radius:6px;border:1px solid rgba(0,0,0,0.07);">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
        '<div style="display:flex;align-items:center;gap:6px;min-width:0;">' +
          '<span style="font-size:13px;color:#666;white-space:nowrap;">⏰ 노출 시간대</span>' +
          '<span id="schedule-summary-' + id + '" style="font-size:12px;color:#333;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px;" title="' + summary + '">' + summary + '</span>' +
        '</div>' +
        '<button onclick="openScheduleModal(\'' + id + '\')" style="padding:3px 10px;font-size:12px;background:#fff;border:1px solid #ccc;border-radius:4px;cursor:pointer;white-space:nowrap;flex-shrink:0;">편집</button>' +
      '</div>' +
    '</div>'
  );
}

// ─────────────────────────────────────────────
// 4. 모달 열기
// ─────────────────────────────────────────────

function openScheduleModal(adGroupId) {
  var adGroup = (window._adGroupsCache || []).find(function(ag) {
    return (ag.id || ag.adgroupId) === adGroupId;
  });
  if (!adGroup) {
    if (typeof showToast === 'function') showToast('광고그룹 정보를 찾을 수 없습니다.', 'error');
    return;
  }
  _schModalAg = adGroup;
  _schEditData = schParseSchedules(adGroup.schedules);
  schRenderModal();
  document.getElementById('sch-modal-overlay').style.display = 'flex';
}

// ─────────────────────────────────────────────
// 5. 모달 빌드
// ─────────────────────────────────────────────

function schRenderModal() {
  var existing = document.getElementById('sch-modal-overlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'sch-modal-overlay';
  overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = schBuildModalHTML();
  document.body.appendChild(overlay);

  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeScheduleModal(); });
  overlay.addEventListener('mousedown', schOnCellMousedown);
  overlay.addEventListener('mouseover', schOnCellMouseover);
  overlay.addEventListener('mouseup', function() { _schDragging = false; });
  overlay.addEventListener('touchstart', schOnCellTouchstart, { passive: false });
  overlay.addEventListener('touchmove', schOnCellTouchmove, { passive: false });
  overlay.addEventListener('touchend', function() { _schDragging = false; });
}

function schBuildModalHTML() {
  var ag = _schModalAg;
  var agName = (ag && (ag.name || ag.adgroupName)) || '광고그룹';

  var headerCells = '';
  for (var hi = 0; hi < 24; hi++) {
    headerCells += '<div style="width:22px;text-align:center;font-size:9px;color:#999;line-height:1;">' + (hi % 3 === 0 ? schPad2(hi) : '') + '</div>';
  }

  var rows = '';
  SCH_DAYS.forEach(function(day) {
    var mask = (_schEditData[day] !== undefined) ? _schEditData[day] : SCH_ALL_HOURS;
    var cells = '';
    for (var h = 0; h < 24; h++) {
      var active = schHasBit(mask, h);
      var bg = active ? '#03c75a' : '#e8e8e8';
      var bd = active ? '#02a84e' : '#d5d5d5';
      cells += '<div class="sch-cell" data-day="' + day + '" data-hour="' + h + '" data-active="' + active + '" style="width:22px;height:22px;border-radius:3px;cursor:pointer;background:' + bg + ';border:1px solid ' + bd + ';flex-shrink:0;"></div>';
    }
    rows += '<div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">' +
      '<div style="width:20px;text-align:right;font-size:12px;font-weight:600;color:#444;flex-shrink:0;">' + SCH_DAY_LABELS[day] + '</div>' +
      '<div style="display:flex;gap:2px;">' + cells + '</div>' +
      '<div id="sch-row-' + day + '" style="font-size:11px;color:#666;margin-left:6px;min-width:80px;">' + schFormatHourRanges(schGetActiveHours(mask)) + '</div>' +
    '</div>';
  });

  var btnStyle = 'padding:4px 10px;font-size:12px;border:1px solid #ddd;border-radius:20px;background:#f5f5f5;cursor:pointer;';

  return '<div style="background:#fff;border-radius:12px;padding:20px;width:100%;max-width:640px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2);user-select:none;">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">' +
      '<div>' +
        '<div style="font-size:16px;font-weight:700;color:#1a1a1a;">노출 시간대 편집</div>' +
        '<div style="font-size:12px;color:#888;margin-top:2px;">' + agName + '</div>' +
      '</div>' +
      '<button onclick="closeScheduleModal()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#999;padding:0 4px;line-height:1;">×</button>' +
    '</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">' +
      '<button onclick="schQuickSelect(\'all\')" style="' + btnStyle + '">전체 선택</button>' +
      '<button onclick="schQuickSelect(\'none\')" style="' + btnStyle + '">전체 해제</button>' +
      '<button onclick="schQuickSelect(\'weekday\')" style="' + btnStyle + '">평일만</button>' +
      '<button onclick="schQuickSelect(\'weekend\')" style="' + btnStyle + '">주말만</button>' +
      '<button onclick="schQuickSelect(\'business\')" style="' + btnStyle + '">업무시간 (09~18시)</button>' +
    '</div>' +
    '<div style="overflow-x:auto;padding-bottom:4px;">' +
      '<div style="display:flex;gap:2px;margin-bottom:4px;margin-left:24px;">' + headerCells + '</div>' +
      rows +
    '</div>' +
    '<div style="display:flex;gap:12px;margin-top:12px;padding-top:12px;border-top:1px solid #f0f0f0;">' +
      '<div style="display:flex;align-items:center;gap:4px;"><div style="width:14px;height:14px;background:#03c75a;border-radius:2px;"></div><span style="font-size:12px;color:#666;">노출</span></div>' +
      '<div style="display:flex;align-items:center;gap:4px;"><div style="width:14px;height:14px;background:#e8e8e8;border-radius:2px;border:1px solid #d5d5d5;"></div><span style="font-size:12px;color:#666;">미노출</span></div>' +
      '<div style="margin-left:auto;font-size:11px;color:#aaa;">셀을 드래그해서 여러 시간대를 한번에 선택/해제</div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;">' +
      '<button onclick="closeScheduleModal()" style="padding:8px 18px;font-size:14px;background:#f5f5f5;border:1px solid #ddd;border-radius:6px;cursor:pointer;">취소</button>' +
      '<button onclick="saveSchedules()" id="sch-save-btn" style="padding:8px 18px;font-size:14px;background:#03c75a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;">저장</button>' +
    '</div>' +
  '</div>';
}

// ─────────────────────────────────────────────
// 6. 셀 토글 (마우스 + 터치)
// ─────────────────────────────────────────────

function schGetCell(target) {
  var el = target;
  while (el && (!el.className || el.className.indexOf('sch-cell') === -1)) el = el.parentElement;
  return (el && el.className && el.className.indexOf('sch-cell') !== -1) ? el : null;
}

function schToggleCell(cell, active) {
  var day = cell.getAttribute('data-day');
  var hour = parseInt(cell.getAttribute('data-hour'), 10);
  cell.setAttribute('data-active', String(active));
  cell.style.background = active ? '#03c75a' : '#e8e8e8';
  cell.style.borderColor = active ? '#02a84e' : '#d5d5d5';
  if (active) { _schEditData[day] = schSetBit(_schEditData[day] || 0, hour); }
  else        { _schEditData[day] = schClearBit(_schEditData[day] || 0, hour); }
  var rowEl = document.getElementById('sch-row-' + day);
  if (rowEl) rowEl.textContent = schFormatHourRanges(schGetActiveHours(_schEditData[day]));
}

function schOnCellMousedown(e) {
  var cell = schGetCell(e.target);
  if (!cell) return;
  e.preventDefault();
  _schDragging = true;
  _schDragActive = cell.getAttribute('data-active') !== 'true';
  schToggleCell(cell, _schDragActive);
}
function schOnCellMouseover(e) {
  if (!_schDragging) return;
  var cell = schGetCell(e.target);
  if (cell) schToggleCell(cell, _schDragActive);
}
function schOnCellTouchstart(e) {
  var cell = schGetCell(e.touches[0].target);
  if (!cell) return;
  e.preventDefault();
  _schDragging = true;
  _schDragActive = cell.getAttribute('data-active') !== 'true';
  schToggleCell(cell, _schDragActive);
}
function schOnCellTouchmove(e) {
  if (!_schDragging) return;
  e.preventDefault();
  var touch = e.touches[0];
  var el = document.elementFromPoint(touch.clientX, touch.clientY);
  var cell = schGetCell(el);
  if (cell) schToggleCell(cell, _schDragActive);
}

// ─────────────────────────────────────────────
// 7. 빠른 선택
// ─────────────────────────────────────────────

function schQuickSelect(type) {
  var WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  var WEEKENDS = ['SUN', 'SAT'];
  var BIZ = [];
  for (var i = 9; i < 18; i++) BIZ.push(i);

  SCH_DAYS.forEach(function(d) {
    if      (type === 'all')      _schEditData[d] = SCH_ALL_HOURS;
    else if (type === 'none')     _schEditData[d] = 0;
    else if (type === 'weekday')  _schEditData[d] = WEEKDAYS.indexOf(d) >= 0 ? SCH_ALL_HOURS : 0;
    else if (type === 'weekend')  _schEditData[d] = WEEKENDS.indexOf(d) >= 0 ? SCH_ALL_HOURS : 0;
    else if (type === 'business') _schEditData[d] = WEEKDAYS.indexOf(d) >= 0 ? schHoursToBitmask(BIZ) : 0;
  });
  schRefreshGrid();
}

function schRefreshGrid() {
  SCH_DAYS.forEach(function(day) {
    var mask = _schEditData[day] !== undefined ? _schEditData[day] : 0;
    for (var h = 0; h < 24; h++) {
      var cell = document.querySelector('.sch-cell[data-day="' + day + '"][data-hour="' + h + '"]');
      if (!cell) continue;
      var active = schHasBit(mask, h);
      cell.setAttribute('data-active', String(active));
      cell.style.background = active ? '#03c75a' : '#e8e8e8';
      cell.style.borderColor = active ? '#02a84e' : '#d5d5d5';
    }
    var rowEl = document.getElementById('sch-row-' + day);
    if (rowEl) rowEl.textContent = schFormatHourRanges(schGetActiveHours(mask));
  });
}

// ─────────────────────────────────────────────
// 8. 닫기
// ─────────────────────────────────────────────

function closeScheduleModal() {
  var overlay = document.getElementById('sch-modal-overlay');
  if (overlay) overlay.style.display = 'none';
  _schModalAg = null;
  _schEditData = {};
  _schDragging = false;
}

// ─────────────────────────────────────────────
// 9. 저장
// ─────────────────────────────────────────────

function saveSchedules() {
  var ag = _schModalAg;
  if (!ag) return;
  var agId = ag.id || ag.adgroupId;
  var btn = document.getElementById('sch-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }

  updateAdGroupSchedules(agId, _schEditData).then(function() {
    ag.schedules = Object.assign({}, _schEditData);
    if (window._adGroupsCache) {
      var idx = -1;
      for (var i = 0; i < window._adGroupsCache.length; i++) {
        if ((window._adGroupsCache[i].id || window._adGroupsCache[i].adgroupId) === agId) { idx = i; break; }
      }
      if (idx !== -1) window._adGroupsCache[idx].schedules = Object.assign({}, _schEditData);
    }
    var summaryEl = document.getElementById('schedule-summary-' + agId);
    if (summaryEl) {
      var s = schFormatSummary(_schEditData);
      summaryEl.textContent = s;
      summaryEl.title = s;
    }
    if (typeof showToast === 'function') showToast('노출 시간대가 저장되었습니다.', 'success');
    closeScheduleModal();
  }).catch(function(err) {
    console.error('schedules save error:', err);
    if (typeof showToast === 'function') showToast('저장에 실패했습니다. 다시 시도해주세요.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = '저장'; }
  });
}

// ─────────────────────────────────────────────
// 10. 전역 등록
// ─────────────────────────────────────────────

window.renderScheduleSection = renderScheduleSection;
window.openScheduleModal = openScheduleModal;
window.closeScheduleModal = closeScheduleModal;
window.saveSchedules = saveSchedules;
window.schQuickSelect = schQuickSelect;
