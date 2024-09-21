let slideIndex = 0;
let slides = document.getElementsByClassName("mySlides");
let timer;
let cart = new Map(); // Cart Map

// Function to update cart icon quantity
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    let totalQuantity = 0;

    cart.forEach(item => {
        totalQuantity += item.quantity;
    });

    cartCountElement.innerText = totalQuantity;
}

function showSlides(n) {
    clearInterval(timer);
    if (n > slides.length - 1) {
        slideIndex = 0;
    } else if (n < 0) {
        slideIndex = slides.length - 1;
    } else {
        slideIndex = n;
    }

    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }

    slides[slideIndex].style.display = "block";
    timer = setTimeout(function() { showSlides(slideIndex + 1); }, 5000);
}

function plusSlides(n) {
    showSlides(slideIndex += n);
}

window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    header.style.backgroundColor = (window.pageYOffset > 0) ? '#E6D1F2' : 'transparent';
});

document.querySelector('.menu-icon').addEventListener('click', function() {
  const dropdown = document.querySelector('.dropdown-menu');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
});

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.menu-icon')) {
      var dropdowns = document.getElementsByClassName("dropdown-menu");
      for (var i = 0; i < dropdowns.length; i++) {
          var openDropdown = dropdowns[i];
          if (openDropdown.style.display === 'block') {
              openDropdown.style.display = 'none';
          }
      }
  }
};


function addToCart(itemName, quantity, price, imageName) {
    if (cart.has(itemName)) {
        let item = cart.get(itemName);
        item.quantity += quantity;
        cart.set(itemName, item);
    } else {
        cart.set(itemName, { quantity: quantity, price: price, imageName: imageName });
    }

    console.log(cart)

    saveCart(); // Save cart to localStorage
    updateCartCount(); // Update cart count icon
}

// Event listener for adding items to the cart
document.querySelectorAll('.price-cart button').forEach(button => {
    button.addEventListener('click', function() {
        const cookieColumn = this.closest('.cookie-column'); 
        const itemName = cookieColumn.querySelector('.cookie-text h4').innerText; 
        const priceText = cookieColumn.querySelector('.price-cart label').innerText; 
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')); 
        const imageName = cookieColumn.querySelector('img').src.split('/').pop();

        addToCart(itemName, 1, price, imageName); 
    });
});

// Function to save the cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(Array.from(cart.entries())));
}

// On page load, show the slides and update the cart count
window.addEventListener('load', function() {
    showSlides(slideIndex);
    updateCartCount(); // Load and display the cart count when the page loads
});
