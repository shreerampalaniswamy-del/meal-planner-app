const weeklyPlan = {
  Monday:    { lunch: 1, dinner: 3 },
  Tuesday:   { lunch: 2, dinner: 4 },
  Wednesday: { lunch: 1, dinner: 5 },
  Thursday:  { lunch: 2, dinner: 6 },
  Friday:    { lunch: 1, dinner: 3 },
  Saturday:  { lunch: 2, dinner: 4 },
  Sunday:    { lunch: 1, dinner: 7 }
};

const dailyProteinTarget = 130;

let recipes = [];
let activeFilter = 'All';

fetch('recipes.json')
  .then((response) => response.json())
  .then((data) => {
    recipes = data;
    renderWeek();
    renderToday();
    renderGroceryList();
    renderRecipeGrid();
    bindFilters();
    bindShowAllRecipes();
  })
  .catch(() => {
    document.getElementById('today-content').innerHTML =
      '<p>Could not load recipes.json. Check the file is uploaded correctly.</p>';
  });

function getRecipeById(id) {
  return recipes.find((r) => r.id === id);
}

function renderWeek() {
  const weekContent = document.getElementById('week-content');
  weekContent.innerHTML = '';
  Object.keys(weeklyPlan).forEach((day) => {
    const lr = getRecipeById(weeklyPlan[day].lunch);
    const dr = getRecipeById(weeklyPlan[day].dinner);
    const totalProtein = 30 + 12 + lr.protein + dr.protein;
    const proteinStatus = totalProtein >= dailyProteinTarget
      ? '<span style="color:#437a22">✓ ' + totalProtein + ' g protein</span>'
      : '<span style="color:#964219">⚠ ' + totalProtein + ' g protein — add curd or eggs</span>';
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day-card';
    dayDiv.innerHTML = `
      <h3>${day} <small>${proteinStatus}</small></h3>
      <div class="meal-row">
        <span class="meal-label">Lunch</span>
        <button class="recipe-button" onclick="showRecipe(${lr.id})">${lr.name}</button>
        <span class="helper-text">${lr.protein} g protein · Low carb</span>
      </div>
      <div class="meal-row">
        <span class="meal-label">Dinner</span>
        <button class="recipe-button" onclick="showRecipe(${dr.id})">${dr.name}</button>
        <span class="helper-text">${dr.protein} g protein · Carb + protein</span>
      </div>`;
    weekContent.appendChild(dayDiv);
  });
}

function renderToday() {
  const todayContent = document.getElementById('today-content');
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const todayName = days[new Date().getDay()];
  const todayPlan = weeklyPlan[todayName];
  if (!todayPlan) { todayContent.innerHTML = '<p>No plan found for today.</p>'; return; }
  const lr = getRecipeById(todayPlan.lunch);
  const dr = getRecipeById(todayPlan.dinner);
  const totalProtein = 30 + 12 + lr.protein + dr.protein;
  const proteinOk = totalProtein >= dailyProteinTarget;
  const tasks = [
    `Morning: Check if chicken is marinated. If not, marinate now.`,
    `Lunch (${lr.name}): ${lr.tasks[0]}`,
    `Lunch: ${lr.tasks[1]}`,
    `Dinner (${dr.name}): ${dr.tasks[0]}`,
    `Dinner: ${dr.tasks[1]}`
  ];
  todayContent.innerHTML = `
    <p><strong>Today is:</strong> ${todayName}</p>
    <div class="meta-grid">
      <div class="meta-box"><strong>Lunch</strong><br>${lr.name}</div>
      <div class="meta-box"><strong>Dinner</strong><br>${dr.name}</div>
      <div class="meta-box"><strong>Est. Protein</strong><br>${totalProtein} g</div>
      <div class="meta-box"><strong>Target</strong><br>${dailyProteinTarget}–150 g</div>
    </div>
    ${!proteinOk ? '<div class="note-box" style="border-color:#f0b97a;background:#fffaf2"><strong>⚠ Protein low today.</strong> Add 100 g curd or 2 boiled eggs to hit your target.</div>' : '<div class="note-box"><strong>✓ Protein target met</strong> if you have your shake and breakfast.</div>'}
    <h3>Today\'s tasks</h3>
    <ul class="task-list">${tasks.map((t) => `<li>${t}</li>`).join('')}</ul>
    <div class="note-box" style="margin-top:12px">
      <strong>Too tired to cook dinner?</strong> Use Emergency Chicken Curd Bowl instead of ordering.
    </div>`;
}

function renderRecipeGrid() {
  const recipeGrid = document.getElementById('recipe-grid');
  const filtered = activeFilter === 'All'
    ? recipes
    : recipes.filter((r) => r.tags.includes(activeFilter) || r.category === activeFilter);
  recipeGrid.innerHTML = filtered.map((recipe) => `
    <div class="recipe-card">
      <h3>${recipe.name}</h3>
      <div class="tags">
        <span class="tag">${recipe.category}</span>
        <span class="tag">${recipe.mealType}</span>
        <span class="tag">${recipe.prepTime + recipe.cookTime} min</span>
        <span class="tag">${recipe.protein} g protein</span>
      </div>
      <p>${recipe.steps[0]}</p>
      <button class="recipe-button" onclick="showRecipe(${recipe.id})">Open recipe</button>
    </div>`).join('');
}

function showRecipe(id) {
  const recipe = getRecipeById(id);
  const recipeContent = document.getElementById('recipe-content');
  recipeContent.innerHTML = `
    <h3>${recipe.name}</h3>
    <div class="meta-grid">
      <div class="meta-box"><strong>Meal Type</strong><br>${recipe.mealType}</div>
      <div class="meta-box"><strong>Prep Time</strong><br>${recipe.prepTime} min</div>
      <div class="meta-box"><strong>Cook Time</strong><br>${recipe.cookTime} min</div>
      <div class="meta-box"><strong>Protein</strong><br>${recipe.protein} g</div>
    </div>
    <h4>Ingredients</h4>
    <ul class="ingredient-list">
      ${recipe.ingredients.map((item) => `<li>${item.name} — ${item.qty}</li>`).join('')}
    </ul>
    <h4>Cooking Steps</h4>
    <ol class="step-list">
      ${recipe.steps.map((step) => `<li>${step}</li>`).join('')}
    </ol>
    <h4>What to do</h4>
    <ul class="task-list">
      ${recipe.tasks.map((task) => `<li>${task}</li>`).join('')}
    </ul>`;
  recipeContent.scrollIntoView({ behavior: 'smooth' });
}

function renderGroceryList() {
  const groceryContent = document.getElementById('grocery-content');
  const grouped = {};
  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((item) => {
      if (!grouped[item.group]) grouped[item.group] = new Set();
      grouped[item.group].add(`${item.name} — ${item.qty}`);
    });
  });
  groceryContent.innerHTML = Object.keys(grouped).map((group) => `
    <div class="grocery-category">
      <h3>${group}</h3>
      <div class="grocery-list">
        ${[...grouped[group]].map((item) => `<label class="grocery-item"><input type="checkbox" /> <span>${item}</span></label>`).join('')}
      </div>
    </div>`).join('');
}

function bindFilters() {
  document.querySelectorAll('.filter-btn').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      activeFilter = button.dataset.filter;
      renderRecipeGrid();
    });
  });
}

function bindShowAllRecipes() {
  document.getElementById('show-all-recipes').addEventListener('click', () => {
    activeFilter = 'All';
    document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    document.querySelector('.filter-btn[data-filter="All"]').classList.add('active');
    renderRecipeGrid();
    document.getElementById('recipe-content').innerHTML =
      '<p>Click a recipe card to see ingredients and instructions here.</p>';
  });
}
