console.log("Content script loaded");

// Function to get all products with their prices
function getAllProducts() {
    const allProducts = [];

    // Collect all product elements across all rows
    document.querySelectorAll('div[id^="collection-page-product-item-"], div[id^="search-page-product-item-"]').forEach(product => {
        // Find the price element within the product
        const priceElement = product.querySelector('.product-info-card .text-base.font-bold');

        // Check if the price element exists and extract the price
        if (priceElement) {
            const priceText = priceElement.innerText;
            // Use a regular expression to remove all non-numeric characters except the dot
            const price = parseFloat(priceText.replace(/[^\d.]/g, ''));

            if (!isNaN(price)) {
                allProducts.push({ element: product, price });
            } else {
                console.error('Invalid price format for product:', product, 'Price text:', priceText);
            }
        } else {
            console.error('Price element not found for product:', product);
        }
    });

    if (allProducts.length === 0) {
        console.error('No products found with the selector "div[id^="collection-page-product-item-"]".');
    } else {
        console.log(`Found ${allProducts.length} products.`);
    }

    return allProducts;
}

// Function to sort and redistribute products
function sortAndRedistributeProducts() {
    // Use an accurate selector based on the provided HTML to find the rows
    const rows = Array.from(document.querySelectorAll('div[id^="productRow-"]'));
    if (rows.length === 0) {
        console.error('No rows found with IDs starting with "productRow-"');
        return;
    }

    // Get all products with their price information
    const productsWithPrices = getAllProducts();

    if (productsWithPrices.length === 0) {
        console.error('No products to sort and redistribute.');
        return;
    }

    // Sort products by price in ascending order
    productsWithPrices.sort((a, b) => a.price - b.price);

    // Extract the product elements from the sorted array
    const sortedProducts = productsWithPrices.map(product => product.element);

    // Compute productsPerRow dynamically by checking the number of product containers in the first row
    const firstRow = rows[0];
    const productContainers = Array.from(firstRow.querySelectorAll('.rounded-\\[10px\\] > .product-listing-tile'));
    const productsPerRow = productContainers.length;  // Dynamically get the number of containers

    if (productsPerRow === 0) {
        console.error('No product containers found in the first row.');
        return;
    }

    console.log(`Detected ${productsPerRow} products per row.`);

    // Clear each row and redistribute products evenly across them
    let productIndex = 0;
    rows.forEach(row => {
        // Find the nested div where the products are located
        const productContainers = Array.from(row.querySelectorAll('.rounded-\\[10px\\] > .product-listing-tile'));

        productContainers.forEach(container => {
            // Remove existing products within the container
            while (container.firstChild) {
                container.removeChild(container.firstChild); // Clear existing children safely
            }
        });

        // Redistribute products into rows
        for (let i = 0; i <=productsPerRow - 1; i++) { // Looping
            if (productIndex < sortedProducts.length) {
                const product = sortedProducts[productIndex];
                const targetContainer = productContainers[i % productContainers.length];

                if (targetContainer) {
                    targetContainer.appendChild(product); // Add product back into the container

                    // Reapply layout classes to ensure formatting is preserved
                    product.classList.add(
                        'rounded-[10px]', 'w-[210px]', 'min-w-[210px]', 'mx-[10px]', 'first:ml-0', 'last:mr-0',
                        'smScreen:w-auto', 'smScreen:min-w-[156px]', 'smScreen:mx-0',
                        'smScreen:min-h-[250px]', 'smScreen:overflow-hidden', 'xsScreen:flex-1'
                    );
                }
                productIndex++;
            }
        }
    });

    console.log('Products sorted and redistributed successfully.');
}


// Listen for messages from the popup extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'sortProducts') {
        console.log('Received sortProducts action');
        sortAndRedistributeProducts();
    }
});

// Optional: Add a DOMContentLoaded listener if needed to ensure the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Content script loaded and ready.');
});

// Reconnect when the page is restored from the bfcache
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        console.log("Page restored from bfcache. Reconnecting extension port...");
        // Re-establish your message connection if needed
        chrome.runtime.connect({ name: "reconnect" });
    }
});

// Handle when the page is moved into the bfcache
window.addEventListener('pagehide', (event) => {
    if (event.persisted) {
        console.log("Page is going into bfcache. Cleaning up connections...");
        // Optionally clean up your message connection if needed
        // For example, you can disconnect or prepare for reconnection
    }
});
chrome.runtime.onConnect.addListener(function(port) {
    console.log("Connected to content script:", port.name);
    port.onMessage.addListener(function(msg) {
        console.log("Received message:", msg);
    });

    port.onDisconnect.addListener(function() {
        console.log("Port disconnected");
    });
});



