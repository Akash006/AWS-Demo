window.onload = checkHealth;

async function checkHealth() {
  const res = await fetch('/api/health');
  const data = await res.json();
  document.getElementById('instance').innerText =
    "Served by: " + data.instance;
}

async function placeOrder() {
  const item = document.getElementById('item').value;

  const res = await fetch('/api/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ item })
  });

  const data = await res.json();
  alert(data.message || "Order placed!");
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
