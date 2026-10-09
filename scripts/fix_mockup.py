import re

with open('mockups/design_concepts.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix seminar type pill bug in renderComparisonStage
content = content.replace(
    "${l.typeCode === 'lecture' ? 'type-lecture' : 'type-lab'}",
    "${l.typeCode === 'lecture' ? 'type-lecture' : l.typeCode === 'lab' ? 'type-lab' : 'type-seminar'}"
)

# 2. Fix toggleLiveSimulation when in 'ALL' concept view
old_toggle_sim = """    function toggleLiveSimulation() {
      isLiveSimEnabled = document.getElementById('liveSimToggle').checked;
      renderContent();
    }"""

new_toggle_sim = """    function toggleLiveSimulation() {
      isLiveSimEnabled = document.getElementById('liveSimToggle').checked;
      if (currentConcept === 'ALL') {
        renderComparisonStage();
      } else {
        renderContent();
      }
    }"""
content = content.replace(old_toggle_sim, new_toggle_sim)

# 3. Fix switchConcept handling for specsPanel and layout stability
old_switch_concept = """    function switchConcept(concept) {
      currentConcept = concept;
      
      // Update top button styles
      document.querySelectorAll('.concept-btn').forEach((btn, idx) => {
        btn.classList.remove('active');
      });
      const btns = Array.from(document.querySelectorAll('.concept-btn'));
      if (concept === 'A') btns[0].classList.add('active');
      if (concept === 'B') btns[1].classList.add('active');
      if (concept === 'C') btns[2].classList.add('active');
      if (concept === 'ALL') btns[3].classList.add('active');

      const mobileDevice = document.getElementById('mobileDevice');
      const singleStage = document.getElementById('singlePreviewStage');
      const compStage = document.getElementById('comparisonStage');
      const specsPanel = document.getElementById('specsPanel');

      if (concept === 'ALL') {
        singleStage.style.display = 'none';
        compStage.style.display = 'grid';
        renderComparisonStage();
        return;
      }

      singleStage.style.display = 'flex';
      compStage.style.display = 'none';"""

new_switch_concept = """    function switchConcept(concept) {
      currentConcept = concept;
      
      // Update top button styles
      document.querySelectorAll('.concept-btn').forEach((btn) => {
        btn.classList.remove('active');
      });
      const btns = Array.from(document.querySelectorAll('.concept-btn'));
      if (concept === 'A') btns[0]?.classList.add('active');
      if (concept === 'B') btns[1]?.classList.add('active');
      if (concept === 'C') btns[2]?.classList.add('active');
      if (concept === 'ALL') btns[3]?.classList.add('active');

      const mobileDevice = document.getElementById('mobileDevice');
      const singleStage = document.getElementById('singlePreviewStage');
      const compStage = document.getElementById('comparisonStage');
      const specsPanel = document.getElementById('specsPanel');

      if (concept === 'ALL') {
        singleStage.style.display = 'none';
        compStage.style.display = 'grid';
        if (specsPanel) specsPanel.style.display = 'none';
        renderComparisonStage();
        return;
      }

      singleStage.style.display = 'flex';
      compStage.style.display = 'none';
      if (specsPanel) specsPanel.style.display = 'block';"""

content = content.replace(old_switch_concept, new_switch_concept)

# 4. Fix selectDay and setWeek when in 'ALL' concept view
old_select_day = """    function selectDay(index) {
      selectedDayIndex = index;
      renderDayCarousel();
      renderContent();
    }"""

new_select_day = """    function selectDay(index) {
      selectedDayIndex = index;
      renderDayCarousel();
      if (currentConcept === 'ALL') {
        renderComparisonStage();
      } else {
        renderContent();
      }
    }"""
content = content.replace(old_select_day, new_select_day)

old_set_week = """    function setWeek(w) {
      currentWeek = w;
      document.getElementById('weekBtn1').classList.toggle('active', w === 1);
      document.getElementById('weekBtn2').classList.toggle('active', w === 2);
      renderDayCarousel();
      renderContent();
    }"""

new_set_week = """    function setWeek(w) {
      currentWeek = w;
      const b1 = document.getElementById('weekBtn1');
      const b2 = document.getElementById('weekBtn2');
      if (b1) b1.classList.toggle('active', w === 1);
      if (b2) b2.classList.toggle('active', w === 2);
      renderDayCarousel();
      if (currentConcept === 'ALL') {
        renderComparisonStage();
      } else {
        renderContent();
      }
    }"""
content = content.replace(old_set_week, new_set_week)

# 5. Fix setSubgroup when in 'ALL' concept view
old_set_subgroup = """    function setSubgroup(subgroup, el) {
      selectedSubgroup = subgroup;
      el.parentElement.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      el.classList.add('active');
      renderContent();
    }"""

new_set_subgroup = """    function setSubgroup(subgroup, el) {
      selectedSubgroup = subgroup;
      if (el && el.parentElement) {
        el.parentElement.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        el.classList.add('active');
      }
      if (currentConcept === 'ALL') {
        renderComparisonStage();
      } else {
        renderContent();
      }
    }"""
content = content.replace(old_set_subgroup, new_set_subgroup)

with open('mockups/design_concepts.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied fixes to mockups/design_concepts.html successfully!")
