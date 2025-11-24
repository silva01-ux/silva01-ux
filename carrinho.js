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

// ======= Funções públicas: adicionar / remover / alterar quantidade =======

function addToCart(id, name, price, extras = []) {
    price = Number(price);
    // Procurar item igual (mesmo id e mesmos extras)
    // Consideramos itens com diferenças de extras como entradas separadas,
    // a menos que extras stringifiquem igual.
    function extrasKey(ex) {
        if (!ex || ex.length === 0) return "";
        // ordenar por id para consistência
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
}

function removeFromCart(indexOrId) {
    if (typeof indexOrId === "number") {
        cart.splice(indexOrId, 1);
    } else {
        cart = cart.filter(i => i.id !== indexOrId);
    }
    saveCart();
    renderCartFloat();
}

function changeQuantity(cartIndex, delta) {
    if (cart[cartIndex]) {
        cart[cartIndex].quantity += delta;
        if (cart[cartIndex].quantity <= 0) {
            cart.splice(cartIndex, 1);
        }
        saveCart();
        renderCartFloat();
    }
}

// ======= Exclusivas para compatibilidade com o HTML existente =======
// Seu HTML usa: addItem(id, name, price) para hambúrgueres
// e addItemToCart(...) para acompanhamentos — vamos criar aliases
function adicionarItem(id, name, price) {
    // se houver extras temporários para este id, pega-os
    const extras = buildExtrasArrayFor(id);
    addToCart(id, name, price, extras);
    // limpar buffer desse produto
    clearExtrasBuffer(id);
}
function addItem(id, name, price) { adicionarItem(id, name, price); }
function addItemToCart(id, name, price) { adicionarItem(id, name, price); }

// ======= Extras (ingredientes) buffer management =======
// Chamadas do HTML: addIngredient(productId, ingredientId, price) e removeIngredient(...)
function addIngredient(productId, ingredientId, price, displayName) {
    price = Number(price);
    extrasBuffer[productId] = extrasBuffer[productId] || {};
    extrasBuffer[productId][ingredientId] = (extrasBuffer[productId][ingredientId] || 0) + 1;
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

function buildExtrasArrayFor(productId) {
    const obj = extrasBuffer[productId];
    if (!obj) return [];
    const arr = [];
    for (const ingId in obj) {
        const qty = obj[ingId];
        if (!qty || qty <= 0) continue;
        // tentaremos capturar um nome e preço a partir do DOM se possível
        // fallback genérico:
        let name = ingId;
        let price = 0;
        // procurar um element com id pattern: `${ingId}-${productId}-price` ou similar
        // (não obrigatório) — aqui mantemos preço passado nos handlers do HTML preferencialmente
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
        // para calcular, tentamos somar preços. Mas como o HTML original passa unitPrice nos onclick,
        // aqui precisamos que o onclick chame addIngredient(productId, ingId, price, 'Nome') com price.
        // Vamos percorrer extrasBuffer[productId] e somar preços se disponíveis no dataset.
        let total = 0;
        for (const ing in extrasBuffer[productId]) {
            const q = extrasBuffer[productId][ing];
            // tentar preço do DOM: elemento com id `price-${ing}-${productId}`
            const priceEl = document.getElementById(`price-${ing}-${productId}`);
            let p = unitPrice || 0;
            if (priceEl && !isNaN(Number(priceEl.dataset.price))) p = Number(priceEl.dataset.price);
            // se não houver priceEl, usamos the unitPrice passed for the last change (best effort)
            total += (p * q);
        }
        totEl.textContent = moeda(total);
    }
}

// ======= RENDERIZAÇÃO DO CARRINHO FLUTUANTE =======
function renderCartFloat() {
    loadCart();
    const container = document.getElementById("cartItems");
    const totalEl = document.getElementById("cartTotal");
    const countEl = document.getElementById("cartCount");

    if (!container) return;

    container.innerHTML = "";
    if (!cart || cart.length === 0) {
        container.innerHTML = "<p class='empty-cart'>Carrinho vazio</p>";
        if (totalEl) totalEl.textContent = "0,00";
        if (countEl) countEl.textContent = "0";
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

        container.innerHTML += `
            <div class="cart-item-row">
                <div class="cart-item-name">
                    <strong>${it.name}</strong>
                    ${extrasHtml}
                </div>
                <div class="cart-item-controls">
                    <button onclick="changeQuantity(${idx}, -1)" aria-label="Diminuir">-</button>
                    <span>${it.quantity}</span>
                    <button onclick="changeQuantity(${idx}, 1)" aria-label="Aumentar">+</button>
                    <button onclick="removeFromCart(${idx})" aria-label="Remover">Remover</button>
                </div>
                <div class="cart-item-price">R$ ${moeda(sub)}</div>
            </div>
        `;
    });

    if (totalEl) totalEl.textContent = moeda(total);
    if (countEl) countEl.textContent = String(count);
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
    if (!el) return;
    el.classList.toggle("show");
}

// ======= Finalizar pedido simples =======
function finalizarPedido() {
    // lógica básica: limpar carrinho e redirecionar
    localStorage.removeItem("cart");
    cart = [];
    renderCartFloat();
    alert("Pedido finalizado! Obrigado pela preferência.");
    window.location.href = "index.html";
}

// ======= Inicialização: alias e eventos =======
document.addEventListener("DOMContentLoaded", function() {
    // Aliases para compatibilidade com nomes antigos
    window.adicionarItem = adicionarItem;
    window.addItem = addItem;
    window.addItemToCart = addItemToCart;
    window.addToCart = addToCart; // novo
    window.removeFromCart = removeFromCart;
    window.changeQuantity = changeQuantity;
    window.addIngredient = addIngredient;
    window.removeIngredient = removeIngredient;
    window.renderizarCarrinho = renderizarCarrinho;
    window.toggleCart = toggleCart;
    window.finalizarPedido = finalizarPedido;

    renderCartFloat();
});
