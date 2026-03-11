import { useState, useEffect, useRef } from "react";

const CATEGORIES = [
  { name: "Food", icon: "🍜", color: "#FF6B6B" },
  { name: "Transport", icon: "🚌", color: "#4ECDC4" },
  { name: "Shopping", icon: "🛍️", color: "#FFE66D" },
  { name: "Health", icon: "💊", color: "#A8E6CF" },
  { name: "Entertainment", icon: "🎬", color: "#C3A6FF" },
  { name: "Bills", icon: "📄", color: "#FFA07A" },
  { name: "Other", icon: "📦", color: "#B0BEC5" },
];

const STORAGE_KEY = "expense_tracker_data";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getCategoryMeta(name) {
  return CATEGORIES.find((c) => c.name === name) || CATEGORIES[CATEGORIES.length - 1];
}

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });

  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const titleRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    if (showForm && titleRef.current) titleRef.current.focus();
  }, [showForm]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
  }

  function handleSubmit() {
    if (!form.title.trim()) return showToast("Please enter a title", "error");
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      return showToast("Enter a valid amount", "error");

    const entry = {
      id: editId || generateId(),
      title: form.title.trim(),
      amount: parseFloat(form.amount),
      category: form.category,
      date: form.date,
      note: form.note.trim(),
    };

    if (editId) {
      setExpenses((prev) => prev.map((e) => (e.id === editId ? entry : e)));
      showToast("Expense updated!");
    } else {
      setExpenses((prev) => [entry, ...prev]);
      showToast("Expense added!");
    }

    setForm({ title: "", amount: "", category: "Food", date: new Date().toISOString().split("T")[0], note: "" });
    setEditId(null);
    setShowForm(false);
  }

  function handleEdit(expense) {
    setForm({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      note: expense.note || "",
    });
    setEditId(expense.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setDeleteConfirm(null);
    showToast("Expense deleted", "error");
  }

  function cancelForm() {
    setForm({ title: "", amount: "", category: "Food", date: new Date().toISOString().split("T")[0], note: "" });
    setEditId(null);
    setShowForm(false);
  }

  const filtered = expenses
    .filter((e) => filter === "All" || e.category === filter)
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.date) - new Date(a.date);
      if (sortBy === "amount") return b.amount - a.amount;
      return a.title.localeCompare(b.title);
    });

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const thisMonth = expenses
    .filter((e) => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + e.amount, 0);

  const categoryTotals = CATEGORIES.map((cat) => ({
    ...cat,
    total: expenses.filter((e) => e.category === cat.name).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  const maxCatTotal = Math.max(...categoryTotals.map((c) => c.total), 1);

  return (
    <div style={styles.app}>
      {/* Background */}
      <div style={styles.bgMesh} />

      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, background: toast.type === "error" ? "#FF6B6B" : "#4ECDC4" }}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalIcon}>🗑️</div>
            <h3 style={styles.modalTitle}>Delete this expense?</h3>
            <p style={styles.modalSub}>This action cannot be undone.</p>
            <div style={styles.modalBtns}>
              <button style={styles.btnCancel} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button style={styles.btnDelete} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.logo}>💸 SpendWise</h1>
            <p style={styles.tagline}>Track every rupee, master your money</p>
          </div>
          <button style={styles.addBtn} onClick={() => { cancelForm(); setShowForm(true); }}>
            + Add Expense
          </button>
        </header>

        {/* Stats Row */}
        <div style={styles.statsRow}>
          <div style={{ ...styles.statCard, borderLeft: "4px solid #FF6B6B" }}>
            <span style={styles.statLabel}>Total Spent</span>
            <span style={styles.statValue}>{formatCurrency(total)}</span>
          </div>
          <div style={{ ...styles.statCard, borderLeft: "4px solid #4ECDC4" }}>
            <span style={styles.statLabel}>This Month</span>
            <span style={styles.statValue}>{formatCurrency(thisMonth)}</span>
          </div>
          <div style={{ ...styles.statCard, borderLeft: "4px solid #FFE66D" }}>
            <span style={styles.statLabel}>Transactions</span>
            <span style={styles.statValue}>{expenses.length}</span>
          </div>
          <div style={{ ...styles.statCard, borderLeft: "4px solid #C3A6FF" }}>
            <span style={styles.statLabel}>Categories</span>
            <span style={styles.statValue}>{categoryTotals.length}</span>
          </div>
        </div>

        {/* Form Panel */}
        {showForm && (
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>{editId ? "✏️ Edit Expense" : "➕ New Expense"}</h2>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title *</label>
                <input
                  ref={titleRef}
                  style={styles.input}
                  placeholder="e.g. Lunch at Haldirams"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Amount (₹) *</label>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  style={styles.input}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date</label>
                <input
                  style={styles.input}
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Note (optional)</label>
                <input
                  style={styles.input}
                  placeholder="Any extra details..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>
            </div>
            <div style={styles.formActions}>
              <button style={styles.btnSecondary} onClick={cancelForm}>Cancel</button>
              <button style={styles.btnPrimary} onClick={handleSubmit}>
                {editId ? "Update Expense" : "Add Expense"}
              </button>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {categoryTotals.length > 0 && (
          <div style={styles.breakdownCard}>
            <h2 style={styles.sectionTitle}>📊 Spending Breakdown</h2>
            <div style={styles.barList}>
              {categoryTotals.map((cat) => (
                <div key={cat.name} style={styles.barRow}>
                  <span style={styles.barLabel}>{cat.icon} {cat.name}</span>
                  <div style={styles.barTrack}>
                    <div
                      style={{
                        ...styles.barFill,
                        width: `${(cat.total / maxCatTotal) * 100}%`,
                        background: cat.color,
                      }}
                    />
                  </div>
                  <span style={styles.barAmount}>{formatCurrency(cat.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions */}
        <div style={styles.listCard}>
          <div style={styles.listHeader}>
            <h2 style={styles.sectionTitle}>🧾 Transactions</h2>
            <div style={styles.controls}>
              <select style={styles.controlSelect} value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
              </select>
              <select style={styles.controlSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date">Sort: Date</option>
                <option value="amount">Sort: Amount</option>
                <option value="title">Sort: Name</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>💰</div>
              <p style={styles.emptyText}>No expenses yet.</p>
              <p style={styles.emptySubText}>Click "Add Expense" to get started!</p>
            </div>
          ) : (
            <div style={styles.expenseList}>
              {filtered.map((expense, i) => {
                const cat = getCategoryMeta(expense.category);
                return (
                  <div key={expense.id} style={{ ...styles.expenseItem, animationDelay: `${i * 0.04}s` }}>
                    <div style={{ ...styles.catDot, background: cat.color }}>{cat.icon}</div>
                    <div style={styles.expenseInfo}>
                      <span style={styles.expenseTitle}>{expense.title}</span>
                      <span style={styles.expenseMeta}>
                        {expense.category} · {formatDate(expense.date)}
                        {expense.note && ` · ${expense.note}`}
                      </span>
                    </div>
                    <span style={{ ...styles.expenseAmount, color: cat.color }}>
                      {formatCurrency(expense.amount)}
                    </span>
                    <div style={styles.expenseActions}>
                      <button style={styles.iconBtn} title="Edit" onClick={() => handleEdit(expense)}>✏️</button>
                      <button style={styles.iconBtn} title="Delete" onClick={() => setDeleteConfirm(expense.id)}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {expenses.length > 0 && (
          <div style={styles.clearRow}>
            <button style={styles.clearBtn} onClick={() => setDeleteConfirm("ALL")}>
              Clear All Expenses
            </button>
          </div>
        )}

        {/* Handle clear all */}
        {deleteConfirm === "ALL" && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <div style={styles.modalIcon}>⚠️</div>
              <h3 style={styles.modalTitle}>Clear all expenses?</h3>
              <p style={styles.modalSub}>This will permanently delete all {expenses.length} transactions.</p>
              <div style={styles.modalBtns}>
                <button style={styles.btnCancel} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button style={styles.btnDelete} onClick={() => { setExpenses([]); setDeleteConfirm(null); showToast("All cleared", "error"); }}>Clear All</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#0f1117",
    color: "#e8e8e8",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    position: "relative",
    overflowX: "hidden",
  },
  bgMesh: {
    position: "fixed",
    inset: 0,
    background: "radial-gradient(ellipse at 20% 20%, rgba(78,205,196,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(195,166,255,0.08) 0%, transparent 50%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  container: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "24px 16px 60px",
    position: "relative",
    zIndex: 1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 28,
    flexWrap: "wrap",
    gap: 12,
  },
  logo: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: "-0.5px",
    color: "#fff",
  },
  tagline: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "#888",
  },
  addBtn: {
    background: "linear-gradient(135deg, #4ECDC4, #45B7AA)",
    color: "#0f1117",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s",
    boxShadow: "0 4px 15px rgba(78,205,196,0.3)",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  statLabel: { fontSize: 12, color: "#888", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" },
  statValue: { fontSize: 22, fontWeight: 800, color: "#fff" },
  formCard: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    border: "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
  },
  formTitle: { margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: "#fff" },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  formGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
    WebkitAppearance: "none",
  },
  formActions: { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 },
  btnPrimary: {
    background: "linear-gradient(135deg, #4ECDC4, #45B7AA)",
    color: "#0f1117",
    border: "none",
    borderRadius: 8,
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.07)",
    color: "#ccc",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 14,
    cursor: "pointer",
  },
  breakdownCard: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    border: "1px solid rgba(255,255,255,0.07)",
  },
  sectionTitle: { margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#fff" },
  barList: { display: "flex", flexDirection: "column", gap: 12 },
  barRow: { display: "flex", alignItems: "center", gap: 12 },
  barLabel: { fontSize: 13, color: "#ccc", width: 120, flexShrink: 0 },
  barTrack: { flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 8, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 99, transition: "width 0.5s ease" },
  barAmount: { fontSize: 13, fontWeight: 700, color: "#fff", width: 80, textAlign: "right", flexShrink: 0 },
  listCard: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 24,
    border: "1px solid rgba(255,255,255,0.07)",
    marginBottom: 16,
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 10,
  },
  controls: { display: "flex", gap: 8 },
  controlSelect: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "7px 12px",
    color: "#ccc",
    fontSize: 13,
    cursor: "pointer",
    outline: "none",
  },
  empty: { textAlign: "center", padding: "40px 20px" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: 600, color: "#888", margin: 0 },
  emptySubText: { fontSize: 13, color: "#555", margin: "6px 0 0" },
  expenseList: { display: "flex", flexDirection: "column", gap: 8 },
  expenseItem: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "12px 16px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.05)",
    transition: "background 0.15s",
    animation: "fadeIn 0.3s ease both",
  },
  catDot: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    flexShrink: 0,
    opacity: 0.9,
  },
  expenseInfo: { flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  expenseTitle: { fontSize: 14, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  expenseMeta: { fontSize: 12, color: "#777", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  expenseAmount: { fontSize: 15, fontWeight: 800, flexShrink: 0 },
  expenseActions: { display: "flex", gap: 4, flexShrink: 0 },
  iconBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    padding: "4px 6px",
    borderRadius: 6,
    opacity: 0.6,
    transition: "opacity 0.15s",
  },
  clearRow: { display: "flex", justifyContent: "center" },
  clearBtn: {
    background: "transparent",
    border: "1px solid rgba(255,107,107,0.3)",
    borderRadius: 8,
    color: "#FF6B6B",
    padding: "8px 20px",
    fontSize: 13,
    cursor: "pointer",
    opacity: 0.7,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "#1a1d27",
    borderRadius: 16,
    padding: "32px 28px",
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.1)",
    width: 300,
  },
  modalIcon: { fontSize: 40, marginBottom: 12 },
  modalTitle: { margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#fff" },
  modalSub: { margin: "0 0 24px", fontSize: 13, color: "#888" },
  modalBtns: { display: "flex", gap: 10 },
  btnCancel: {
    flex: 1,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "#ccc",
    padding: "10px",
    fontSize: 14,
    cursor: "pointer",
  },
  btnDelete: {
    flex: 1,
    background: "linear-gradient(135deg, #FF6B6B, #e05555)",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    padding: "10px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  toast: {
    position: "fixed",
    top: 20,
    right: 20,
    color: "#0f1117",
    fontWeight: 700,
    fontSize: 14,
    padding: "10px 18px",
    borderRadius: 10,
    zIndex: 999,
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    animation: "fadeIn 0.3s ease",
  },
};