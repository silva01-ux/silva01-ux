// Sistema de Ingredientes Personalizáveis
window.ingredients = window.ingredients || {}; // Armazenar ingredientes por item (global)

// Carregar ingredientes do localStorage
function loadIngredients() {
  const savedIngredients = localStorage.getItem('lahamburguesaIngredients');
  
  if (savedIngredients) {
    window.ingredients = JSON.parse(savedIngredients);
    Object.keys(window.ingredients).forEach(itemId => {
      Object.keys(window.ingredients[itemId]).forEach(ingredient => {
        updateIngredientDisplay(itemId, ingredient);
      });
      updateIngredientsTotal(itemId);
    });
  }
}

function addIngredient(itemId, ingredientName, price) {
  if (!window.ingredients[itemId]) {
    window.ingredients[itemId] = {};
  }
  
  if (!window.ingredients[itemId][ingredientName]) {
    window.ingredients[itemId][ingredientName] = { quantity: 0, price: price };
  }
  
  window.ingredients[itemId][ingredientName].quantity += 1;
  updateIngredientDisplay(itemId, ingredientName);
  updateIngredientsTotal(itemId);
  
  // Salvar no localStorage
  localStorage.setItem('lahamburguesaIngredients', JSON.stringify(window.ingredients));
}

function removeIngredient(itemId, ingredientName, price) {
  if (window.ingredients[itemId] && window.ingredients[itemId][ingredientName] && window.ingredients[itemId][ingredientName].quantity > 0) {
    window.ingredients[itemId][ingredientName].quantity -= 1;
    
    if (window.ingredients[itemId][ingredientName].quantity === 0) {
      delete window.ingredients[itemId][ingredientName];
    }
    
    updateIngredientDisplay(itemId, ingredientName);
    updateIngredientsTotal(itemId);
    
    // Salvar no localStorage
    localStorage.setItem('lahamburguesaIngredients', JSON.stringify(window.ingredients));
  }
}

function updateIngredientDisplay(itemId, ingredientName) {
  const element = document.getElementById(`${ingredientName}-${itemId}`);
  if (element) {
    element.textContent = window.ingredients[itemId] && window.ingredients[itemId][ingredientName] 
      ? window.ingredients[itemId][ingredientName].quantity 
      : 0;
  }
}

function updateIngredientsTotal(itemId) {
  let total = 0;
  if (window.ingredients[itemId]) {
    Object.keys(window.ingredients[itemId]).forEach(ingredient => {
      total += window.ingredients[itemId][ingredient].quantity * window.ingredients[itemId][ingredient].price;
    });
  }
  
  const totalElement = document.getElementById(`ingredients-total-${itemId}`);
  if (totalElement) {
    totalElement.textContent = total.toFixed(2);
  }
}

// Inicializar ingredientes quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadIngredients);
} else {
  loadIngredients();
}

