const weeklyPlan = {
  Monday:    { lunch: 1, dinner: 3 },
  Tuesday:   { lunch: 2, dinner: 4 },
  Wednesday: { lunch: 1, dinner: 5 },
  Thursday:  { lunch: 2, dinner: 6 },
  Friday:    { lunch: 1, dinner: 3 },
  Saturday:  { lunch: 2, dinner: 4 },
  Sunday:    { lunch: 1, dinner: 7 }
};

let recipes = [];
let breakfastData = {};
let shakeData = {};
let targets = {};
let fixes = {};
let selectedBreakfast = 'oats';
const PROTEIN_TARGET = 130;
const THRESHOLD = 0.80;

Promise.all([
  fetch('recipes.json').then(r => r.json()),
  fetch('breakfasts.json').then(r => r.json())
]).then(([recipeList, bfData]) => {
  recipes = recipeList;
  breakfastData = bfData.breakfasts;
  shakeData = bfData.shake;
  targets = bfData.targets;
  fixes = bfData.fixes;
  renderWeek();
  renderToday();
  renderGroceryList();
  renderRecipeGrid();
  bindFilters();
  bindShowAllRecipes();
}).catch(err => {
  document.getElementById('today-content').innerHTML =
    '<p style="color:red">Error loading data: ' + err.message + '</p>';
});

function getRecipeById(id) { return recipes.find(r => r.id === id); }

function sumNutrition(...items) {
  const keys = ['calories','protein','carbs','fat','fibre','iron','calcium','magnesium','zinc','omega3','vitaminC','vitaminD','vitaminB12'];
  const total = {};
  keys.forEach(k => { total[k] = 0; });
  items.forEach(item => {
    if (item && item.nutrition) keys.forEach(k => { total[k] += (item.nutrition[k] || 0); });
  });
  return total;
}

function pct(val, target) { return Math.min(Math.round((val / target) * 100), 100); }
function barColor(p) {
  if (p >= 80) return '#437a22';
  if (p >= 60) return '#c47c00';
  return '#b03030';
}

function microBar(label, val, target, unit) {
  const p = pct(val, target);
  const col = barColor(p);
  const warn = p < 80 ? ' ⚠' : ' ✓';
  return '<div class="micro-row">' +
    '<span class="micro-label">' + label + '</span>' +
    '<div class="micro-bar-wrap"><div class="micro-bar" style="width:' + p + '%;background:' + col + '"></div></div>' +
    '<span class="micro-val">' + (typeof val === 'number' ? val.toFixed(1) : val) + ' ' + unit +
    ' <span class="micro-pct" style="color:' + col + '">' + p + '%' + warn + '</span></span>' +
    '</div>';
}

function renderFixPanel(total) {
  const microKeys = ['iron','calcium','magnesium','zinc','omega3','vitaminC','vitaminD','vitaminB12'];
  const lowNutrients = microKeys.filter(k => (total[k] / targets[k]) < THRESHOLD);
  if (lowNutrients.length === 0) {
    return '<div class="note-box" style="background:#f0fff4;border-color:#a8d5a2;margin-top:14px"><strong>All micronutrients are on track today!</strong></div>';
  }
  var panels = lowNutrients.map(function(k) {
    var fix = fixes[k]; if (!fix) return '';
    var p = pct(total[k], targets[k]);
    var gap = (targets[k] - total[k]).toFixed(1);
    var foodRows = fix.food.map(function(f) {
      return '<li><strong>' + f.item + '</strong> — +' + f.boost + ' ' + fix.unit + ' &nbsp;·&nbsp; <span style="color:#666">' + f.calories + ' kcal</span></li>';
    }).join('');
    return '<div class="fix-card">' +
      '<div class="fix-header"><span class="fix-nutrient">' + fix.label + '</span>' +
      '<span class="fix-pct" style="color:' + barColor(p) + '">' + p + '% of target · gap: ' + gap + ' ' + fix.unit + '</span></div>' +
      '<p class="fix-section-label">Food fixes (low calorie first):</p>' +
      '<ul class="fix-list">' + foodRows + '</ul>' +
      '<p class="fix-section-label">Supplement option:</p>' +
      '<p class="fix-supp">' + fix.supplement + '</p></div>';
  }).join('');
  return '<div class="fix-panel"><h4 style="margin:0 0 12px">Warning: ' + lowNutrients.length + ' nutrient' + (lowNutrients.length > 1 ? 's' : '') + ' below 80% today</h4>' + panels + '</div>';
}

function renderNutritionPanel(total, showFix) {
  var proteinOk = total.protein >= PROTEIN_TARGET;
  return '<div class="nutrition-panel">' +
    '<h4>Daily Nutrition Summary</h4>' +
    '<div class="macro-grid">' +
    '<div class="macro-box" style="border-top:3px solid #0b6b6f"><strong>' + Math.round(total.calories) + '</strong><span>kcal</span></div>' +
    '<div class="macro-box" style="border-top:3px solid #437a22"><strong>' + total.protein.toFixed(1) + ' g</strong><span>Protein ' + (proteinOk ? '✓' : '⚠') + '</span></div>' +
    '<div class="macro-box" style="border-top:3px solid #c47c00"><strong>' + total.carbs.toFixed(1) + ' g</strong><span>Carbs</span></div>' +
    '<div class="macro-box" style="border-top:3px solid #964219"><strong>' + total.fat.toFixed(1) + ' g</strong><span>Fat</span></div>' +
    '<div class="macro-box" style="border-top:3px solid #5a7a9a"><strong>' + total.fibre.toFixed(1) + ' g</strong><span>Fibre</span></div>' +
    '</div>' +
    '<h4 style="margin-top:16px">Micronutrients <small style="color:#888;font-weight:normal">% of personalised daily target</small></h4>' +
    microBar('Iron', total.iron, targets.iron, 'mg') +
    microBar('Calcium', total.calcium, targets.calcium, 'mg') +
    microBar('Magnesium', total.magnesium, targets.magnesium, 'mg') +
    microBar('Zinc', total.zinc, targets.zinc, 'mg') +
    microBar('Omega 3', total.omega3, targets.omega3, 'g') +
    microBar('Vitamin C', total.vitaminC, targets.vitaminC, 'mg') +
    microBar('Vitamin D', total.vitaminD, targets.vitaminD, 'mcg') +
    microBar('Vitamin B12', total.vitaminB12, targets.vitaminB12, 'mcg') +
    '</div>' +
    (showFix ? renderFixPanel(total) : '');
}

function renderToday() {
  var todayContent = document.getElementById('today-content');
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var todayName = days[new Date().getDay()];
  var todayPlan = weeklyPlan[todayName];
  if (!todayPlan || recipes.length === 0) return;
  var lr = getRecipeById(todayPlan.lunch);
  var dr = getRecipeById(todayPlan.dinner);
  var bf = breakfastData[selectedBreakfast];
  var total = sumNutrition(bf, shakeData, lr, dr);
  var tasks = [
    'Morning: Check if chicken is marinated. If not, marinate now.',
    'Lunch (' + lr.name + '): ' + lr.tasks[0],
    'Lunch: ' + lr.tasks[1],
    'Dinner (' + dr.name + '): ' + dr.tasks[0],
    'Dinner: ' + dr.tasks[1]
  ];
  todayContent.innerHTML =
    '<div class="bf-toggle-wrap">' +
    '<span class="bf-toggle-label">Today\'s breakfast:</span>' +
    '<div class="bf-toggle">' +
    '<button class="bf-btn ' + (selectedBreakfast === 'oats' ? 'active' : '') + '" data-bf="oats">Overnight Oats</button>' +
    '<button class="bf-btn ' + (selectedBreakfast === 'bread' ? 'active' : '') + '" data-bf="bread">Bread + Eggs</button>' +
    '</div></div>' +
    '<p><strong>Today is:</strong> ' + todayName + '</p>' +
    '<div class="meta-grid">' +
    '<div class="meta-box"><strong>Breakfast</strong><br>' + bf.name + '</div>' +
    '<div class="meta-box"><strong>Lunch</strong><br>' + lr.name + '</div>' +
    '<div class="meta-box"><strong>Dinner</strong><br>' + dr.name + '</div>' +
    '<div class="meta-box"><strong>+ Shake</strong><br>30 g protein</div>' +
    '</div>' +
    renderNutritionPanel(total, true) +
    '<h3 style="margin-top:16px">Today\'s tasks</h3>' +
    '<ul class="task-list">' + tasks.map(function(t){ return '<li>' + t + '</li>'; }).join('') + '</ul>' +
    '<div class="note-box" style="margin-top:12px"><strong>Too tired to cook dinner?</strong> Use Emergency Chicken Curd Bowl instead of ordering.</div>';

  document.querySelectorAll('.bf-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      selectedBreakfast = btn.dataset.bf;
      renderToday();
    });
  });
}

function renderWeek() {
  var weekContent = document.getElementById('week-content');
  weekContent.innerHTML = '';
  Object.keys(weeklyPlan).forEach(function(day) {
    var lr = getRecipeById(weeklyPlan[day].lunch);
    var dr = getRecipeById(weeklyPlan[day].dinner);
    var bf = breakfastData['oats'];
    var total = sumNutrition(bf, shakeData, lr, dr);
    var proteinOk = total.protein >= PROTEIN_TARGET;
    var lrCost = lr.costPerServing || 0;
    var drCost = dr.costPerServing || 0;
    var dayDiv = document.createElement('div');
    dayDiv.className = 'day-card';
    dayDiv.innerHTML =
      '<h3>' + day +
      ' <small style="color:' + (proteinOk ? '#437a22' : '#964219') + '">' + (proteinOk ? '✓' : '⚠') + ' ' + total.protein.toFixed(0) + ' g protein · ' + Math.round(total.calories) + ' kcal</small>' +
      ' <small style="color:#5a7a9a;margin-left:8px">₹' + (lrCost + drCost) + ' meals</small></h3>' +
      '<div class="meal-row"><span class="meal-label">Lunch</span>' +
      '<button class="recipe-button" onclick="showRecipe(' + lr.id + ')">' + lr.name + '</button>' +
      '<span class="helper-text">' + lr.protein + ' g protein · ₹' + lrCost + '</span></div>' +
      '<div class="meal-row"><span class="meal-label">Dinner</span>' +
      '<button class="recipe-button" onclick="showRecipe(' + dr.id + ')">' + dr.name + '</button>' +
      '<span class="helper-text">' + dr.protein + ' g protein · ₹' + drCost + '</span></div>';
    weekContent.appendChild(dayDiv);
  });
}

var GROCERY_STORAGE_KEY = 'meal_planner_grocery_checked';

var weeklyGrocery = [
  { name: 'Chicken breast (boneless)', group: 'Protein', qty: '1080 g', weeklyQty: 1.08, unit: 'kg', pricePerUnit: 340, source: 'Blinkit' },
  { name: 'Eggs', group: 'Protein', qty: '21 whole', weeklyQty: 21, unit: 'egg', pricePerUnit: 7.5, source: 'Blinkit' },
  { name: 'Paneer (Mother Dairy 200g)', group: 'Protein', qty: '400 g (2 packs)', weeklyQty: 2, unit: 'pack', pricePerUnit: 92, source: 'Blinkit' },
  { name: 'Sona Masoori rice (raw)', group: 'Staples', qty: '400 g raw → 750 g cooked', weeklyQty: 0.4, unit: 'kg', pricePerUnit: 65, source: 'Blinkit' },
  { name: 'Millet (foxtail/kodo)', group: 'Staples', qty: '175 g raw → 300 g cooked', weeklyQty: 0.175, unit: 'kg', pricePerUnit: 120, source: 'Blinkit' },
  { name: 'Tomato', group: 'Vegetables', qty: '11 pieces', weeklyQty: 11, unit: 'piece', pricePerUnit: 6, source: 'Local' },
  { name: 'Onion', group: 'Vegetables', qty: '9 pieces', weeklyQty: 9, unit: 'piece', pricePerUnit: 5, source: 'Local' },
  { name: 'Carrot', group: 'Vegetables', qty: '10 small', weeklyQty: 10, unit: 'piece', pricePerUnit: 6, source: 'Local' },
  { name: 'Capsicum', group: 'Vegetables', qty: '5 pieces', weeklyQty: 5, unit: 'piece', pricePerUnit: 12, source: 'Local' },
  { name: 'Cucumber', group: 'Vegetables', qty: '4 pieces', weeklyQty: 4, unit: 'piece', pricePerUnit: 10, source: 'Local' },
  { name: 'Lemon', group: 'Vegetables', qty: '4 pieces', weeklyQty: 4, unit: 'piece', pricePerUnit: 6, source: 'Local' },
  { name: 'Spinach', group: 'Vegetables', qty: '1 bunch (4 handfuls)', weeklyQty: 1, unit: 'bunch', pricePerUnit: 25, source: 'Local' },
  { name: 'Beans', group: 'Vegetables', qty: '1 bunch (4 handfuls)', weeklyQty: 1, unit: 'bunch', pricePerUnit: 20, source: 'Local' },
  { name: 'Spring onion', group: 'Vegetables', qty: '1 bunch (6 stalks)', weeklyQty: 1, unit: 'bunch', pricePerUnit: 15, source: 'Local' },
  { name: 'Banana / Guava / Papaya', group: 'Fruits', qty: '7 pieces', weeklyQty: 7, unit: 'piece', pricePerUnit: 7, source: 'Local' }
];

function getCheckedItems() {
  try { return JSON.parse(localStorage.getItem(GROCERY_STORAGE_KEY)) || {}; } catch(e) { return {}; }
}
function saveCheckedItems(c) { localStorage.setItem(GROCERY_STORAGE_KEY, JSON.stringify(c)); }

function renderGroceryList() {
  var groceryContent = document.getElementById('grocery-content');
  var checked = getCheckedItems();
  var grouped = {};
  weeklyGrocery.forEach(function(item) {
    if (!grouped[item.group]) grouped[item.group] = [];
    grouped[item.group].push(item);
  });
  var totalCost = weeklyGrocery.reduce(function(s,i){ return s + Math.round(i.weeklyQty * i.pricePerUnit); }, 0);
  var blinkitCost = weeklyGrocery.filter(function(i){ return i.source === 'Blinkit'; }).reduce(function(s,i){ return s + Math.round(i.weeklyQty * i.pricePerUnit); }, 0);
  var localCost = weeklyGrocery.filter(function(i){ return i.source === 'Local'; }).reduce(function(s,i){ return s + Math.round(i.weeklyQty * i.pricePerUnit); }, 0);
  var checkedCount = weeklyGrocery.filter(function(i){ return checked[i.name]; }).length;
  var remaining = weeklyGrocery.length - checkedCount;

  var html = '<div class="grocery-summary">' +
    '<div class="grocery-total-box"><span class="grocery-total-label">Weekly grocery total</span><span class="grocery-total-amount">₹' + totalCost + '</span></div>' +
    '<div class="grocery-split"><span>Blinkit: <strong>₹' + blinkitCost + '</strong></span><span>Local market: <strong>₹' + localCost + '</strong></span><span>' + checkedCount + ' of ' + weeklyGrocery.length + ' bought · ' + remaining + ' remaining</span></div>' +
    '<div class="grocery-actions"><button class="secondary-btn" id="check-all-btn">Check all</button><button class="secondary-btn" id="clear-all-btn">Clear all</button></div>' +
    '</div>';

  Object.keys(grouped).forEach(function(group) {
    html += '<div class="grocery-category"><h3>' + group + '</h3>';
    grouped[group].forEach(function(item) {
      var cost = Math.round(item.weeklyQty * item.pricePerUnit);
      var isChecked = !!checked[item.name];
      html += '<label class="grocery-item ' + (isChecked ? 'item-done' : '') + '" data-name="' + item.name + '">' +
        '<input type="checkbox" class="grocery-check" data-name="' + item.name + '" ' + (isChecked ? 'checked' : '') + ' />' +
        '<span class="grocery-item-name">' + item.name + '</span>' +
        '<span class="grocery-item-qty">' + item.qty + '</span>' +
        '<span class="grocery-item-cost">₹' + cost + '</span>' +
        '<span class="grocery-item-source ' + (item.source === 'Blinkit' ? 'source-blinkit' : 'source-local') + '">' + item.source + '</span>' +
        '</label>';
    });
    html += '</div>';
  });

  groceryContent.innerHTML = html;

  document.querySelectorAll('.grocery-check').forEach(function(cb) {
    cb.addEventListener('change', function() {
      var c = getCheckedItems();
      c[cb.dataset.name] = cb.checked;
      saveCheckedItems(c);
      renderGroceryList();
    });
  });
  document.getElementById('check-all-btn').addEventListener('click', function() {
    var c = {};
    weeklyGrocery.forEach(function(i){ c[i.name] = true; });
    saveCheckedItems(c);
    renderGroceryList();
  });
  document.getElementById('clear-all-btn').addEventListener('click', function() {
    saveCheckedItems({});
    renderGroceryList();
  });
}

var activeFilter = 'All';

function renderRecipeGrid() {
  var recipeGrid = document.getElementById('recipe-grid');
  var filtered = activeFilter === 'All' ? recipes : recipes.filter(function(r){ return r.tags.indexOf(activeFilter) > -1 || r.category === activeFilter; });
  recipeGrid.innerHTML = filtered.map(function(recipe) {
    return '<div class="recipe-card">' +
      '<h3>' + recipe.name + '</h3>' +
      '<div class="tags">' +
      '<span class="tag">' + recipe.category + '</span>' +
      '<span class="tag">' + recipe.mealType + '</span>' +
      '<span class="tag">' + (recipe.prepTime + recipe.cookTime) + ' min</span>' +
      '<span class="tag">' + recipe.protein + ' g protein</span>' +
      '<span class="tag">' + recipe.nutrition.calories + ' kcal</span>' +
      (recipe.costPerServing ? '<span class="tag">₹' + recipe.costPerServing + '</span>' : '') +
      '</div>' +
      '<p>' + recipe.steps[0] + '</p>' +
      '<button class="recipe-button" onclick="showRecipe(' + recipe.id + ')">Open recipe</button>' +
      '</div>';
  }).join('');
}

function showRecipe(id) {
  var recipe = getRecipeById(id);
  var recipeContent = document.getElementById('recipe-content');
  var n = recipe.nutrition;
  recipeContent.innerHTML =
    '<h3>' + recipe.name + '</h3>' +
    '<div class="meta-grid">' +
    '<div class="meta-box"><strong>Meal Type</strong><br>' + recipe.mealType + '</div>' +
    '<div class="meta-box"><strong>Prep Time</strong><br>' + recipe.prepTime + ' min</div>' +
    '<div class="meta-box"><strong>Cook Time</strong><br>' + recipe.cookTime + ' min</div>' +
    '<div class="meta-box"><strong>Protein</strong><br>' + recipe.protein + ' g</div>' +
    (recipe.costPerServing ? '<div class="meta-box"><strong>Cost</strong><br>₹' + recipe.costPerServing + '</div>' : '') +
    '</div>' +
    '<div class="nutrition-panel"><h4>Macros per serving</h4>' +
    '<div class="macro-grid">' +
    '<div class="macro-box" style="border-top:3px solid #0b6b6f"><strong>' + n.calories + '</strong><span>kcal</span></div>' +
    '<div class="macro-box" style="border-top:3px solid #437a22"><strong>' + n.protein + ' g</strong><span>Protein</span></div>' +
    '<div class="macro-box" style="border-top:3px solid #c47c00"><strong>' + n.carbs + ' g</strong><span>Carbs</span></div>' +
    '<div class="macro-box" style="border-top:3px solid #964219"><strong>' + n.fat + ' g</strong><span>Fat</span></div>' +
    '<div class="macro-box" style="border-top:3px solid #5a7a9a"><strong>' + n.fibre + ' g</strong><span>Fibre</span></div>' +
    '</div>' +
    '<h4 style="margin-top:16px">Micronutrients in this meal</h4>' +
    microBar('Iron', n.iron, targets.iron, 'mg') +
    microBar('Calcium', n.calcium, targets.calcium, 'mg') +
    microBar('Magnesium', n.magnesium, targets.magnesium, 'mg') +
    microBar('Zinc', n.zinc, targets.zinc, 'mg') +
    microBar('Omega 3', n.omega3, targets.omega3, 'g') +
    microBar('Vitamin C', n.vitaminC, targets.vitaminC, 'mg') +
    microBar('Vitamin D', n.vitaminD, targets.vitaminD, 'mcg') +
    microBar('Vitamin B12', n.vitaminB12, targets.vitaminB12, 'mcg') +
    '</div>' +
    '<h4>Ingredients</h4><ul class="ingredient-list">' +
    recipe.ingredients.map(function(i){ return '<li>' + i.name + ' — ' + i.qty + '</li>'; }).join('') +
    '</ul><h4>Cooking Steps</h4><ol class="step-list">' +
    recipe.steps.map(function(s){ return '<li>' + s + '</li>'; }).join('') +
    '</ol><h4>What to do</h4><ul class="task-list">' +
    recipe.tasks.map(function(t){ return '<li>' + t + '</li>'; }).join('') +
    '</ul>';
  recipeContent.scrollIntoView({ behavior: 'smooth' });
}

function bindFilters() {
  document.querySelectorAll('.filter-btn').forEach(function(button) {
    button.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); });
      button.classList.add('active');
      activeFilter = button.dataset.filter;
      renderRecipeGrid();
      document.getElementById('recipe-grid').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function bindShowAllRecipes() {
  document.getElementById('show-all-recipes').addEventListener('click', function() {
    activeFilter = 'All';
    document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); });
    document.querySelector('.filter-btn[data-filter="All"]').classList.add('active');
    renderRecipeGrid();
    document.getElementById('recipe-content').innerHTML = '<p>Click a recipe card to see full nutrition, ingredients, and instructions.</p>';
  });
}
