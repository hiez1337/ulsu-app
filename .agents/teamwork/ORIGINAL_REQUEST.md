# Original Request

Execute the following engineering task using the `teamwork-preview` framework.
Decompose the workflow into specialized roles (Orchestrator, Explorer, Worker, Challenger, Auditor) with strict role boundaries, 5-component handoff reports, and binary quality gates:

Выполни финальный аудит надежности приложения и подготовку к production-сборке.

Обязательное требование: Запусти коллегию ревьюеров ПАРАЛЛЕЛЬНО в фоне (`background: true`) в одном шаге.

---

### Этап 1: Параллельная коллегия ревьюеров (Fan-Out Review)
Запусти одновременно 3 независимых субагента в фоне (`background: true`):

1. **Субагент: Stress-Tester & Edge-Case Challenger**
   - Проверь работу приложения при отключении сети.
   - Проверь отображение дней без пар и переключение четности недель.
   - Проверь сохранение выбранной группы и темы при перезапуске приложения (`AsyncStorage`).

2. **Субагент: UI/UX & Apple HIG Inspector**
   - Проверь соответствие спецификации `expo-react-native-design`.
   - Проверь контрастность цветов на OLED-экранах (черный `#000000`).
   - Проверь минимальный размер сенсорных зон ($\ge 44 \times 44$ pt).

3. **Субагент: Performance & Resource Auditor**
   - Проверь оптимизацию списков занятий на экранах.
   - Проверь отсутствие утечек памяти в хуках и таймерах.
   - Проверь размер бандла и скорость рендеринга компонентов.

---

### Этап 2: Исполнитель (Worker Pipeline)
После завершения параллельной коллегии запусти субагента-разработчика:
1. Настрой production-параметры приложения в `app.json` (название, иконки, splash screen, ориентация экрана).
2. Исправь все замечания, выявленные тремя параллельными субагентами.

---

### Этап 3: Независимый контролер качества (Victory Auditor)
Запусти независимого аудитора для финальной проверки:
1. Выполни строгую проверку типов: `npx tsc --noEmit`.
2. Выполни тестовую сборку: `npx expo export -p web`.
3. Зафиксируй 5-компонентный отчет `handoff.md` (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
4. Выдай итоговый бинарный вердикт допуска: `CLEAN` или `VETO`.
