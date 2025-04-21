// Initialize variables
let cart = [];
const storageKey = 'groceryCart';

// Supabase Client Initialization
const SUPABASE_URL = 'https://mwhkflqitlobymqdzbsj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13aGtmbHFpdGxvYnltcWR6YnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMDYyMTcsImV4cCI6MjA2MDc4MjIxN30.lXXuOrOG8HE0OF4lfXXaoZef1QbStOL6xI8So9-DkPw'; 

let supabase = null;
try {
  // Use the correct method to create the client
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("Supabase client initialized successfully");
} catch (error) {
  console.error("Supabase initialization failed:", error);
  alert("Failed to connect to the database. Please check your Supabase URL and Key.");
}

// Initialize categories
async function initializeCategories() {
  const categoriesContainer = document.getElementById('categories-container');
  if (!categoriesContainer) return;
  
  const products = await fetchAllProducts();
  
  const categories = [...new Set(products.map(product => product.category))].sort();
  
  categories.forEach(category => {
    const subcategories = [...new Set(
      products
        .filter(product => product.category === category)
        .map(product => product.subcategory)
    )].sort();
    
    const categoryElement = document.createElement('div');
    categoryElement.className = 'category-item mb-2';
    
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'category-header cursor-pointer flex items-center p-2 hover:bg-gray-100 rounded transition-colors';
    categoryHeader.innerHTML = `
      <span class="flex-grow font-medium">${category}</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 category-icon transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    `;
    
    const subcategoriesContainer = document.createElement('div');
    subcategoriesContainer.className = 'subcategories ml-4 hidden mt-1 space-y-1';
    
    subcategories.forEach(subcategory => {
      const subcategoryElement = document.createElement('div');
      subcategoryElement.className = 'subcategory-item p-2 cursor-pointer hover:bg-gray-100 rounded transition-colors text-sm';
      subcategoryElement.textContent = subcategory;
      
      subcategoryElement.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent category click event
        const filteredProducts = products.filter(product => 
          product.subcategory === subcategory && product.category === category
        );
        renderProducts(filteredProducts);
        
        document.querySelectorAll('.subcategory-item, .category-header').forEach(el => {
          el.classList.remove('bg-blue-100');
        });
        subcategoryElement.classList.add('bg-blue-100');
      });
      
      subcategoriesContainer.appendChild(subcategoryElement);
    });
    
    categoryHeader.addEventListener('click', () => {
      subcategoriesContainer.classList.toggle('hidden');
      const icon = categoryHeader.querySelector('.category-icon');
      icon.classList.toggle('rotate-180');
      
      const filteredProducts = products.filter(product => 
        product.category === category
      );
      renderProducts(filteredProducts);
      
      document.querySelectorAll('.subcategory-item, .category-header').forEach(el => {
        el.classList.remove('bg-blue-100');
      });
      categoryHeader.classList.add('bg-blue-100');
    });
    
    categoryElement.appendChild(categoryHeader);
    categoryElement.appendChild(subcategoriesContainer);
    categoriesContainer.appendChild(categoryElement);
  });
}

// Initialize search functionality
function initializeSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase().trim();
    
    if (query === '') {
      renderProducts(allProducts); // Show all cached products
      return;
    }
    
    const filteredProducts = allProducts.filter(product => 
      (product.name && product.name.toLowerCase().includes(query)) ||
      (product.description && product.description.toLowerCase().includes(query)) ||
      (product.category && product.category.toLowerCase().includes(query)) ||
      (product.subcategory && product.subcategory.toLowerCase().includes(query))
    );
    
    renderProducts(filteredProducts);
  });
}

// Render products in the products container
function renderProducts(productsToRender) {
  const productsContainer = document.getElementById('products-container');
  if (!productsContainer) return;
  
  productsContainer.innerHTML = ''; // Clear previous products
  
  if (!productsToRender || productsToRender.length === 0) {
    productsContainer.innerHTML = '<p class="text-center py-4">No products found.</p>';
    return;
  }
  
  productsToRender.forEach(product => {
    if (!product) return; // Skip if product data is somehow null/undefined
    
    const productElement = document.createElement('div');
    productElement.className = 'product-card bg-white rounded-lg shadow-md p-4 transition-transform hover:scale-105 flex flex-col'; // Added flex
    
    const imageUrl = product.image ? product.image : 'images/placeholder.png'; // Fallback image
    const buttonClass = product.inStock && product.quantity > 0
      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
      : 'bg-gray-300 text-gray-500 cursor-not-allowed';
    const stockStatus = product.inStock && product.quantity > 0 
      ? `<span class="text-green-500">In Stock (${product.quantity})</span>` 
      : '<span class="text-red-500">Out of Stock</span>';

    productElement.innerHTML = `
      <img src="${imageUrl}" alt="${product.name || 'Product Image'}" class="w-full h-40 object-cover rounded-md mb-2">
      <h3 class="font-medium text-lg">${product.name || 'N/A'}</h3>
      <p class="text-gray-600 text-sm mb-2 flex-grow">${product.description || ''}</p> <!-- Added flex-grow -->
      <div class="flex justify-between items-center mt-auto"> <!-- Added mt-auto -->
        <span class="font-bold">$${product.price ? product.price.toFixed(2) : 'N/A'} / ${product.unit || 'unit'}</span>
        ${stockStatus}
      </div>
      <button class="add-to-cart w-full mt-3 py-2 px-4 rounded ${buttonClass}" 
              data-product-id="${product.id}" 
              ${!product.inStock || product.quantity <= 0 ? 'disabled' : ''}>
        Add to Cart
      </button>
    `;
    
    if (product.inStock && product.quantity > 0) {
      const addToCartButton = productElement.querySelector('.add-to-cart');
      addToCartButton.addEventListener('click', () => {
        // Pass only the ID, fetch details inside addToCart
        addToCart(product.id);
      });
    }
    
    productsContainer.appendChild(productElement);
  });
}

// Fetch all products from Supabase
async function fetchAllProducts() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true }); // Optional: order products

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  allProducts = data; // Cache the fetched products
  return data;
}

// Add product to cart - Modified to be async and fetch product details
async function addToCart(productId) {
  if (!supabase) return;
  
  // Fetch fresh product details from Supabase
  const product = await fetchProductById(productId);

  if (!product) {
      alert('Could not find product details. Please try again.');
      return;
  }

  // Check current availability
  if (!product.inStock || product.quantity <= 0) {
    alert(`Sorry, ${product.name} is currently out of stock.`);
    renderProducts(allProducts); // Re-render to show latest stock status
    return;
  }
  
  const cartItem = cart.find(item => item.id === product.id);
  const currentQuantityInCart = cartItem ? cartItem.quantity : 0;
  
  // Check if adding one more exceeds available DB quantity
  if (currentQuantityInCart + 1 > product.quantity) {
    alert(`Sorry, only ${product.quantity} unit(s) of ${product.name} available.`);
    return;
  }
  
  // If checks pass, update cart (in memory/localStorage)
  if (cartItem) {
    cartItem.quantity++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      unit: product.unit,
      image: product.image // Keep image in cart for display
    });
  }
  
  saveCart(); // Save updated cart to localStorage
  updateCartUI();
  showNotification(`Added ${product.name} to cart`);
}

// Update cart UI - Modified to handle potential async in quantity updates
function updateCartUI() {
  updateCartCount();
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalElement = document.getElementById('cart-total');
  const placeOrderButton = document.getElementById('place-order-btn');

  if (!cartItemsContainer || !cartTotalElement) return;
  
  cartItemsContainer.innerHTML = '';
  let totalPrice = 0;
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="text-center py-4">Your cart is empty.</p>';
    if (placeOrderButton) {
      placeOrderButton.classList.add('bg-gray-300', 'cursor-not-allowed');
      placeOrderButton.classList.remove('bg-blue-500', 'hover:bg-blue-600');
      placeOrderButton.disabled = true;
    }
    cartTotalElement.textContent = '$0.00';
    return;
  }
  
  if (placeOrderButton) {
    placeOrderButton.classList.remove('bg-gray-300', 'cursor-not-allowed');
    placeOrderButton.classList.add('bg-blue-500', 'hover:bg-blue-600');
    placeOrderButton.disabled = false;
  }
  
  cart.forEach(item => {
    totalPrice += (item.price * item.quantity);
    
    const cartItemElement = document.createElement('div');
    cartItemElement.className = 'cart-item flex items-center border-b py-2';
    const imageUrl = item.image ? item.image : 'images/placeholder.png';
    const itemSubtotal = (item.price * item.quantity).toFixed(2);
    
    cartItemElement.innerHTML = `
      <img src="${imageUrl}" alt="${item.name}" class="w-16 h-16 object-cover rounded">
      <div class="ml-4 flex-grow">
        <h4 class="font-medium">${item.name}</h4>
        <p class="text-gray-600 text-sm">$${item.price.toFixed(2)} / ${item.unit}</p>
      </div>
      <div class="flex flex-col items-end mr-4">
        <div class="flex items-center mb-1">
          <button class="decrement-quantity px-2 py-1 bg-gray-200 rounded-l hover:bg-gray-300" data-id="${item.id}">-</button>
          <span class="quantity-display px-3 py-1 bg-gray-100">${item.quantity}</span>
          <button class="increment-quantity px-2 py-1 bg-gray-200 rounded-r hover:bg-gray-300" data-id="${item.id}">+</button>
        </div>
        <div class="text-sm font-medium">Subtotal: $${itemSubtotal}</div>
      </div>
      <button class="remove-item ml-2 text-red-500 hover:text-red-700" data-id="${item.id}">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    `;
    
    const decrementBtn = cartItemElement.querySelector('.decrement-quantity');
    const incrementBtn = cartItemElement.querySelector('.increment-quantity');
    const removeBtn = cartItemElement.querySelector('.remove-item');
    
    decrementBtn.addEventListener('click', () => {
      updateCartItemQuantity(item.id, item.quantity - 1);
    });
    
    incrementBtn.addEventListener('click', () => {
       updateCartItemQuantity(item.id, item.quantity + 1);
    });
    
    removeBtn.addEventListener('click', () => {
      removeCartItem(item.id);
    });
    
    cartItemsContainer.appendChild(cartItemElement);
  });
  
  cartTotalElement.textContent = `$${totalPrice.toFixed(2)}`;
}

// Update cart item quantity - Modified to be async and check DB stock
async function updateCartItemQuantity(id, newQuantity) {
  if (newQuantity <= 0) {
    removeCartItem(id);
    return;
  }
  
  const cartItem = cart.find(item => item.id === id);
  if (!cartItem) return;

  if (!supabase) return;
  const product = await fetchProductById(id); // Fetch latest product data

  if (!product) {
      alert("Could not verify product availability.");
      return;
  }

  if (newQuantity > product.quantity) {
    alert(`Sorry, only ${product.quantity} unit(s) of ${product.name} available.`);
    // Optionally reset cart item quantity to max available if desired
    // cartItem.quantity = product.quantity;
    // updateCartUI(); 
    return; // Prevent update
  }

  // Update cart in memory/localStorage
  cartItem.quantity = newQuantity;
  saveCart();
  updateCartUI();
}

// Remove item from cart - Mostly unchanged, updates based on localStorage cart
function removeCartItem(id) {
  const removedItem = cart.find(item => item.id === id);
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartUI(); // This recalculates total based on the modified cart
  
  if (removedItem) {
    showNotification(`Removed ${removedItem.name} from cart`);
  }
}

// Update cart count (Unchanged)
function updateCartCount() {
  const cartCount = document.getElementById('cart-count');
  if (!cartCount) return;
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = count;
  cartCount.classList.toggle('hidden', count === 0);
}

// Clear cart - Unchanged (clears localStorage cart)
function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
  showNotification('Cart cleared');
  const cartTotalElement = document.getElementById('cart-total');
  if (cartTotalElement) {
    cartTotalElement.textContent = '$0.00';
  }
}

// Save cart to localStorage (Unchanged)
function saveCart() {
  localStorage.setItem(storageKey, JSON.stringify(cart));
}

// Load cart from localStorage (Unchanged)
function loadCart() {
  const savedCart = localStorage.getItem(storageKey);
  if (savedCart) {
    cart = JSON.parse(savedCart);
  } else {
    cart = [];
  }
}

// Toggle cart visibility
function toggleCart() {
  const cartContainer = document.getElementById('cart-container');
  if (cartContainer) {
    cartContainer.classList.toggle('hidden');
  }
}

// Fetch a single product by ID from Supabase
async function fetchProductById(productId) {
  if (!supabase) return null;
  // Check cache first
  const cachedProduct = allProducts.find(p => p.id === productId);
  if (cachedProduct) {
    // Optionally re-fetch to ensure freshness, especially for quantity/stock status
    // Or rely on cache for performance, depends on requirements
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, unit, quantity, inStock, image') // Select specific fields needed
      .eq('id', productId)
      .single(); // Expecting only one result
    
    if (error && error.code !== 'PGRST116') { // Ignore "No rows found" error for now
      console.error(`Error fetching product ${productId}:`, error);
      return null;
    }
    return data || cachedProduct; // Return fresh data if available, otherwise cached
  }

  // If not in cache, fetch from DB
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, unit, quantity, inStock, image')
    .eq('id', productId)
    .single();

  if (error) {
    console.error(`Error fetching product ${productId}:`, error);
    return null;
  }
  return data;
}

// DOM loaded event - Modified to be async
document.addEventListener('DOMContentLoaded', async function() {
  if (!supabase) return; // Don't proceed if Supabase failed to init

  loadCart(); // Load cart from localStorage (cart itself is fine in localStorage)
  
  // Fetch products initially
  const products = await fetchAllProducts();
  if (products.length > 0) {
    await initializeCategories();
    initializeSearch(products); 
    renderProducts(products);
  } else {
    // Handle case where no products are loaded (e.g., display message)
    const productsContainer = document.getElementById('products-container');
    if(productsContainer) productsContainer.innerHTML = '<p class="text-center py-4 text-red-500">Could not load products from the database.</p>';
  }
  
  updateCartUI(); // Update cart based on localStorage
  
  // Add event listener for delivery form if it exists
  const deliveryForm = document.getElementById('delivery-form');
  if (deliveryForm) {
    deliveryForm.addEventListener('submit', submitOrder);
    
    // Add form validation for enabling/disabling submit button
    setupFormValidation();
  }

  // Add event listener for place order button if it exists
  const placeOrderBtn = document.getElementById('place-order-btn');
  if (placeOrderBtn) {
      placeOrderBtn.addEventListener('click', placeOrder);
  }

  // Add event listener for clear cart button if it exists
  const clearCartBtn = document.getElementById('clear-cart-btn');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', clearCart);
  }
  
  // Display confirmation details if on confirmation page
  if (window.location.pathname.includes('confirmation.html')) {
      displayOrderConfirmation();
  }
});

// Setup form validation to enable/disable submit button
function setupFormValidation() {
  const form = document.getElementById('delivery-form');
  if (!form) return;
  
  const submitBtn = document.getElementById('submit-order-btn');
  if (!submitBtn) return;
  
  // Required field IDs
  const requiredFields = ['name', 'address', 'city', 'mobile', 'email'];
  const stateSelect = form.querySelector('#state');
  
  // Function to check if all fields are filled correctly and enable/disable button
  function checkFormFields() {
    let allValid = true;
    
    // Check all text inputs
    requiredFields.forEach(fieldId => {
      const field = form.querySelector(`#${fieldId}`);
      if (field && (!field.value.trim() || (field.pattern && !new RegExp(field.pattern).test(field.value.trim())))) {
        allValid = false;
      }
    });
    
    // Check select
    if (stateSelect && stateSelect.value === "") {
      allValid = false;
    }
    
    // Enable/disable button based on validation
    if (allValid) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('bg-gray-400', 'hover:bg-gray-500');
      submitBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
    } else {
      submitBtn.disabled = true;
      submitBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
      submitBtn.classList.add('bg-gray-400', 'hover:bg-gray-500');
    }
  }
  
  // Add input event listeners to all required fields
  requiredFields.forEach(fieldId => {
    const field = form.querySelector(`#${fieldId}`);
    if (field) {
      field.addEventListener('input', checkFormFields);
    }
  });
  
  // Add change listener to select
  if (stateSelect) {
    stateSelect.addEventListener('change', checkFormFields);
  }
  
  // Initial check
  checkFormFields();
}

// Validate delivery form 
function validateDeliveryForm() {
    const form = document.getElementById('delivery-form');
    if (!form) return false;

    let isValid = true;
    const fields = [
        { id: 'name', message: 'Name is required' },
        { id: 'address', message: 'Address is required' },
        { id: 'city', message: 'City is required' },
        { id: 'postcode', message: 'Postcode is required', pattern: /^\d{4}$/, patternMessage: 'Postcode must be 4 digits' },
        { id: 'email', message: 'Email is required', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMessage: 'Invalid email format' },
        { id: 'mobile', message: 'Mobile number is required', pattern: /^04\d{8}$/, patternMessage: 'Mobile number must start with 04 followed by 8 digits' }
    ];

    fields.forEach(field => {
        const input = form.querySelector(`#${field.id}`);
        if (!input) return;
        
        hideInputError(input);
        let fieldValid = true;

        if (!input.value.trim()) {
            showInputError(input, field.message);
            isValid = false;
            fieldValid = false;
        } else if (field.pattern && !field.pattern.test(input.value.trim())) {
             showInputError(input, field.patternMessage);
             isValid = false;
             fieldValid = false;
        }
        
        // Add validation styling
        if(fieldValid) {
            input.classList.remove('border-red-500');
            input.classList.add('border-green-500');
        } else {
            input.classList.add('border-red-500');
            input.classList.remove('border-green-500');
        }
    });

    return isValid;
}

// Show input error 
function showInputError(input, message) {
  const errorElement = input.nextElementSibling;
  if (errorElement && errorElement.classList.contains('error-message')) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
  }
}

// Hide input error 
function hideInputError(input) {
  const errorElement = input.nextElementSibling;
  if (errorElement && errorElement.classList.contains('error-message')) {
    errorElement.textContent = '';
    errorElement.classList.add('hidden');
  }
}

// Check items availability against Supabase - Modified to be async
async function checkItemsAvailability() {
  if (!supabase) return { allAvailable: false, unavailableItems: [] };
  
  let allAvailable = true;
  const unavailableItems = [];
  
  // Use Promise.all to fetch all product details concurrently
  const productChecks = cart.map(async (cartItem) => {
    const product = await fetchProductById(cartItem.id);
    if (!product || !product.inStock) {
      return { available: false, name: cartItem.name, reason: 'Item is no longer in stock' };
    } else if (product.quantity < cartItem.quantity) {
      return { available: false, name: cartItem.name, reason: `Only ${product.quantity} unit(s) available (you requested ${cartItem.quantity})` };
    } else {
      return { available: true };
    }
  });

  const results = await Promise.all(productChecks);

  results.forEach(result => {
    if (!result.available) {
      allAvailable = false;
      unavailableItems.push({ name: result.name, reason: result.reason });
    }
  });
  
  return { allAvailable, unavailableItems };
}

// Place order - Navigates to delivery page 
function placeOrder() {
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  // Potentially add a quick availability check here if desired, though full check happens on submit
  window.location.href = 'delivery.html';
}

// Submit order - Modified to be async and update Supabase
async function submitOrder(event) {
  event.preventDefault();
  if (!supabase) return;
  
  const submitButton = event.target.querySelector('button[type="submit"]');
  // Set to processing state but maintain blue color
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="inline-flex items-center"><svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</span>';

  if (cart.length === 0) {
    alert('Your cart is empty!');
    submitButton.disabled = false;
    submitButton.innerHTML = 'Submit Order';
    return;
  }
  
  if (!validateDeliveryForm()) {
    // Re-enable the button but keep styling consistent
    submitButton.disabled = false;
    submitButton.innerHTML = 'Submit Order';
    return;
  }
  
  // Check items availability again before processing
  const availability = await checkItemsAvailability();
  if (!availability.allAvailable) {
    const message = ['Some items in your cart are no longer available or have insufficient stock:'];
    availability.unavailableItems.forEach(item => {
      message.push(`\n• ${item.name}: ${item.reason}`);
    });
    message.push('\n\nYou will be redirected to your cart to update your order.');
    
    alert(message.join(''));
    submitButton.disabled = false;
    submitButton.innerHTML = 'Submit Order';
    window.location.href = 'cart.html';
    return;
  }
  
  // --- Update Quantities in Supabase --- 
  // This part needs careful handling (transactions ideally, but simpler for now)
  let updateErrors = [];
  const updatePromises = cart.map(async (cartItem) => {
      const product = await fetchProductById(cartItem.id); // Get latest quantity again
      if (product && product.inStock && product.quantity >= cartItem.quantity) {
          const newQuantity = product.quantity - cartItem.quantity;
          const newStockStatus = newQuantity > 0;
          
          const { error } = await supabase
              .from('products')
              .update({ quantity: newQuantity, inStock: newStockStatus })
              .eq('id', cartItem.id);
              
          if (error) {
              console.error(`Error updating product ${cartItem.id}:`, error);
              updateErrors.push(cartItem.name);
              return false; // Indicate failure for this item
          }
          return true; // Indicate success for this item
      } else {
          // Item became unavailable between check and update attempt
          updateErrors.push(cartItem.name); 
          return false;
      }
  });

  const updateResults = await Promise.all(updatePromises);
  
  // Check if any updates failed
  if (updateErrors.length > 0) {
      //alert(`Failed to update stock for the following items: ${updateErrors.join(', ')}. Please review your cart and try again.`);
      // IMPORTANT: In a real app, you might need to revert successful updates here (rollback/transaction)
      submitButton.disabled = false;
      submitButton.innerHTML = 'Submit Order';
      window.location.href = 'cart.html'; // Redirect to cart
      return;
  }
  
  // If all updates succeeded:
  // Save cart items for confirmation page before clearing
  const orderDetails = {
    items: JSON.parse(JSON.stringify(cart)), // Deep copy to ensure data isn't affected by later operations
    total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    date: new Date().toISOString()
  };
  localStorage.setItem('lastOrder', JSON.stringify(orderDetails));
  console.log("Saved order details:", orderDetails); // Debug log
  
  // Get email before clearing any data
  const form = document.getElementById('delivery-form');
  const email = form.querySelector('#email').value;
  
  // Clear cart (from localStorage)
  clearCart(); 
  
  // Redirect to confirmation page
  window.location.href = `confirmation.html?email=${encodeURIComponent(email)}`;
  
  // No need to re-enable button as we are navigating away
}

// Display order confirmation
function displayOrderConfirmation() {
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  const emailElement = document.getElementById('confirmation-email');
  if (emailElement && email) {
    emailElement.textContent = email;
  }
  
  // Display order details
  const orderContainer = document.getElementById('order-details');
  if (!orderContainer) return;
  
  const orderData = localStorage.getItem('lastOrder');
  console.log("Retrieved order data:", orderData); // Debug log
  
  if (!orderData) {
    orderContainer.innerHTML = '<p class="text-gray-600">No order details available.</p>';
    return;
  }
  
  try {
    const order = JSON.parse(orderData);
    console.log("Parsed order:", order); // Debug log
    
    if (!order.items || order.items.length === 0) {
      orderContainer.innerHTML = '<p class="text-gray-600">No items in this order.</p>';
      return;
    }
    
    // Create order items list
    const orderItemsHtml = order.items.map(item => `
      <div class="flex items-center border-b py-2">
        <img src="${item.image || 'images/placeholder.png'}" alt="${item.name}" class="w-16 h-16 object-cover rounded">
        <div class="ml-4 flex-grow">
          <h4 class="font-medium">${item.name}</h4>
          <p class="text-gray-600">$${item.price.toFixed(2)} / ${item.unit}</p>
        </div>
        <div class="text-right">
          <div class="font-medium">${item.quantity} × $${item.price.toFixed(2)}</div>
          <div class="text-gray-600">$${(item.price * item.quantity).toFixed(2)}</div>
        </div>
      </div>
    `).join('');
    
    // Add order total
    orderContainer.innerHTML = `
      <h2 class="text-lg font-semibold mb-3">Order Items</h2>
      <div class="mb-4">
        ${orderItemsHtml}
      </div>
      <div class="flex justify-between font-bold text-lg border-t pt-3">
        <span>Total:</span>
        <span>$${order.total.toFixed(2)}</span>
      </div>
    `;
    
  } catch (error) {
    console.error('Error displaying order details:', error);
    orderContainer.innerHTML = '<p class="text-gray-600">Error displaying order details.</p>';
  }
}

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-12 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg transition-opacity duration-500 z-50';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(notification)) {
          document.body.removeChild(notification);
      }
    }, 500);
  }, 3000);
}
