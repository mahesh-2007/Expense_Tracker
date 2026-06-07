const API_BASE_URL = "http://127.0.0.1:8000";

function getElement(id) {
    return document.getElementById(id);
}

async function fetchExpenses() {
    const listContainer = getElement('expenseList');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/Show-All`);
        if (!response.ok) {
            throw new Error('Unable to load expenses');
        }

        const expenses = await response.json();
        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="color: #4b5563;">${expense.Date || ''}</td>
                <td class="font-medium" style="color: #111827;">${expense.Description || ''}</td>
                <td><span class="badge">${expense.Category || ''}</span></td>
                <td class="text-right font-semibold" style="color: #111827;">₹${expense.Amount ?? ''}</td>
                <td class="text-center"><button type="button" onclick="deleteExpense(${expense.id})" class="btn-delete">Delete</button></td>
            `;
            listContainer.appendChild(row);
        });
    } catch (error) {
        console.error('fetchExpenses:', error);
        showMessage('Could not load expenses.', 'msg-error');
    }
}

async function submitExpense(event) {
    event.preventDefault();

    const amount = Number(getElement('amount').value);
    const category = getElement('category').value;
    const description = getElement('description').value.trim();
    const today = new Date().toISOString().split('T')[0];

    const payload = {
        Amount: amount,
        Date: today,
        Category: category,
        Description: description,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/Expense`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Unable to add expense');
        }

        getElement('expenseForm').reset();
        fetchExpenses();
        showMessage('Expense added successfully.', 'msg-success');
    } catch (error) {
        console.error('submitExpense:', error);
        showMessage(error.message || 'Unable to add expense', 'msg-error');
    }
}

let pendingDeleteId = null;

function deleteExpense(id) {
    pendingDeleteId = id;
    getElement('confirmModal').classList.remove('hidden');
}

function closeDeleteModal() {
    pendingDeleteId = null;
    getElement('confirmModal').classList.add('hidden');
}

async function confirmDelete() {
    if (!pendingDeleteId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/delete/${pendingDeleteId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Could not delete expense');
        }

        fetchExpenses();
        showMessage('Expense deleted successfully.', 'msg-success');
    } catch (error) {
        console.error('confirmDelete:', error);
        showMessage(error.message || 'Delete failed', 'msg-error');
    } finally {
        closeDeleteModal();
    }
}

function showMessage(text, typeClass) {
    const message = getElement('message');
    if (!message) return;
    message.textContent = text;
    message.className = `message ${typeClass}`;

    setTimeout(() => {
        message.className = 'message hidden';
    }, 3000);
}

function showAddPage() {
    getElement('page-add').classList.remove('hidden');
    getElement('page-view').classList.add('hidden');
    getElement('pageToggle').textContent = 'View Expenses';
}

function showViewPage() {
    getElement('page-add').classList.add('hidden');
    getElement('page-view').classList.remove('hidden');
    getElement('pageToggle').textContent = 'Add Expense';
    fetchExpenses();
}

function togglePage() {
    const addPage = getElement('page-add');
    if (addPage.classList.contains('hidden')) {
        showAddPage();
    } else {
        showViewPage();
    }
}

async function parseAIExpense(event) {
    event.preventDefault();

    const queryValue = getElement('aiQuery').value.trim();
    const aiMessage = getElement('aiMessage');

    if (!queryValue) {
        aiMessage.textContent = 'Please enter a description for the AI parser.';
        aiMessage.className = 'message msg-error';
        return;
    }

    aiMessage.textContent = 'Parsing...';
    aiMessage.className = 'message';

    try {
        const response = await fetch(`${API_BASE_URL}/ai/parse-expense`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: queryValue }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            let detailMsg = data?.detail || 'AI parse failed';
            if (typeof detailMsg !== 'string') {
                detailMsg = JSON.stringify(detailMsg);
            }
            aiMessage.textContent = detailMsg;
            aiMessage.className = 'message msg-error';
            return;
        }

        aiMessage.textContent = data?.message || 'Expense added via AI!';
        aiMessage.className = 'message msg-success';
        getElement('aiForm').reset();
        fetchExpenses();
    } catch (error) {
        console.error('parseAIExpense:', error);
        aiMessage.textContent = error.message || 'Network error';
        aiMessage.className = 'message msg-error';
    }
}

function init() {
    getElement('expenseForm').addEventListener('submit', submitExpense);
    getElement('aiForm').addEventListener('submit', parseAIExpense);
    getElement('pageToggle').addEventListener('click', togglePage);
    getElement('confirmDelete').addEventListener('click', confirmDelete);
    getElement('cancelDelete').addEventListener('click', closeDeleteModal);

    showAddPage();
    fetchExpenses();
}

window.addEventListener('DOMContentLoaded', init);
