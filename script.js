const orderForm = document.getElementById('orderForm');
const itemNameInput = document.getElementById('itemName');
const orderIdInput = document.getElementById('orderId');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const orderTableBody = document.querySelector('#orderTable tbody');
const noOrdersMessage = document.getElementById('noOrdersMessage');
const clearAllOrdersBtn = document.getElementById('clearAllOrdersBtn');
const searchInput = document.getElementById('searchInput');
const filterByStatusSelect = document.getElementById('filterByStatus');
const exportDataBtn = document.getElementById('exportDataBtn');
const importFileInput = document.getElementById('importFileInput');
const notificationBar = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');

const summaryPending = document.getElementById('summaryPending');
const summaryProcessing = document.getElementById('summaryProcessing');
const summaryShipped = document.getElementById('summaryShipped');
const summaryDelivered = document.getElementById('summaryDelivered');
const summaryCancelled = document.getElementById('summaryCancelled');

let orders = [];
let isEditMode = false;

const orderTransitions = {
    'PENDING': ['PROCESSING', 'CANCELLED'],
    'PROCESSING': ['SHIPPED', 'CANCELLED'],
    'SHIPPED': ['DELIVERED', 'CANCELLED'],
    'DELIVERED': [],
    'CANCELLED': []
};

let notificationTimeout;

function showNotification(message, type = 'info', duration = 3000) {
    clearTimeout(notificationTimeout);
    notificationMessage.textContent = message;
    notificationBar.className = `notification ${type}`;
    notificationBar.style.display = 'flex';
    notificationBar.style.opacity = '1';
    notificationBar.style.transform = 'translateX(-50%)';

    notificationTimeout = setTimeout(() => {
        hideNotification();
    }, duration);
}

function hideNotification() {
    notificationBar.style.opacity = '0';
    notificationBar.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => {
        notificationBar.style.display = 'none';
    }, 300);
}

function saveOrders() {
    localStorage.setItem('orderTrackerData', JSON.stringify(orders));
}

function loadOrders() {
    const storedOrders = localStorage.getItem('orderTrackerData');
    if (storedOrders) {
        orders = JSON.parse(storedOrders);
    }
}

function saveOrder(event) {
    event.preventDefault();
    const itemName = itemNameInput.value.trim();
    const orderId = orderIdInput.value;

    if (!itemName) {
        showNotification('Nama barang/pesanan tidak boleh kosong!', 'warning');
        return;
    }

    if (isEditMode) {
        const orderToEdit = orders.find(order => order.id === orderId);
        if (orderToEdit) {
            orderToEdit.itemName = itemName;
            saveOrders();
            renderOrders();
            resetForm();
            showNotification('Detail pesanan berhasil diperbarui!', 'success');
        } else {
            showNotification('Pesanan tidak ditemukan untuk diedit.', 'error');
        }
    } else {
        const newOrder = {
            id: 'ORD-' + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 5).toUpperCase(),
            itemName: itemName,
            orderDate: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }),
            status: 'PENDING'
        };
        orders.push(newOrder);
        saveOrders();
        renderOrders();
        orderForm.reset();
        showNotification('Pesanan berhasil ditambahkan!', 'success');
    }
}

function editOrderDetail(orderId) {
    const orderToEdit = orders.find(order => order.id === orderId);
    if (orderToEdit) {
        itemNameInput.value = orderToEdit.itemName;
        orderIdInput.value = orderToEdit.id;
        isEditMode = true;
        submitBtn.textContent = 'Update Pesanan';
        cancelEditBtn.style.display = 'inline-block';
        showNotification(`Mengedit pesanan ${orderToEdit.id}.`, 'info');
    }
}

function resetForm() {
    orderForm.reset();
    orderIdInput.value = '';
    isEditMode = false;
    submitBtn.textContent = 'Tambah Pesanan';
    cancelEditBtn.style.display = 'none';
}

function updateOrderStatus(orderId, newStatus) {
    const orderIndex = orders.findIndex(order => order.id === orderId);

    if (orderIndex === -1) {
        showNotification('Pesanan tidak ditemukan.', 'error');
        return;
    }

    const currentOrder = orders[orderIndex];
    const currentStatus = currentOrder.status;

    if (orderTransitions[currentStatus] && orderTransitions[currentStatus].includes(newStatus)) {
        currentOrder.status = newStatus;
        saveOrders();
        renderOrders();
        showNotification(`Status pesanan ${orderId} diubah menjadi: ${newStatus}`, 'success');
    } else {
        showNotification(`Tidak dapat mengubah status dari '${currentStatus}' ke '${newStatus}'. Transisi tidak diizinkan.`, 'error');
    }
}

function deleteOrder(orderId) {
    if (confirm('Apakah Anda yakin ingin menghapus pesanan ini?')) {
        orders = orders.filter(order => order.id !== orderId);
        saveOrders();
        renderOrders();
        showNotification('Pesanan berhasil dihapus!', 'success');
    }
}

function clearAllOrders() {
    if (confirm('PERINGATAN: Ini akan menghapus SEMUA pesanan. Apakah Anda yakin?')) {
        orders = [];
        saveOrders();
        renderOrders();
        showNotification('Semua pesanan telah dihapus.', 'info');
    }
}

function renderOrders() {
    orderTableBody.innerHTML = '';
    updateDashboardSummary();

    const searchTerm = searchInput.value.toLowerCase();
    const filterStatus = filterByStatusSelect.value;

    let filteredOrders = orders.filter(order => {
        const matchesSearch = order.itemName.toLowerCase().includes(searchTerm) ||
                              order.id.toLowerCase().includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (filteredOrders.length === 0) {
        noOrdersMessage.style.display = 'block';
        orderTable.style.display = 'none';
    } else {
        noOrdersMessage.style.display = 'none';
        orderTable.style.display = 'table';
    }

    filteredOrders.forEach(order => {
        const row = orderTableBody.insertRow();
        row.insertCell(0).textContent = order.id;
        row.insertCell(1).textContent = order.itemName;
        row.insertCell(2).textContent = order.orderDate;

        const statusCell = row.insertCell(3);
        statusCell.innerHTML = `<span class="status-badge ${getStatusClass(order.status)}">${order.status}</span>`;

        const actionCell = row.insertCell(4);

        const editDetailBtn = document.createElement('button');
        editDetailBtn.textContent = 'Edit Detail';
        editDetailBtn.className = 'action-btn edit-detail';
        editDetailBtn.onclick = () => editOrderDetail(order.id);
        actionCell.appendChild(editDetailBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Hapus';
        deleteBtn.className = 'action-btn delete';
        deleteBtn.onclick = () => deleteOrder(order.id);
        actionCell.appendChild(deleteBtn);

        const allowedNextStatuses = orderTransitions[order.status] || [];

        allowedNextStatuses.forEach(nextStatus => {
            const statusActionBtn = document.createElement('button');
            statusActionBtn.textContent = nextStatus;
            statusActionBtn.className = `action-btn ${getStatusClass(nextStatus)}`;
            statusActionBtn.onclick = () => updateOrderStatus(order.id, nextStatus);
            actionCell.appendChild(statusActionBtn);
        });
    });
}

function updateDashboardSummary() {
    const counts = {
        'PENDING': 0,
        'PROCESSING': 0,
        'SHIPPED': 0,
        'DELIVERED': 0,
        'CANCELLED': 0
    };

    orders.forEach(order => {
        if (counts.hasOwnProperty(order.status)) {
            counts[order.status]++;
        }
    });

    summaryPending.textContent = counts['PENDING'];
    summaryProcessing.textContent = counts['PROCESSING'];
    summaryShipped.textContent = counts['SHIPPED'];
    summaryDelivered.textContent = counts['DELIVERED'];
    summaryCancelled.textContent = counts['CANCELLED'];
}

function getStatusClass(status) {
    return status.toLowerCase();
}

function exportData() {
    if (orders.length === 0) {
        showNotification('Tidak ada data untuk diekspor!', 'warning');
        return;
    }
    const dataStr = JSON.stringify(orders, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data_pesanan_fsa.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Data berhasil diekspor!', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData) && importedData.every(item => item.id && item.itemName && item.status)) {
                if (confirm('Apakah Anda ingin menimpa data yang ada dengan data dari file ini? (Pilih Batal untuk menambahkan data baru)')) {
                    orders = importedData;
                    showNotification('Data berhasil diimpor dan menimpa yang lama!', 'success');
                } else {
                    importedData.forEach(newItem => {
                        if (!orders.some(existingOrder => existingOrder.id === newItem.id)) {
                            orders.push(newItem);
                        }
                    });
                    showNotification('Data berhasil ditambahkan dari file!', 'success');
                }
                saveOrders();
                renderOrders();
            } else {
                showNotification('Format file JSON tidak valid. Pastikan berisi array objek pesanan.', 'error');
            }
        } catch (error) {
            showNotification('Gagal membaca file JSON. Pastikan file valid.', 'error');
            console.error('Error importing file:', error);
        }
    };
    reader.onerror = function() {
        showNotification('Gagal membaca file.', 'error');
    };
    reader.readAsText(file);
}

orderForm.addEventListener('submit', saveOrder);
cancelEditBtn.addEventListener('click', resetForm);
clearAllOrdersBtn.addEventListener('click', clearAllOrders);
searchInput.addEventListener('input', renderOrders);
filterByStatusSelect.addEventListener('change', renderOrders);
exportDataBtn.addEventListener('click', exportData);
importFileInput.addEventListener('change', importData);

document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    renderOrders();
});