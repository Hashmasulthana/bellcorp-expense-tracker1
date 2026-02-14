import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

function Dashboard() {
  const token = localStorage.getItem("token");

  const [transactions, setTransactions] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [editId, setEditId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const fetchTransactions = async () => {
    const res = await axios.get(
      `http://localhost:5000/transactions?page=1`,
      { headers: { authorization: token } }
    );
    setTransactions(res.data);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSubmit = async () => {
    if (!title || !amount || !category || !date) {
      alert("Please fill required fields");
      return;
    }

    if (editId) {
      await axios.put(
        `http://localhost:5000/transactions/${editId}`,
        { title, amount, category, date, notes },
        { headers: { authorization: token } }
      );
      setEditId(null);
    } else {
      await axios.post(
        `http://localhost:5000/transactions`,
        { title, amount, category, date, notes },
        { headers: { authorization: token } }
      );
    }

    setTitle("");
    setAmount("");
    setCategory("");
    setDate("");
    setNotes("");

    fetchTransactions();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this transaction?")) {
      await axios.delete(
        `http://localhost:5000/transactions/${id}`,
        { headers: { authorization: token } }
      );
      fetchTransactions();
    }
  };

  const handleEdit = (t) => {
    setEditId(t.id);
    setTitle(t.title);
    setAmount(t.amount);
    setCategory(t.category);
    setDate(t.date);
    setNotes(t.notes);
  };

  const totalExpense = transactions.reduce(
    (sum, t) => sum + parseFloat(t.amount),
    0
  );

  const categoryTotals = {};
  transactions.forEach((t) => {
    if (!categoryTotals[t.category]) categoryTotals[t.category] = 0;
    categoryTotals[t.category] += parseFloat(t.amount);
  });

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === "All" || t.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="dashboard-wrapper">
      <div className="header">
        <h2>💰 Expense Tracker</h2>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="summary-section">
        <div className="card total-card">
          <h3>Total Expense</h3>
          <p>₹ {totalExpense}</p>
        </div>

        <div className="card">
          <h3>Category Breakdown</h3>
          {Object.keys(categoryTotals).map((cat) => (
            <p key={cat}>
              {cat} : ₹ {categoryTotals[cat]}
            </p>
          ))}
        </div>
      </div>

      <div className="form-card">
        <h3>{editId ? "Edit Transaction" : "Add Transaction"}</h3>

        <div className="form-grid">
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button className="primary-btn" onClick={handleSubmit}>
          {editId ? "Update" : "Add"}
        </button>
      </div>

      <div className="explorer-section">
        <h3>Transaction Explorer</h3>

        <div className="filter-bar">
          <input
            placeholder="Search title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Food">Food</option>
            <option value="Rent">Rent</option>
            <option value="Transport">Transport</option>
            <option value="Shopping">Shopping</option>
          </select>
        </div>

        {filteredTransactions.length === 0 && (
          <p className="empty-msg">No transactions found</p>
        )}

        {filteredTransactions.map((t) => (
          <div key={t.id} className="transaction-card">
            <div>
              <h4>{t.title}</h4>
              <p>₹ {t.amount}</p>
              <p>{t.category}</p>
              <p>{t.date}</p>
            </div>

            <div className="btn-group">
              <button className="edit-btn" onClick={() => handleEdit(t)}>
                Edit
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDelete(t.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
