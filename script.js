const weeklyPlan = {
  Monday: { lunch: 1, dinner: 2 },
  Tuesday: { lunch: 4, dinner: 3 },
  Wednesday: { lunch: 1, dinner: 5 },
  Thursday: { lunch: 4, dinner: 2 },
  Friday: { lunch: 1, dinner: 3 },
  Saturday: { lunch: 4, dinner: 6 },
  Sunday: { lunch: 1, dinner: 2 }
};

let recipes = [];

fetch('recipes.json')
  .then((response) => response.json())
  .then((data) => {
    recipes = data;
    renderWeek();
    renderToday();
    renderGroceryList();
    bindShowAllRecipes();
  })
  .catch(() => {
    document.getElementById('today-content').innerHTML = '<p>Could not load recipes.json. Please check that the file is uploaded correctly.</p>';
  });

function getRecipeById(id) {
  return recipes.find((recipe) => recipe.id === id);
}

function renderWeek() {
  const weekContent = document.getElementById('week-content');
  weekContent.innerHTML = '';

  Object.keys(weeklyPlan).forEach((day) => {
    const lunchRecipe = getRecipeById(weeklyPlan[day].lunch);
    const dinnerRecipe = getRecipeById(weeklyPlan[day].dinner);

    const dayDiv = document.createElement('div');
    dayDiv.className = 'day-card';
    dayDiv.innerHTML = `
      <h3>${day}</h3>
      <div class="meal-row">
        <span class="meal-label">Lunch</span>
        <button class="recipe-button" onclick="showRecipe(${lunchRecipe.id})">${lunchRecipe.name}</button>
        <span class="helper-text">${lunchRecipe.protein} g protein</span>
      </div>
      <div class="meal-row">
        <span class="meal-label">Dinner</span>
        <button class="recipe-button" onclick="showRecipe(${dinnerRecipe.id})">${dinnerRecipe.name}</button>
        <span class="helper-text">${dinnerRecipe.protein} g protein</span>
      </div>
    `;
    weekContent.appendChild(dayDiv);
  });
}

function renderToday() {
  const todayContent = document.getElementById('today-content');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];
  const todayPlan = weeklyPlan[todayName];

  if (!todayPlan) {
    todayContent.innerHTML = '<p>No plan found for today.</p>';
    return;
  }

  const lunchRecipe = getRecipeById(todayPlan.lunch);
  const dinnerRecipe = getRecipeById(todayPlan.dinner);

  const combinedTasks = [
    `Lunch: ${lunchRecipe.tasks[0] || 'Prepare lunch ingredients.'}`,
    `Lunch: ${lunchRecipe.tasks[1] || 'Cook lunch.'}`,
    `Dinner: ${dinnerRecipe.tasks[0] || 'Prepare dinner ingredients.'}`,
    `Dinner: ${dinnerRecipe.tasks[1] || 'Cook dinner.'}`
  ];

  todayContent.innerHTML = `
    <p><strong>Today is:</strong> ${todayName}</p>
    <p><strong>Lunch:</strong> ${lunchRecipe.name} (${lunchRecipe.protein} g protein)</p>
    <p><strong>Dinner:</strong> ${dinnerRecipe.name} (${dinnerRecipe.protein} g protein)</p>
    <h3>Today's tasks</h3>
    <ul class="task-list">
      ${combinedTasks.map((task) => `<li>${task}</li>`).join('')}
    </ul>
    <div class="note-box">
      <strong>Backup rule:</strong> If you are too tired in the evening, use the Emergency Eggs Curd Fruit Plate instead of ordering food.
    </div>
  `;
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
      ${recipe.ingredients.map((item) => `<li>${item.name} - ${item.qty}</li>`).join('')}
    </ul>

    <h4>Cooking Steps</h4>
    <ol class="step-list">
      ${recipe.steps.map((step) => `<li>${step}</li>`).join('')}
    </ol>

    <h4>What needs to be done</h4>
    <ul class="task-list">
      ${recipe.tasks.map((task) => `<li>${task}</li>`).join('')}
    </ul>
  `;
}

function renderGroceryList() {
  const groceryContent = document.getElementById('grocery-content');
  const grouped = {};

  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((item) => {
      if (!grouped[item.group]) {
        grouped[item.group] = [];
      }
      grouped[item.group].push(`${item.name} - ${item.qty}`);
    });
  });

  groceryContent.innerHTML = Object.keys(grouped)
    .map((group) => `
      <div class="grocery-category">
        <h3>${group}</h3>
        <div class="grocery-list">
          ${grouped[group].map((item) => `<label class="grocery-item"><input type="checkbox" /> <span>${item}</span></label>`).join('')}
        </div>
      </div>
    `)
    .join('');
}

function bindShowAllRecipes() {
  const button = document.getElementById('show-all-recipes');
  button.addEventListener('click', () => {
    const recipeContent = document.getElementById('recipe-content');
    recipeContent.innerHTML = `
      <h3>All Recipes</h3>
      <ul class="recipe-list">
        ${recipes.map((recipe) => `<li><button class="recipe-button" onclick="showRecipe(${recipe.id})">${recipe.name}</button></li>`).join('')}
      </ul>
    `;
  });
}
