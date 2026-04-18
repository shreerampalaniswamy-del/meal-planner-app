const weeklyPlan = {
  Monday: { lunch: 1, dinner: 2 },
  Tuesday: { lunch: 1, dinner: 3 },
  Wednesday: { lunch: 1, dinner: 2 },
  Thursday: { lunch: 1, dinner: 3 },
  Friday: { lunch: 1, dinner: 2 },
  Saturday: { lunch: 1, dinner: 3 },
  Sunday: { lunch: 1, dinner: 2 }
};

let recipes = [];

fetch("recipes.json")
  .then(response => response.json())
  .then(data => {
    recipes = data;
    renderWeek();
    renderToday();
    renderGroceryList();
  });

function getRecipeById(id) {
  return recipes.find(recipe => recipe.id === id);
}

function renderWeek() {
  const weekContent = document.getElementById("week-content");
  weekContent.innerHTML = "";

  for (const day in weeklyPlan) {
    const lunchRecipe = getRecipeById(weeklyPlan[day].lunch);
    const dinnerRecipe = getRecipeById(weeklyPlan[day].dinner);

    const dayDiv = document.createElement("div");
    dayDiv.className = "day-card";
    dayDiv.innerHTML = `
      <h3>${day}</h3>
      <p><strong>Lunch:</strong> 
        <button class="recipe-button" onclick="showRecipe(${lunchRecipe.id})">${lunchRecipe.name}</button>
      </p>
      <p><strong>Dinner:</strong> 
        <button class="recipe-button" onclick="showRecipe(${dinnerRecipe.id})">${dinnerRecipe.name}</button>
      </p>
    `;
    weekContent.appendChild(dayDiv);
  }
}

function showRecipe(id) {
  const recipe = getRecipeById(id);
  const recipeContent = document.getElementById("recipe-content");

  recipeContent.innerHTML = `
    <h3>${recipe.name}</h3>
    <p><strong>Meal Type:</strong> ${recipe.mealType}</p>
    <p><strong>Prep Time:</strong> ${recipe.prepTime} min</p>
    <p><strong>Cook Time:</strong> ${recipe.cookTime} min</p>
    <p><strong>Protein:</strong> ${recipe.protein} g</p>

    <h4>Ingredients</h4>
    <ul>
      ${recipe.ingredients.map(item => `<li>${item.name} - ${item.qty}</li>`).join("")}
    </ul>

    <h4>Steps</h4>
    <ol>
      ${recipe.steps.map(step => `<li>${step}</li>`).join("")}
    </ol>
  `;
}

function renderToday() {
  const todayContent = document.getElementById("today-content");
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = days[new Date().getDay()];
  const todayPlan = weeklyPlan[todayName];

  if (!todayPlan) {
    todayContent.innerHTML = "<p>No plan found for today.</p>";
    return;
  }

  const lunchRecipe = getRecipeById(todayPlan.lunch);
  const dinnerRecipe = getRecipeById(todayPlan.dinner);

  todayContent.innerHTML = `
    <p><strong>Today is:</strong> ${todayName}</p>
    <p><strong>Lunch:</strong> ${lunchRecipe.name}</p>
    <p><strong>Dinner:</strong> ${dinnerRecipe.name}</p>
    <p><strong>What to do:</strong> Check if chicken is marinated, cook lunch, then follow dinner recipe in the evening.</p>
  `;
}

function renderGroceryList() {
  const groceryContent = document.getElementById("grocery-content");
  let allIngredients = [];

  recipes.forEach(recipe => {
    recipe.ingredients.forEach(item => {
      allIngredients.push(item.name + " - " + item.qty);
    });
  });

  groceryContent.innerHTML = `
    <ul>
      ${allIngredients.map(item => `<li>${item}</li>`).join("")}
    </ul>
  `;
}