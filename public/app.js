window.onload = async function () {
  await checkHealth();
  await loadOrders();
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

  const res = await fetch('/api/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ item: item.trim() })
  });

  const data = await res.json();
  alert(data.message || "Order placed!");

  if (res.ok) {
    document.getElementById('item').value = '';
    await loadOrders();
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

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  alert(data.url ? "Uploaded: " + data.url : data.message);
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
      statusEl.innerText = 'Unable to load orders.';
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
