// Sistema de Carrinho
let cart = {};
let cartTotal = 0;

function addItem(id, name, price) {
  if (cart[id]) {
    cart[id].quantity += 1;
  } else {
    cart[id] = { 
      name, 
      price, 
      quantity: 1,
      ingredients: window.ingredients && window.ingredients[id] ? window.ingredients[id] : {}
    };
  }
  
  updateQuantityDisplay(id);
  updateCart();
}

function removeItem(id) {
  if (cart[id] && cart[id].quantity > 0) {
    cart[id].quantity -= 1;
    if (cart[id].quantity === 0) {
      delete cart[id];
    }
    updateQuantityDisplay(id);
    updateCart();
  }
}

function updateQuantityDisplay(id) {
  const element = document.getElementById(`qty-${id}`);
  if (element) {
    element.textContent = cart[id] ? cart[id].quantity : 0;
  }
}

function updateCart() {
  const cartItems = document.getElementById('cartItems');
  const cartCount = document.getElementById('cartCount');
  const cartTotalElement = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  
  cartTotal = 0;
  let totalItems = 0;
  
  if (Object.keys(cart).length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">Carrinho vazio</p>';
    checkoutBtn.style.display = 'none';
  } else {
    cartItems.innerHTML = '';
    Object.keys(cart).forEach(id => {
      const item = cart[id];
      let itemTotal = item.price * item.quantity;
      
      // Adicionar custo dos ingredientes apenas se existirem e forem maiores que 0
      if (window.ingredients && window.ingredients[id]) {
        Object.keys(window.ingredients[id]).forEach(ingredient => {
          if (window.ingredients[id][ingredient].quantity > 0) {
            itemTotal += window.ingredients[id][ingredient].quantity * window.ingredients[id][ingredient].price * item.quantity;
          }
        });
      }
      
      cartTotal += itemTotal;
      totalItems += item.quantity;
      
      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      
      // Criar lista de ingredientes apenas se existirem e forem maiores que 0
      let ingredientsList = '';
      if (window.ingredients && window.ingredients[id]) {
        Object.keys(window.ingredients[id]).forEach(ingredient => {
          if (window.ingredients[id][ingredient].quantity > 0) {
            ingredientsList += `<small>+ ${ingredient}: ${window.ingredients[id][ingredient].quantity}x</small><br>`;
          }
        });
      }
      
      cartItem.innerHTML = `
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>R$ ${item.price.toFixed(2)}</p>
          ${ingredientsList ? `<div class="ingredients-summary">${ingredientsList}</div>` : ''}
        </div>
        <div class="cart-item-controls">
          <button onclick="removeItem('${id}')" aria-label="Remover item">-</button>
          <span>${item.quantity}</span>
          <button onclick="addItem('${id}', '${item.name}', ${item.price})" aria-label="Adicionar item">+</button>
        </div>
      `;
      cartItems.appendChild(cartItem);
    });
    checkoutBtn.style.display = 'block';
  }
  
  cartCount.textContent = totalItems;
  cartTotalElement.textContent = cartTotal.toFixed(2);
  
  // Salvar no localStorage
  localStorage.setItem('lahamburguesaCart', JSON.stringify(cart));
}

function toggleCart() {
  const cartFloat = document.getElementById('cartFloat');
  cartFloat.classList.toggle('show');
}

// Carregar carrinho do localStorage
function loadCart() {
  const savedCart = localStorage.getItem('lahamburguesaCart');
  
  if (savedCart) {
    cart = JSON.parse(savedCart);
    Object.keys(cart).forEach(id => {
      updateQuantityDisplay(id);
    });
  }
  
  updateCart();
}

// Tornar ingredients acessível globalmente
window.ingredients = window.ingredients || {};

// Inicializar carrinho quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadCart);
} else {
  loadCart();
}


