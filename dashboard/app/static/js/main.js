// Secret Shop Dashboard - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Auto-dismiss alerts after 5 seconds
    setTimeout(() => {
        document.querySelectorAll('.alert-dismissible').forEach(alert => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);

    // Format numbers with commas
    document.querySelectorAll('[data-format-number]').forEach(el => {
        const num = parseInt(el.textContent.replace(/,/g, ''), 10);
        if (!isNaN(num)) {
            el.textContent = num.toLocaleString();
        }
    });

    // Confirm dangerous actions
    document.querySelectorAll('[data-confirm]').forEach(el => {
        el.addEventListener('click', function(e) {
            if (!confirm(this.dataset.confirm)) {
                e.preventDefault();
            }
        });
    });

    // Copy to clipboard
    document.querySelectorAll('[data-copy]').forEach(el => {
        el.addEventListener('click', function() {
            const text = this.dataset.copy;
            navigator.clipboard.writeText(text).then(() => {
                const original = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check"></i> Copied!';
                setTimeout(() => this.innerHTML = original, 2000);
            });
        });
    });

    // Refresh balance periodically
    if (document.getElementById('balance-amount')) {
        setInterval(refreshBalance, 30000);
    }

    // Form validation enhancement
    document.querySelectorAll('form.needs-validation').forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });

    // Toggle password visibility
    document.querySelectorAll('[data-toggle-password]').forEach(btn => {
        btn.addEventListener('click', function() {
            const target = document.querySelector(this.dataset.togglePassword);
            if (target) {
                const type = target.type === 'password' ? 'text' : 'password';
                target.type = type;
                this.innerHTML = type === 'password' ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
            }
        });
    });
});

async function refreshBalance() {
    try {
        const response = await fetch('/api/balance');
        if (response.ok) {
            const data = await response.json();
            const el = document.getElementById('balance-amount');
            if (el && data.balance !== undefined) {
                el.textContent = data.balance.toLocaleString();
            }
        }
    } catch (e) {
        console.error('Failed to refresh balance:', e);
    }
}

// Utility functions
function formatNumber(num) {
    return num.toLocaleString();
}

function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'PTS',
        minimumFractionDigits: 0,
    }).format(num).replace('$', '');
}

function showToast(message, type = 'info') {
    const toastContainer = getOrCreateToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

function getOrCreateToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
    }
    return container;
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
    }
}

// API helpers
async function apiGet(url) {
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
}

async function apiPost(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
}