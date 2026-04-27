window.onload = async function () {
  await checkHealth();
  await loadOrders();
  await loadImages();
};

async function checkHealth() {
  const res = await fetch('/api/health');
  const data = await res.json();
  document.getElementById('instance').innerText =
    "Served by: " + data.instance;
}

async function placeOrder() {
  const item = document.getElementById('item').value;

  if (!item || !item.trim()) {
    alert("Please enter a food item");
    return;
  }

  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ item: item.trim() })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || data.message || 'Failed to place order');
      return;
    }

    alert(data.message || 'Order placed!');
    document.getElementById('item').value = '';
    await loadOrders();
  } catch (err) {
    alert('Failed to place order: network error');
  }
}

async function upload() {
  const fileInput = document.getElementById('file');
  const file = fileInput.files[0];

  if (!file) {
    alert("Select a file first");
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || data.message || 'Failed to upload file');
      return;
    }

    alert(data.url ? 'Uploaded: ' + data.url : (data.message || 'Upload completed'));
    fileInput.value = '';
    await loadImages();
  } catch (err) {
    alert('Failed to upload file: network error');
  }
}

async function loadOrders() {
  const statusEl = document.getElementById('orders-status');
  const container = document.getElementById('orders');

  statusEl.innerText = 'Fetching latest orders...';
  container.innerHTML = '';

  try {
    const res = await fetch('/api/orders');
    const data = await res.json();

    if (!res.ok) {
      const detail = data.details ? ` (${data.details})` : '';
      statusEl.innerText = `${data.error || 'Unable to load orders.'}${detail}`;
      return;
    }

    if (!Array.isArray(data)) {
      statusEl.innerText = data.message || 'Orders are not available right now.';
      return;
    }

    if (data.length === 0) {
      statusEl.innerText = 'No orders yet.';
      container.innerHTML = '<div class="order-empty">No orders found. Place your first order above 🍔</div>';
      return;
    }

    statusEl.innerText = `Showing ${data.length} order${data.length > 1 ? 's' : ''}`;

    container.innerHTML = data
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map((order) => {
        const createdAt = order.createdAt
          ? new Date(order.createdAt).toLocaleString()
          : 'Unknown time';

        return `
          <div class="order-item">
            <div class="order-title">${escapeHtml(order.item || 'Untitled order')}</div>
            <div class="order-meta">Order ID: ${escapeHtml(order.id || 'N/A')}</div>
            <div class="order-meta">Placed: ${escapeHtml(createdAt)}</div>
          </div>
        `;
      })
      .join('');
  } catch (err) {
    statusEl.innerText = 'Error while loading orders.';
    container.innerHTML = '<div class="order-empty">Could not fetch orders right now.</div>';
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function loadImages() {
  const statusEl = document.getElementById('images-status');
  const container = document.getElementById('images');

  statusEl.innerText = 'Fetching uploaded images...';
  container.innerHTML = '';

  try {
    const res = await fetch('/api/images');
    const data = await res.json();

    if (!res.ok) {
      statusEl.innerText = 'Unable to load images.';
      container.innerHTML = '<div class="order-empty">Could not fetch images right now.</div>';
      return;
    }

    if (!Array.isArray(data)) {
      statusEl.innerText = data.message || 'Images are not available right now.';
      container.innerHTML = '<div class="order-empty">No image data available.</div>';
      return;
    }

    if (data.length === 0) {
      statusEl.innerText = 'No images uploaded yet.';
      container.innerHTML = '<div class="order-empty">Upload your first image above 📤</div>';
      return;
    }

    statusEl.innerText = `Showing ${data.length} image${data.length > 1 ? 's' : ''}`;

    container.innerHTML = data.map((image) => {
      const dateText = image.lastModified
        ? new Date(image.lastModified).toLocaleString()
        : 'Unknown date';
      const sizeKb = typeof image.size === 'number'
        ? `${Math.max(1, Math.round(image.size / 1024))} KB`
        : 'Unknown size';

      return `
        <div class="image-card">
          <a href="${escapeHtml(image.url || '#')}" target="_blank" rel="noopener noreferrer">
            <img src="${escapeHtml(image.url || '')}" alt="${escapeHtml(image.key || 'Uploaded image')}" />
          </a>
          <div class="image-card-body">
            <div class="image-name" title="${escapeHtml(image.key || '')}">${escapeHtml(image.key || 'Unnamed image')}</div>
            <div class="image-meta">${escapeHtml(sizeKb)} • ${escapeHtml(dateText)}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    statusEl.innerText = 'Error while loading images.';
    container.innerHTML = '<div class="order-empty">Could not fetch images right now.</div>';
  }
}
