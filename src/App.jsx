import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Check, ChevronDown, CircleHelp, Download, FileText, LayoutDashboard, LogOut, MoreHorizontal, Pencil, Plus, Search, Settings2, Trash2, TrendingUp, Wallet, X } from 'lucide-react';
import { getTransactions, initDatabase, removeTransaction, saveTransaction } from './database.js';

const categories = ['Income', 'Utility', 'Project', 'Product load', 'Food & dining', 'Transport', 'Shopping', 'Other'];
const today = new Date().toISOString().slice(0, 10);
const monthStart = `${today.slice(0, 7)}-01`;
const currency = (value) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(Number(value || 0));
const prettyDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState('This month');
  const [reportFrom, setReportFrom] = useState(monthStart);
  const [reportTo, setReportTo] = useState(today);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ title: '', category: 'Utility', kind: 'expense', amount: '', date: today, note: '' });

  const refresh = async () => setTransactions(await getTransactions());
  useEffect(() => { initDatabase().then(refresh).catch((error) => setNotice(`Database error: ${error.message}`)).finally(() => setLoading(false)); }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    return transactions.filter((item) => {
      if (period === 'This month' && item.date < start) return false;
      if (period === 'Last 30 days') {
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
        if (item.date < cutoff.toISOString().slice(0, 10)) return false;
      }
      const search = query.trim().toLowerCase();
      return !search || `${item.title} ${item.category} ${item.note}`.toLowerCase().includes(search);
    });
  }, [transactions, period, query]);

  const totals = useMemo(() => filtered.reduce((result, item) => {
    result[item.kind] += Number(item.amount);
    result.count += 1;
    return result;
  }, { income: 0, expense: 0, count: 0 }), [filtered]);
  const balance = totals.income - totals.expense;

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', category: 'Utility', kind: 'expense', amount: '', date: today, note: '' });
    setModalOpen(true);
  };
  const openEdit = (item) => {
    setEditing(item.id);
    setForm({ title: item.title, category: item.category, kind: item.kind, amount: String(item.amount), date: item.date, note: item.note || '' });
    setModalOpen(true);
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || Number(form.amount) <= 0) return;
    await saveTransaction({ ...form, title: form.title.trim(), amount: Number(form.amount), note: form.note.trim(), id: editing });
    await refresh();
    setModalOpen(false);
    setNotice(editing ? 'Transaction updated.' : 'Transaction added.');
    window.setTimeout(() => setNotice(''), 2800);
  };
  const deleteItem = async (item) => {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    await removeTransaction(item.id);
    await refresh();
  };
  const downloadPdf = async () => {
    if (!reportFrom || !reportTo || reportFrom > reportTo) {
      setNotice('Choose a valid date range to export.');
      return;
    }
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const rows = transactions.filter((item) => item.date >= reportFrom && item.date <= reportTo);
    const income = rows.filter((item) => item.kind === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
    const expenses = rows.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('Daily Ledger', 14, 20);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text('Personal expenses report', 14, 27);
    doc.text(`Period: ${prettyDate(reportFrom)} – ${prettyDate(reportTo)}`, 14, 35);
    doc.setFontSize(11); doc.text(`Income: ${currency(income)}     Expenses: ${currency(expenses)}     Net: ${currency(income - expenses)}`, 14, 44);
    autoTable(doc, {
      startY: 52,
      head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
      body: rows.map((item) => [prettyDate(item.date), item.title, item.category, item.kind === 'income' ? 'Income' : 'Expense', `${item.kind === 'income' ? '+' : '-'}${currency(item.amount)}`]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [36, 75, 63] },
      alternateRowStyles: { fillColor: [247, 248, 246] },
      didDrawPage: () => { doc.setFontSize(8); doc.setTextColor(130); doc.text('Generated with Daily Ledger', 14, 287); },
    });
    doc.save(`daily-ledger-${reportFrom}-to-${reportTo}.pdf`);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Wallet size={19} strokeWidth={2.3} /></div><span>daily<span className="brand-light">ledger</span></span></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav><button className="nav-link active"><LayoutDashboard size={17} /> Overview</button><button className="nav-link" onClick={openNew}><Plus size={17} /> Transactions</button></nav>
        <div className="side-bottom"><div className="side-divider" /><button className="nav-link"><Settings2 size={17} /> Settings</button><button className="nav-link"><CircleHelp size={17} /> Help & support</button><div className="profile"><div className="avatar">JD</div><div className="profile-copy"><strong>Jordan Davis</strong><span>Personal account</span></div><MoreHorizontal size={18} className="profile-more" /></div></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div><div className="topbar-right"><span className="today-label"><CalendarDays size={15} /> {new Date().toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</span><button className="avatar top-avatar" aria-label="Account">JD</button></div></header>
        <div className="page-wrap">
          <section className="page-heading"><div><div className="eyebrow">YOUR MONEY, AT A GLANCE</div><h1>Good day, Jordan <span className="wave">✳</span></h1><p>Here’s what’s happening with your finances.</p></div><button className="primary-button" onClick={openNew}><Plus size={17} /> Add transaction</button></section>

          {notice && <div className="notice" role="status"><Check size={16} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></div>}

          <section className="summary-grid">
            <article className="summary-card balance-card"><div className="card-top"><span className="card-label">Total balance</span><span className="card-icon green"><Wallet size={18} /></span></div><div className="card-value">{currency(balance)}</div><div className="card-foot"><span className="balance-dot" /> Net across your accounts</div></article>
            <article className="summary-card"><div className="card-top"><span className="card-label">Total income</span><span className="card-icon mint"><ArrowDownLeft size={18} /></span></div><div className="card-value">{currency(totals.income)}</div><div className="card-foot"><span className="positive-text"><TrendingUp size={13} /> Inflow</span><span>· {period.toLowerCase()}</span></div></article>
            <article className="summary-card"><div className="card-top"><span className="card-label">Total expenses</span><span className="card-icon peach"><ArrowUpRight size={18} /></span></div><div className="card-value">{currency(totals.expense)}</div><div className="card-foot"><span className="muted-text">{totals.count} transactions</span><span>· {period.toLowerCase()}</span></div></article>
          </section>

          <section className="content-card transactions-card">
            <div className="section-heading"><div><h2>Recent transactions</h2><p>Your latest income and expenses in one place.</p></div><div className="heading-controls"><label className="select-wrap"><select value={period} onChange={(event) => setPeriod(event.target.value)}><option>This month</option><option>Last 30 days</option><option>All time</option></select><ChevronDown size={14} /></label><button className="text-button" onClick={openNew}><Plus size={15} /> Add new</button></div></div>
            <div className="table-toolbar"><div className="search-box"><Search size={16} /><input placeholder="Search transactions..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><span className="result-count">{filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}</span></div>
            <div className="table-scroll"><table><thead><tr><th>DESCRIPTION</th><th>CATEGORY</th><th>DATE</th><th>AMOUNT</th><th aria-label="Actions" /></tr></thead><tbody>
              {loading ? <tr><td colSpan="5" className="empty-state">Loading your ledger…</td></tr> : filtered.length === 0 ? <tr><td colSpan="5" className="empty-state"><div className="empty-icon"><FileText size={21} /></div><strong>No transactions yet</strong><span>Add your first income or expense to get started.</span><button className="text-button" onClick={openNew}><Plus size={15} /> Add transaction</button></td></tr> : filtered.map((item) => <tr key={item.id}><td><div className="description-cell"><span className={`transaction-icon ${item.kind}`} >{item.kind === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span><div><strong>{item.title}</strong>{item.note && <span className="transaction-note">{item.note}</span>}</div></div></td><td><span className={`category-pill ${item.category.toLowerCase().replaceAll(' ', '-').replaceAll('&', 'and')}`}>{item.category}</span></td><td className="date-cell">{prettyDate(item.date)}</td><td className={`amount-cell ${item.kind}`}>{item.kind === 'income' ? '+' : '−'}{currency(item.amount)}</td><td><div className="row-actions"><button aria-label={`Edit ${item.title}`} onClick={() => openEdit(item)}><Pencil size={14} /></button><button aria-label={`Delete ${item.title}`} onClick={() => deleteItem(item.id)}><Trash2 size={14} /></button></div></td></tr>)}
            </tbody></table></div>
          </section>

          <section className="report-card"><div className="report-icon"><FileText size={19} /></div><div className="report-copy"><h2>Export a report</h2><p>Download a PDF summary of your transactions for any date range.</p></div><div className="report-controls"><label><span>FROM</span><input type="date" value={reportFrom} max={reportTo || undefined} onChange={(event) => setReportFrom(event.target.value)} /></label><span className="date-dash">—</span><label><span>TO</span><input type="date" value={reportTo} min={reportFrom || undefined} onChange={(event) => setReportTo(event.target.value)} /></label><button className="download-button" onClick={downloadPdf}><Download size={16} /> Download PDF</button></div></section>
          <footer className="footer"><span>Made for mindful money days.</span><span><span className="privacy-dot" /> Your data stays on this device</span></footer>
        </div>
      </main>

      {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><div className="eyebrow">KEEP YOUR LEDGER UP TO DATE</div><h2 id="modal-title">{editing ? 'Edit transaction' : 'Add a transaction'}</h2></div><button className="close-button" onClick={() => setModalOpen(false)} aria-label="Close"><X size={18} /></button></div><form onSubmit={submit}><label className="field-label">Description<input autoFocus required maxLength="80" placeholder="e.g. Electricity bill" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><div className="form-row"><label className="field-label">Type<select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value, category: event.target.value === 'income' ? 'Income' : (form.category === 'Income' ? 'Utility' : form.category) })}><option value="expense">Expense</option><option value="income">Income</option></select></label><label className="field-label">Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.filter((category) => form.kind === 'income' ? category === 'Income' : category !== 'Income').map((category) => <option key={category}>{category}</option>)}</select></label></div><div className="form-row"><label className="field-label">Amount (₦)<input required type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label><label className="field-label">Date<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label></div><label className="field-label">Note <span className="optional">(optional)</span><input maxLength="120" placeholder="Add a little context" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></label><div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setModalOpen(false)}>Cancel</button><button className="primary-button" type="submit"><Check size={16} /> {editing ? 'Save changes' : 'Add transaction'}</button></div></form></section></div>}
    </div>
  );
}

export default App;
