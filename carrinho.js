// carrinho.js - sistema unificado de carrinho (La Hamburguesa)
// Salva em localStorage com chave "cart"

// ======= helpers =======
function moeda(num) {
    // garante formato com 2 casas
    return Number(num).toFixed(2);
}

// ======= Estrutura do carrinho =======
// cart = [
//   {
//     id: "lahamburguesa-classico",
//     name: "La Hamburguesa Clássico",
//     price: 25.00,
//     quantity: 1,
//     extras: [ { id: "bacon", name: "Bacon", price: 3.00, qty: 1 }, ... ]
//   },
//   ...
// ]
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Buffer temporário para ingredientes (antes do usuário confirmar adicionando o produto)
let extrasBuffer = {}; // extrasBuffer[productId] = { 'bacon': qty, ... }

// ======= Persistência =======
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function loadCart() {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
}

function animatePlusOne(buttonElement) {
    const plusOne = document.createElement("span");
    plusOne.classList.add("plus-one");
    plusOne.textContent = "+1";

    const rect = buttonElement.getBoundingClientRect();

    plusOne.style.left = rect.left + rect.width / 2 + "px";
    plusOne.style.top = rect.top - 10 + "px";

    document.body.appendChild(plusOne);

    setTimeout(() => {
        plusOne.remove();
    }, 900);
}

// ======= Funções públicas: adicionar / remover / alterar quantidade =======

function addToCart(id, name, price, extras = [], buttonElement = null) {
    loadCart();
    price = Number(price);

    // animação +1
    if (buttonElement) {
        animatePlusOne(buttonElement);
    }

    // Procurar item igual (mesmo id e mesmos extras)
    function extrasKey(ex) {
        if (!ex || ex.length === 0) return "";
        const copy = ex.map(e => ({...e})).sort((a,b)=>a.id.localeCompare(b.id));
        return JSON.stringify(copy);
    }

    const key = extrasKey(extras);
    let existing = cart.find(item => item.id === id && extrasKey(item.extras || []) === key);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id,
            name,
            price,
            quantity: 1,
            extras: extras.length ? extras.map(e => ({...e})) : []
        });
    }

    saveCart();
    renderCartFloat();
    // Atualizar contador na página se existir
    updateQuantityDisplay(id);
    
    // Feedback visual - animar botão do carrinho
    animateCartButton();
}

function removeFromCart(indexOrId) {
    loadCart();
    let itemId = null;
    if (typeof indexOrId === "number") {
        if (cart[indexOrId]) {
            itemId = cart[indexOrId].id;
        }
        cart.splice(indexOrId, 1);
    } else {
        itemId = indexOrId;
        cart = cart.filter(i => i.id !== indexOrId);
    }
    saveCart();
    renderCartFloat();
    // Atualizar contador na página se existir
    if (itemId) {
        updateQuantityDisplay(itemId);
    }
}

// Função para remover item do carrinho (usada no cardapio.html)
function removeItem(id) {
    loadCart();
    // Remover todos os itens com esse ID
    cart = cart.filter(i => i.id !== id);
    saveCart();
    renderCartFloat();
    // Atualizar contador de quantidade
    updateQuantityDisplay(id);
}

function changeQuantity(cartIndex, delta) {
    loadCart();
    if (cart[cartIndex]) {
        const itemId = cart[cartIndex].id;
        cart[cartIndex].quantity += delta;
        if (cart[cartIndex].quantity <= 0) {
            cart.splice(cartIndex, 1);
        }
        saveCart();
        renderCartFloat();
        // Atualizar contador na página se existir
        updateQuantityDisplay(itemId);
    }
}

// ======= Exclusivas para compatibilidade com o HTML existente =======
// Seu HTML usa: addItem(id, name, price) para hambúrgueres
// e addItemToCart(...) para acompanhamentos — vamos criar aliases
function adicionarItem(id, name, price, buttonElement = null) {
    // se houver extras temporários para este id, pega-os
    const extras = buildExtrasArrayFor(id);
    addToCart(id, name, price, extras, buttonElement);
    // limpar buffer desse produto
    clearExtrasBuffer(id);
    // Atualizar contador de quantidade se existir
    updateQuantityDisplay(id);
}

// Função para atualizar exibição de quantidade
function updateQuantityDisplay(id) {
    const qtyEl = document.getElementById(`qty-${id}`);
    if (qtyEl) {
        loadCart();
        const item = cart.find(i => i.id === id);
        qtyEl.textContent = item ? item.quantity : "0";
    }
}
function addItem(id, name, price, buttonElement = null) { 
    adicionarItem(id, name, price, buttonElement); 
}
function addItemToCart(id, name, price, buttonElement = null) { 
    adicionarItem(id, name, price, buttonElement); 
}

// ======= Extras (ingredientes) buffer management =======
// Chamadas do HTML: addIngredient(productId, ingredientId, price) e removeIngredient(...)
function addIngredient(productId, ingredientId, price, displayName) {
    price = Number(price);
    extrasBuffer[productId] = extrasBuffer[productId] || {};
    extrasBuffer[productId][ingredientId] = (extrasBuffer[productId][ingredientId] || 0) + 1;
    
    // Armazenar preço do ingrediente
    if (!ingredientPrices[productId]) {
        ingredientPrices[productId] = {};
    }
    ingredientPrices[productId][ingredientId] = price;
    
    updateIngredientDisplays(productId, ingredientId, displayName, price);
}

function removeIngredient(productId, ingredientId, price, displayName) {
    extrasBuffer[productId] = extrasBuffer[productId] || {};
    if (extrasBuffer[productId][ingredientId]) {
        extrasBuffer[productId][ingredientId]--;
        if (extrasBuffer[productId][ingredientId] <= 0) {
            delete extrasBuffer[productId][ingredientId];
        }
    }
    updateIngredientDisplays(productId, ingredientId, displayName, price);
}

// Armazenar preços dos ingredientes quando adicionados
const ingredientPrices = {}; // ingredientPrices[productId][ingredientId] = price

function buildExtrasArrayFor(productId) {
    const obj = extrasBuffer[productId];
    if (!obj) return [];
    const arr = [];
    for (const ingId in obj) {
        const qty = obj[ingId];
        if (!qty || qty <= 0) continue;
        
        // Tentar obter nome e preço
        let name = ingId.charAt(0).toUpperCase() + ingId.slice(1); // Capitalizar primeira letra
        let price = 0;
        
        // Buscar preço armazenado
        if (ingredientPrices[productId] && ingredientPrices[productId][ingId]) {
            price = ingredientPrices[productId][ingId];
        }
        
        // Tentar buscar do DOM como fallback
        const priceEl = document.getElementById(`price-${ingId}-${productId}`);
        if (priceEl && priceEl.dataset.price) {
            price = Number(priceEl.dataset.price);
        }
        
        // Mapear nomes mais amigáveis
        const nameMap = {
            'bacon': 'Bacon',
            'queijo': 'Queijo Extra',
            'tomate': 'Tomate',
            'alface': 'Alface',
            'cebola': 'Cebola',
            'pimenta': 'Pimenta',
            'jalapeno': 'Jalapeño',
            'picles': 'Picles',
            'abacate': 'Abacate'
        };
        
        if (nameMap[ingId]) {
            name = nameMap[ingId];
        }
        
        arr.push({ id: ingId, name, price: Number(price), qty });
    }
    return arr;
}

function clearExtrasBuffer(productId) {
    if (extrasBuffer[productId]) delete extrasBuffer[productId];
    // também atualizar displays se existirem
    const totEl = document.getElementById(`ingredients-total-${productId}`);
    if (totEl) totEl.textContent = "0,00";
    // atualizar contadores individuais se houver
    const els = document.querySelectorAll(`[data-extra-for="${productId}"]`);
    els.forEach(e => {
        const span = e.querySelector(".extra-qty");
        if (span) span.textContent = "0";
    });
}

function updateIngredientDisplays(productId, ingredientId, displayName, unitPrice) {
    // Atualiza o contador <span id="bacon-lahamburguesa-classico">X</span> se existir
    const spanId = `${ingredientId}-${productId}`;
    const span = document.getElementById(spanId);
    const qty = extrasBuffer[productId] && extrasBuffer[productId][ingredientId] ? extrasBuffer[productId][ingredientId] : 0;
    if (span) span.textContent = qty;

    // Atualiza total de extras visível (se existir element id ingredients-total-<productId>)
    const totEl = document.getElementById(`ingredients-total-${productId}`);
    if (totEl) {
        let total = 0;
        for (const ing in extrasBuffer[productId]) {
            const q = extrasBuffer[productId][ing];
            // Buscar preço armazenado primeiro
            let p = 0;
            if (ingredientPrices[productId] && ingredientPrices[productId][ing]) {
                p = ingredientPrices[productId][ing];
            } else {
                // Tentar buscar do DOM como fallback
                const priceEl = document.getElementById(`price-${ing}-${productId}`);
                if (priceEl && !isNaN(Number(priceEl.dataset.price))) {
                    p = Number(priceEl.dataset.price);
                } else if (unitPrice && ing === ingredientId) {
                    p = unitPrice;
                }
            }
            total += (p * q);
        }
        totEl.textContent = moeda(total).replace('.', ',');
    }
}

// ======= RENDERIZAÇÃO DO CARRINHO FLUTUANTE =======
function renderCartFloat() {
    loadCart();
    const container = document.getElementById("cartItems");
    const totalEl = document.getElementById("cartTotal");
    const countEl = document.getElementById("cartCount");
    const cartHeaderTitle = document.querySelector('.cart-header-title h3');

    if (!container) return;

    container.innerHTML = "";
    if (!cart || cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 3em; margin-bottom: 16px; opacity: 0.3;">🛒</div>
                    <p style="font-size: 1em; color: #333; margin-bottom: 8px; font-weight: 600;">Seu carrinho está vazio</p>
                    <p style="font-size: 0.9em; color: #999; margin-bottom: 24px;">Adicione itens deliciosos ao seu carrinho!</p>
                    <a href="cardapio.html" class="btn" style="display: inline-block; text-decoration: none; max-width: 200px;">Ver Cardápio</a>
                </div>
            </div>
        `;
        if (totalEl) {
            const totalSpan = totalEl.querySelector('span:last-child') || totalEl;
            if (totalSpan === totalEl) {
                totalEl.textContent = "R$ 0,00";
            } else {
                totalSpan.textContent = "R$ 0,00";
            }
        }
        if (countEl) countEl.textContent = "0";
        if (cartHeaderTitle) cartHeaderTitle.setAttribute('data-count', '0');
        return;
    }

    let total = 0;
    let count = 0;

    cart.forEach((it, idx) => {
        const extrasHtml = (it.extras && it.extras.length) ? `
            <div class="cart-extras">
                ${it.extras.map(e => `<small>${e.name} x${e.qty} (${moeda(e.price)} each)</small>`).join("<br>")}
            </div>` : "";

        const sub = (Number(it.price) + (it.extras ? it.extras.reduce((a,b)=>a + (Number(b.price||0) * Number(b.qty||1)), 0) : 0)) * it.quantity;
        total += sub;
        count += it.quantity;

        const itemRow = document.createElement("div");
        itemRow.className = "cart-item-row";
        itemRow.innerHTML = `
            <div class="cart-item-name">
                <strong>${it.name}</strong>
                ${extrasHtml}
            </div>
            <div class="cart-item-controls">
                <button onclick="changeQuantity(${idx}, -1)" aria-label="Diminuir quantidade">−</button>
                <span>${it.quantity}</span>
                <button onclick="changeQuantity(${idx}, 1)" aria-label="Aumentar quantidade">+</button>
            </div>
            <div class="cart-item-actions">
                <button onclick="removeFromCart(${idx})" class="btn-remove" aria-label="Remover item" title="Remover item">🗑️</button>
            </div>
            <div class="cart-item-price">R$ ${moeda(sub)}</div>
        `;
        container.appendChild(itemRow);
    });

    if (totalEl) {
        const totalSpan = totalEl.querySelector('span:last-child') || totalEl;
        if (totalSpan === totalEl) {
            totalEl.textContent = moeda(total);
        } else {
            totalSpan.textContent = `R$ ${moeda(total)}`;
        }
    }
    if (countEl) countEl.textContent = String(count);
    if (cartHeaderTitle) {
        cartHeaderTitle.setAttribute('data-count', String(count));
        // Atualizar também o span interno se existir
        const cartHeaderCountSpan = document.getElementById('cartHeaderCount');
        if (cartHeaderCountSpan) {
            if (count > 0) {
                cartHeaderCountSpan.textContent = count;
                cartHeaderCountSpan.style.display = 'inline';
            } else {
                cartHeaderCountSpan.style.display = 'none';
            }
        }
    }
}

// ======= RENDERIZAR RESUMO NA PÁGINA DE PAGAMENTO =======
function renderizarCarrinho() {
    loadCart();
    const container = document.getElementById("resumo-pedido");
    if (!container) return;

    container.innerHTML = "";
    if (!cart || cart.length === 0) {
        container.innerHTML = "<p>Seu carrinho está vazio.</p>";
        return;
    }

    let total = 0;
    cart.forEach((it, idx) => {
        const extrasHtml = (it.extras && it.extras.length) ? `<ul>${it.extras.map(e=>`<li>${e.name} x${e.qty} — R$ ${moeda(e.price*e.qty)}</li>`).join("")}</ul>` : "";
        const sub = (Number(it.price) + (it.extras ? it.extras.reduce((a,b)=>a + (Number(b.price||0) * Number(b.qty||1)), 0) : 0)) * it.quantity;
        total += sub;

        container.innerHTML += `
            <div class="resumo-item">
                <div>
                    <strong>${it.name}</strong>
                    ${extrasHtml}
                    <p>Quantidade: ${it.quantity}</p>
                </div>
                <div>R$ ${moeda(sub)}</div>
            </div>
        `;
    });

    container.innerHTML += `
        <div class="resumo-total"><strong>Total: R$ ${moeda(total)}</strong></div>
    `;
}

// ======= Toggle visual do carrinho =======
function toggleCart() {
    const el = document.getElementById("cartFloat");
    const overlay = document.getElementById("cartOverlay");
    const body = document.body;
    
    if (!el) return;
    
    const isShowing = el.classList.contains("show");
    
    if (isShowing) {
        // Fechar carrinho
        el.classList.remove("show");
        if (overlay) overlay.classList.remove("show");
        if (body) body.style.overflow = "";
    } else {
        // Abrir carrinho
        el.classList.add("show");
        if (overlay) overlay.classList.add("show");
        if (body) body.style.overflow = "hidden"; // Prevenir scroll do body
        renderCartFloat(); // Garantir que o carrinho está atualizado
    }
}

// ======= Finalizar pedido simples =======
function finalizarPedido() {
    // Esta função não deve ser chamada diretamente - o formulário de pagamento cuida disso
    // Mantida para compatibilidade
    console.log("finalizarPedido chamado - redirecionando para pagamento");
    window.location.href = "pagamento.html";
}

// ======= Disponibilizar funções globalmente ANTES do DOMContentLoaded =======
// Isso garante que as funções estejam disponíveis quando o HTML as chamar
window.adicionarItem = adicionarItem;
window.addItem = addItem;
window.addItemToCart = addItemToCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.removeItem = removeItem;
window.changeQuantity = changeQuantity;
window.addIngredient = addIngredient;
window.removeIngredient = removeIngredient;
window.renderizarCarrinho = renderizarCarrinho;
window.toggleCart = toggleCart;
window.finalizarPedido = finalizarPedido;
window.animatePlusOne = animatePlusOne;
window.moeda = moeda;
window.updateQuantityDisplay = updateQuantityDisplay;

// ======= Animação do botão do carrinho =======
function animateCartButton() {
    const cartButton = document.querySelector('.open-cart');
    if (cartButton) {
        cartButton.style.transform = 'scale(1.2) rotate(10deg)';
        setTimeout(() => {
            cartButton.style.transform = '';
        }, 300);
    }
    
    // Animar contador
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.style.transform = 'scale(1.3)';
        cartCount.style.color = '#FF4444';
        setTimeout(() => {
            cartCount.style.transform = '';
            cartCount.style.color = '';
        }, 300);
    }
}

// ======= Fechar carrinho ao clicar fora =======
document.addEventListener('click', function(event) {
    const cartFloat = document.getElementById('cartFloat');
    const openCartBtn = document.querySelector('.open-cart');
    const cartOverlay = document.getElementById('cartOverlay');
    
    if (!cartFloat || !cartOverlay) return;
    
    const isClickInsideCart = cartFloat.contains(event.target);
    const isClickOnCartButton = openCartBtn && openCartBtn.contains(event.target);
    const isCartOpen = cartFloat.classList.contains('show');
    
    // Se clicou no overlay, fechar carrinho
    if (event.target === cartOverlay && isCartOpen) {
        toggleCart();
    }
});

// ======= Fechar carrinho com ESC =======
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const cartFloat = document.getElementById('cartFloat');
        if (cartFloat && cartFloat.classList.contains('show')) {
            toggleCart();
        }
    }
});

// ======= Inicialização: alias e eventos =======
document.addEventListener("DOMContentLoaded", function() {
    loadCart();
    renderCartFloat();
    
    // Atualizar contadores de quantidade na página
    if (cart && cart.length > 0) {
        cart.forEach(item => {
            updateQuantityDisplay(item.id);
        });
    }
    
    // Adicionar evento de scroll para fechar carrinho no mobile
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
        const cartFloat = document.getElementById('cartFloat');
        if (cartFloat && cartFloat.classList.contains('show')) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (Math.abs(scrollTop - lastScrollTop) > 50) {
                // Fechar carrinho apenas em mobile ao rolar
                if (window.innerWidth <= 768) {
                    toggleCart();
                }
            }
            lastScrollTop = scrollTop;
        }
    });
});
