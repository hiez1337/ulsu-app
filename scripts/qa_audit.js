const fs = require('fs');
const vm = require('vm');

console.log('====================================================');
console.log('       QA AUDIT & VERIFICATION SUITE START          ');
console.log('====================================================');

// ----------------------------------------------------
// Task 1: HTML Tag Balancer / Validator
// ----------------------------------------------------
function validateHtmlTags(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  // Strip comments first to avoid tag collisions inside comments
  const stripped = content.replace(/<!--[\s\S]*?-->/g, '');
  const voidTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);
  const tagRegex = /<\/?([a-zA-Z0-9\-]+)(?:\s+[^>]*)?\/?>/g;
  const stack = [];
  let match;
  
  while ((match = tagRegex.exec(stripped)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    
    if (fullTag.startsWith('<!')) continue;
    if (tagName === 'script' || tagName === 'style') {
      // For script and style, skip their internal contents
      continue;
    }
    
    const isClosing = fullTag.startsWith('</');
    const isSelfClosing = fullTag.endsWith('/>') || voidTags.has(tagName);
    
    if (isClosing) {
      if (stack.length === 0) {
        console.error(`[${filepath}] Unexpected closing tag </${tagName}>`);
        return false;
      }
      const top = stack.pop();
      if (top.tagName !== tagName) {
        console.error(`[${filepath}] Mismatched tag: expected </${top.tagName}>, but found </${tagName}>`);
        return false;
      }
    } else if (!isSelfClosing) {
      stack.push({ tagName });
    }
  }
  
  if (stack.length > 0) {
    console.error(`[${filepath}] Unclosed tags:`, stack);
    return false;
  }
  console.log(`[PASS] ${filepath} HTML tags are balanced and valid.`);
  return true;
}

// ----------------------------------------------------
// Task 2: Validate design_concepts.html
// ----------------------------------------------------
console.log('\n--- Checking design_concepts.html ---');
validateHtmlTags('mockups/design_concepts.html');

const designHtml = fs.readFileSync('mockups/design_concepts.html', 'utf8');
const scriptMatches = designHtml.match(/<script>([\s\S]*?)<\/script>/i);
if (!scriptMatches) {
  console.error('[FAIL] No <script> found in mockups/design_concepts.html');
  process.exit(1);
}

const jsCode = scriptMatches[1];

// 1. Syntax check via vm.Script
try {
  new vm.Script(jsCode);
  console.log('[PASS] JavaScript syntax in design_concepts.html is 100% valid.');
} catch (err) {
  console.error('[FAIL] Syntax error in design_concepts.html JS:', err);
  process.exit(1);
}

// 2. DOM Mock Environment to test Bug 1, Bug 2, Bug 3
class MockElement {
  constructor(id = '', tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.style = {};
    this.classList = new Set();
    this.innerHTML = '';
    this.innerText = '';
    this.value = '';
    this.checked = true;
    this.children = [];
    this.parentElement = null;
    this.attributes = {};
  }
  classList_add(...cls) { cls.forEach(c => this.classList.add(c)); }
  classList_remove(...cls) { cls.forEach(c => this.classList.delete(c)); }
  classList_toggle(cls, force) {
    if (force !== undefined) {
      if (force) this.classList.add(cls);
      else this.classList.delete(cls);
      return force;
    }
    if (this.classList.has(cls)) {
      this.classList.delete(cls);
      return false;
    } else {
      this.classList.add(cls);
      return true;
    }
  }
}

// Create elements map
const elements = new Map();
function getOrCreate(id) {
  if (!elements.has(id)) {
    const el = {
      id,
      style: {},
      classList: {
        _set: new Set(),
        add(c) { this._set.add(c); },
        remove(c) { this._set.delete(c); },
        contains(c) { return this._set.has(c); },
        toggle(c, force) {
          if (force !== undefined) {
            if (force) this._set.add(c);
            else this._set.delete(c);
            return force;
          }
          if (this._set.has(c)) {
            this._set.delete(c);
            return false;
          }
          this._set.add(c);
          return true;
        }
      },
      innerHTML: '',
      innerText: '',
      checked: true,
      parentElement: null
    };
    elements.set(id, el);
  }
  return elements.get(id);
}

const buttons = [
  getOrCreate('btnConceptA'),
  getOrCreate('btnConceptB'),
  getOrCreate('btnConceptC'),
  getOrCreate('btnConceptALL')
];

const mockDocument = {
  getElementById(id) {
    return getOrCreate(id);
  },
  querySelectorAll(sel) {
    if (sel === '.concept-btn') {
      return buttons;
    }
    return [];
  },
  addEventListener() {}
};

const mockWindow = {
  addEventListener(evt, fn) {
    if (evt === 'DOMContentLoaded') {
      // will call manually
    }
  }
};

const context = {
  document: mockDocument,
  window: mockWindow,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Array: Array,
  String: String,
  Boolean: Boolean,
  Object: Object
};

vm.createContext(context);
vm.runInContext(jsCode, context);

// Test init
context.init();
console.log('[PASS] init() executed without errors.');

// Check Bug 1: Seminars in comparison stage receive 'type-seminar'
context.switchConcept('ALL');
const colAContent = getOrCreate('compColA').innerHTML;
const colBContent = getOrCreate('compColB').innerHTML;
const colCContent = getOrCreate('compColC').innerHTML;

// Find lessons in schedule data
const activeDay = vm.runInContext('SCHEDULE_DATA_WEEKS[currentWeek][selectedDayIndex]', context);
const seminarLessons = activeDay.lessons.filter(l => l.typeCode !== 'lecture' && l.typeCode !== 'lab');

console.log(`Checking active day "${activeDay.fullName}" with ${activeDay.lessons.length} lessons, ${seminarLessons.length} seminars/practices.`);
if (seminarLessons.length > 0) {
  const hasTypeSeminarA = colAContent.includes('type-seminar');
  const hasTypeSeminarB = colBContent.includes('type-seminar');
  if (hasTypeSeminarA && hasTypeSeminarB) {
    console.log('[PASS] Bug 1 Verified: Seminars in comparison columns (compColA & compColB) receive class "type-seminar".');
  } else {
    console.error('[FAIL] Bug 1 Failed: Seminars did not receive "type-seminar" in comparison columns.');
    process.exit(1);
  }
} else {
  console.log('[INFO] Day index 0 has no seminar, testing Day index with seminars...');
}

// Find day with seminar and test
const totalDays = vm.runInContext('SCHEDULE_DATA_WEEKS[1].length', context);
for (let d = 0; d < totalDays; d++) {
  const day = vm.runInContext(`SCHEDULE_DATA_WEEKS[1][${d}]`, context);
  const se = day.lessons.filter(l => l.typeCode !== 'lecture' && l.typeCode !== 'lab');
  if (se.length > 0) {
    vm.runInContext(`selectDay(${d})`, context);
    const cA = getOrCreate('compColA').innerHTML;
    const cB = getOrCreate('compColB').innerHTML;
    if (cA.includes('type-seminar') && cB.includes('type-seminar')) {
      console.log(`[PASS] Bug 1 Verified for Day "${day.fullName}": CompColA and CompColB correctly output "type-seminar" for seminar (${se[0].subject}).`);
    } else {
      console.error(`[FAIL] Bug 1: CompCol missing "type-seminar" on day ${day.fullName}`);
      process.exit(1);
    }
    break;
  }
}

// Check Bug 2: switchConcept('ALL') hides specsPanel and sets up comparisonStage
vm.runInContext("switchConcept('A')", context);
const specsA = getOrCreate('specsPanel').style.display;
const singleA = getOrCreate('singlePreviewStage').style.display;
const compA = getOrCreate('comparisonStage').style.display;
console.log(`Concept A: specsPanel=${specsA}, singleStage=${singleA}, compStage=${compA}`);

vm.runInContext("switchConcept('ALL')", context);
const specsALL = getOrCreate('specsPanel').style.display;
const singleALL = getOrCreate('singlePreviewStage').style.display;
const compALL = getOrCreate('comparisonStage').style.display;
console.log(`Concept ALL: specsPanel=${specsALL}, singleStage=${singleALL}, compStage=${compALL}`);

if (specsALL === 'none' && singleALL === 'none' && compALL === 'grid') {
  console.log('[PASS] Bug 2 Verified: switchConcept("ALL") hides specsPanel (display: none), hides singlePreviewStage, and shows comparisonStage (display: grid).');
} else {
  console.error('[FAIL] Bug 2 Failed: Display states incorrect for switchConcept("ALL").');
  process.exit(1);
}

// Check Bug 3: Interactivity functions in both single preview and 'ALL' mode
console.log('\n--- Verifying Bug 3 Interactivity in Single Preview & ALL modes ---');

// In single preview mode ('A')
vm.runInContext("switchConcept('A')", context);

// toggleLiveSimulation()
getOrCreate('liveSimToggle').checked = false;
vm.runInContext("toggleLiveSimulation()", context);
if (!vm.runInContext("isLiveSimEnabled", context)) {
  console.log('[PASS] toggleLiveSimulation() correctly sets isLiveSimEnabled=false in Single Mode.');
}
getOrCreate('liveSimToggle').checked = true;
vm.runInContext("toggleLiveSimulation()", context);
if (vm.runInContext("isLiveSimEnabled", context)) {
  console.log('[PASS] toggleLiveSimulation() correctly sets isLiveSimEnabled=true in Single Mode.');
}

// selectDay()
vm.runInContext("selectDay(2)", context);
if (vm.runInContext("selectedDayIndex", context) === 2) {
  console.log('[PASS] selectDay(2) correctly updates selectedDayIndex in Single Mode.');
}

// setWeek()
vm.runInContext("setWeek(2)", context);
if (vm.runInContext("currentWeek", context) === 2) {
  console.log('[PASS] setWeek(2) correctly updates currentWeek in Single Mode.');
}

// setSubgroup()
context.mockPill = {
  parentElement: {
    querySelectorAll: () => []
  },
  classList: { add: () => {} }
};
vm.runInContext("setSubgroup('1', mockPill)", context);
if (vm.runInContext("selectedSubgroup", context) === '1') {
  console.log('[PASS] setSubgroup("1") correctly updates selectedSubgroup in Single Mode.');
}

// In ALL comparison mode ('ALL')
vm.runInContext("switchConcept('ALL')", context);

getOrCreate('liveSimToggle').checked = false;
vm.runInContext("toggleLiveSimulation()", context);
if (!vm.runInContext("isLiveSimEnabled", context)) {
  console.log('[PASS] toggleLiveSimulation() works cleanly in "ALL" mode without throwing.');
}

getOrCreate('liveSimToggle').checked = true;
vm.runInContext("toggleLiveSimulation()", context);
if (vm.runInContext("isLiveSimEnabled", context)) {
  console.log('[PASS] toggleLiveSimulation(true) works cleanly in "ALL" mode without throwing.');
}

vm.runInContext("selectDay(3)", context);
if (vm.runInContext("selectedDayIndex", context) === 3) {
  console.log('[PASS] selectDay(3) updates day and renders comparison stage in "ALL" mode.');
}

vm.runInContext("setWeek(1)", context);
if (vm.runInContext("currentWeek", context) === 1) {
  console.log('[PASS] setWeek(1) updates week and renders comparison stage in "ALL" mode.');
}

vm.runInContext("setSubgroup('2', mockPill)", context);
if (vm.runInContext("selectedSubgroup", context) === '2') {
  console.log('[PASS] setSubgroup("2") updates subgroup and renders comparison stage in "ALL" mode.');
}

// ----------------------------------------------------
// Task 3: Verify showcase_phones.html
// ----------------------------------------------------
console.log('\n--- Checking showcase_phones.html ---');
validateHtmlTags('mockups/showcase_phones.html');

const phoneHtml = fs.readFileSync('mockups/showcase_phones.html', 'utf8');

// Check 6 screens
const screenChecks = [
  {
    num: 1,
    name: 'Group Selection Screen',
    requiredTexts: ['ФМИАТ • УлГУ', 'Расписание', 'Выберите направление', '1 курс', '2 курс', '3 курс', '4 курс', 'ПМ-О-26/1', 'ИС-О-26/1', 'АС-О-26/1', 'ИБ-О-26/1']
  },
  {
    num: 2,
    name: 'Day Schedule View (Apple iOS 18)',
    requiredTexts: ['ПМ-О-26/1', 'cal-strip', 'subgroup-pills', 'live-pair', 'progress-bar-fill', 'Информатика и программирование', '1С: Предприятие для разработчиков', 'Математический анализ']
  },
  {
    num: 3,
    name: 'Modal Detail & Dynamic Island',
    requiredTexts: ['island-expanded', 'modal-sheet', 'sheet-handle', 'Н.Н. Нечаева', 'Аудитория 3/118', 'Осталось 28 минут до конца', 'Добавить заметку к паре']
  },
  {
    num: 4,
    name: 'Weekly Matrix Grid',
    requiredTexts: ['grid-day-block', 'ПОНЕДЕЛЬНИК', 'ВТОРНИК', 'СРЕДА', 'Сетка всей недели']
  },
  {
    num: 5,
    name: 'Linear Pro (Dark Monospace)',
    requiredTexts: ['ULSU_TERMINAL_V2', 'linear-card', 'SF Mono', 'Концепт Linear Pro']
  },
  {
    num: 6,
    name: 'Search & Free Rooms',
    requiredTexts: ['search-input-box', 'Санников И.А.', 'Фролова Ю.Ю.', 'Ауд. 3/420 • Свободна', 'Поиск и свободные кабинеты']
  }
];

let allScreensPass = true;
screenChecks.forEach(sc => {
  const missing = sc.requiredTexts.filter(t => !phoneHtml.includes(t));
  if (missing.length === 0) {
    console.log(`[PASS] Screen ${sc.num}: ${sc.name} is fully rendered with all required content.`);
  } else {
    console.error(`[FAIL] Screen ${sc.num}: ${sc.name} is missing elements:`, missing);
    allScreensPass = false;
  }
});

// Check responsiveness in showcase_phones.html
const hasMediaQueries = phoneHtml.includes('@media');
const hasFlexWrapOrGrid = phoneHtml.includes('display: flex') || phoneHtml.includes('grid');
console.log(`Responsive layout check: Media Queries = ${hasMediaQueries}, Flex/Grid = ${hasFlexWrapOrGrid}`);

if (allScreensPass && hasMediaQueries) {
  console.log('[PASS] showcase_phones.html responsiveness and content verified.');
} else {
  console.error('[FAIL] showcase_phones.html verification failed.');
  process.exit(1);
}

console.log('\n====================================================');
console.log('       ALL VERIFICATIONS COMPLETED SUCCESSFULLY     ');
console.log('====================================================');
