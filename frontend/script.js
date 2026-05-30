const API_BASE_URL = "http://127.0.0.1:8000"; 

// 1. Fetch and Display Expenses
async function fetchExpenses() {
    try {
        const response = await fetch(`${API_BASE_URL}/Show-All`);
        const data = await response.json();
        
        const listContainer = document.getElementById('expenseList');
        listContainer.innerHTML = ""; 

        data.forEach(expense => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td style="color: #4b5563;">${expense.Date}</td>
                <td class="font-medium" style="color: #111827;">${expense.Description}</td>
                <td>
                    <span class="badge">${expense.Category}</span>
                </td>
                <td class="text-right font-semibold" style="color: #111827;">₹${expense.Amount}</td>
                <td class="text-center">
                    <button onclick="deleteExpense(${expense.id})" class="btn-delete">Delete</button>
                </td>
            `;
            listContainer.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching expenses:", error);
    }
}

// 2. Add New Expense
document.getElementById('expenseForm').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const today = new Date().toISOString().split('T')[0]; 

    const payload = {
        Amount: parseInt(amount),
        Date: today,
        Category: category,
        Description: description
    };

    try {
        const response = await fetch(`${API_BASE_URL}/Expense`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            document.getElementById('expenseForm').reset();
            fetchExpenses(); 
            showMessage("Expense added!", "msg-success");
        } else {
            const err = await response.json();
            showMessage(err.detail || "Error adding expense", "msg-error");
        }
    } catch (error) {
        showMessage("Connection error", "msg-error");
    }
});

// 3. Delete Expense
let pendingDeleteId = null;

function deleteExpense(id) {
    pendingDeleteId = id;
    document.getElementById('confirmModal').classList.remove('hidden');
}

function closeDeleteModal() {
    pendingDeleteId = null;
    document.getElementById('confirmModal').classList.add('hidden');
}

async function confirmDelete() {
    if (!pendingDeleteId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/delete/${pendingDeleteId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            fetchExpenses();
            showMessage('Expense deleted successfully', 'msg-success');
        } else {
            showMessage('Failed to delete expense', 'msg-error');
        }
    } catch (error) {
        showMessage('Unable to delete expense', 'msg-error');
        console.error('Error deleting:', error);
    } finally {
        closeDeleteModal();
    }
}

const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');

if (confirmDeleteBtn && cancelDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', confirmDelete);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
}

// Helper function for UI messages
function showMessage(text, typeClass) {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = text;
    msgDiv.className = `message ${typeClass}`;
    
    setTimeout(() => { 
        msgDiv.className = 'message hidden'; 
    }, 3000);
}

// Load expenses when the page opens
window.onload = fetchExpenses;