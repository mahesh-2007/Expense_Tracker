const API_BASE_URL = "https://expense-tracker-gfm2.onrender.com";

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
        const uniqueExpenses = [];
        const seenExpenseKeys = new Set();

        expenses.forEach(expense => {
            const normalizedDate = expense.Date || '';
            const normalizedDescription = (expense.Description || '').trim().toLowerCase();
            const normalizedCategory = (expense.Category || '').trim();
            const normalizedAmount = Number(expense.Amount || 0);
            const key = `${normalizedDate}::${normalizedDescription}::${normalizedCategory}::${normalizedAmount}`;

            if (seenExpenseKeys.has(key)) return;
            seenExpenseKeys.add(key);
            uniqueExpenses.push(expense);
        });

        const today = new Date().toISOString().split('T')[0];
        const total = uniqueExpenses.reduce((sum, expense) => sum + Number(expense.Amount || 0), 0);
        const todayTotal = uniqueExpenses
            .filter(expense => expense.Date === today)
            .reduce((sum, expense) => sum + Number(expense.Amount || 0), 0);
        const totalRecords = uniqueExpenses.length;
        const highestExpense = uniqueExpenses.reduce((best, expense) => {
            const amount = Number(expense.Amount || 0);
            return amount > Number(best.Amount || 0) ? expense : best;
        }, { Amount: 0, Description: 'No expenses yet' });

        const dateTotals = uniqueExpenses.reduce((acc, expense) => {
            const date = expense.Date || 'Unknown';
            acc[date] = (acc[date] || 0) + Number(expense.Amount || 0);
            return acc;
        }, {});
        const dateEntries = Object.entries(dateTotals);
        const [busiestDate, busiestTotal] = dateEntries.sort(([, a], [, b]) => b - a)[0] || ['—', 0];

        const categoryTotals = uniqueExpenses.reduce((acc, expense) => {
            const category = expense.Category || 'Other';
            acc[category] = (acc[category] || 0) + Number(expense.Amount || 0);
            return acc;
        }, {});
        const categoryEntries = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a);
        const topCategory = categoryEntries[0] || ['No category', 0];

        const totalExpenseEl = getElement('totalExpense');
        const totalRecordsEl = getElement('totalRecords');
        const todayExpenseEl = getElement('todayExpense');
        const todayDateEl = getElement('todayDate');
        const highestExpenseEl = getElement('highestExpense');
        const highestExpenseLabelEl = getElement('highestExpenseLabel');
        const highestDateEl = getElement('highestDate');
        const highestDateTotalEl = getElement('highestDateTotal');
        const categorySummaryEl = getElement('categorySummary');
        const categorySummaryLabelEl = getElement('categorySummaryLabel');

        if (totalExpenseEl) totalExpenseEl.textContent = `₹${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        if (totalRecordsEl) totalRecordsEl.textContent = `${totalRecords} records`;
        if (todayExpenseEl) todayExpenseEl.textContent = `₹${todayTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        if (todayDateEl) todayDateEl.textContent = `Today • ${today}`;
        if (highestExpenseEl) highestExpenseEl.textContent = `₹${Number(highestExpense.Amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        if (highestExpenseLabelEl) highestExpenseLabelEl.textContent = `${highestExpense.Description || 'No description'}`;
        if (highestDateEl) highestDateEl.textContent = busiestDate;
        if (highestDateTotalEl) highestDateTotalEl.textContent = `₹${Number(busiestTotal || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} total`;
        if (categorySummaryEl) categorySummaryEl.textContent = `₹${Number(topCategory[1] || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        if (categorySummaryLabelEl) categorySummaryLabelEl.textContent = topCategory[0] !== 'No category' ? `Top category: ${topCategory[0]}` : 'No categories';

        renderCategoryPieChart('categoryPieChart', 'categoryLegend', categoryEntries);

        uniqueExpenses.forEach(expense => {
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

function renderCategoryPieChart(canvasId, legendId, categoryEntries) {
    const canvas = getElement(canvasId);
    const legend = getElement(legendId);
    if (!canvas || !legend || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 320;

    if (!width || !height) return;

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const radius = Math.min(width, height) * 0.35;
    const centerX = width / 2;
    const centerY = height / 2;
    const colors = ['#4f46e5', '#8b5cf6', '#a855f7', '#f97316', '#10b981', '#22c55e', '#0ea5e9', '#facc15', '#fb7185', '#f43f5e'];
    const total = categoryEntries.reduce((sum, [, amount]) => sum + amount, 0);

    legend.innerHTML = '';

    if (total === 0) {
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        const message = document.createElement('p');
        message.textContent = 'No category data yet.';
        message.className = 'legend-empty';
        legend.appendChild(message);
        return;
    }

    let startAngle = -Math.PI / 2;
    categoryEntries.forEach(([category, amount], index) => {
        const sliceAngle = (amount / total) * Math.PI * 2;
        ctx.fillStyle = colors[index % colors.length];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();

        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <span class="legend-swatch" style="background:${ctx.fillStyle}"></span>
            <span>${category}</span>
            <span class="legend-value">₹${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        `;
        legend.appendChild(item);
        startAngle += sliceAngle;
    });
}

function showMessage(text, typeClass) {
    const message = getElement('globalMessage');
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
        setTimeout(() => {
            aiMessage.className = 'message hidden';
            aiMessage.textContent = '';
        }, 3000);
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
