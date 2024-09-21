let cart = new Map();

function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = new Map(JSON.parse(savedCart));
    }
}

function updateCartDisplay() {
    const cartContainer = document.getElementById('cart-items');
    cartContainer.innerHTML = ''; 

    cart.forEach((item, itemName) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="../Image/${item.imageName}" alt="${itemName}">
            <div class="cart-item-details">
                <h3>${itemName}</h3>
                <div class="quantity-control">
                    <button class="decrease" data-item="${itemName}">-</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="increase" data-item="${itemName}">+</button>
                </div>
                <p>Price: ${formatPrice(item.price * item.quantity * 1000)} VND</p>
            </div>
        `;
        cartContainer.appendChild(cartItem);
    });

    document.querySelectorAll('.increase').forEach(button => {
        button.addEventListener('click', function() {
            const itemName = this.getAttribute('data-item');
            adjustQuantity(itemName, 1);
        });
    });

    document.querySelectorAll('.decrease').forEach(button => {
        button.addEventListener('click', function() {
            const itemName = this.getAttribute('data-item');
            adjustQuantity(itemName, -1);
        });
    });

    calculateTotals();
}

function adjustQuantity(itemName, adjustment) {
    if (cart.has(itemName)) {
        const item = cart.get(itemName);
        item.quantity += adjustment;

        if (item.quantity <= 0) {
            cart.delete(itemName);  // Remove item if quantity is 0 or less
        } else {
            cart.set(itemName, item);  // Update quantity
        }

        saveCart();  // Save the updated cart
        updateCartDisplay();  // Update the display
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(Array.from(cart.entries())));
}

function calculateTotals() {
    const priceField = document.getElementById('price');
    const shippingField = document.getElementById('shipping');
    const totalField = document.getElementById('total');

    let totalPrice = Array.from(cart.values()).reduce((total, item) => total + (item.price * item.quantity), 0);
    totalPrice = totalPrice * 1000; // Assuming this multiplication is to adjust the unit

    let shipping = 0; // Initialize shipping as 0 by default
    const deliveryOption = document.querySelector('input[name="order_option"][value="delivery"]:checked');
    if (deliveryOption) {
        shipping = totalPrice > 300000 ? 0 : 20000; // Apply shipping fee only if 'delivery' is selected and under a certain amount
    }

    priceField.value = formatPrice(totalPrice) + ' VND';
    shippingField.value = formatPrice(shipping) + ' VND';
    totalField.value = formatPrice(totalPrice + shipping) + ' VND';
}



function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

document.querySelectorAll('input[name="order_option"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const branchInput = document.querySelector('.branch-address');
        const addressInputs = document.querySelector('.address');
        const datetimeInput = document.querySelector('.datetime');
        const shippingInputContainer = document.querySelector('.totals label:nth-child(2)'); // Assuming the second label in `.totals` is the shipping container

        if (this.value === 'pickup') {
            branchInput.style.display = 'block';
            addressInputs.style.display = 'none';
            datetimeInput.style.display = 'block';
            shippingInputContainer.style.display = 'none'; // Hide the shipping container
        } else if (this.value === 'delivery') {
            branchInput.style.display = 'none';
            addressInputs.style.display = 'block';
            datetimeInput.style.display = 'block';
            shippingInputContainer.style.display = 'block'; // Show the shipping container
        }
        calculateTotals();  // Recalculate totals any time the delivery/pickup option changes
    });
});




window.addEventListener('load', function() {
    loadCart();
    updateCartDisplay();
});

document.querySelector('.menu-icon').addEventListener('click', function() {
    const dropdown = document.querySelector('.dropdown-menu');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  });
  
