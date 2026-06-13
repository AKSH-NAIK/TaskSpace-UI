import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  LogOut,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User,
  X,
  FileText
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // User info
  const [user, setUser] = useState(null);
  
  // Task state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const tasksPerPage = 5;

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // New Task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  
  // Edit Task form state
  const [editingTaskId, setEditingTaskId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('task_manager_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // Fallback
      fetchCurrentUser();
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('task_manager_user', JSON.stringify(response.data.user));
      }
    } catch (err) {
      // Token might be invalid
      handleLogout();
    }
  };

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/tasks', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          page: currentPage,
          limit: tasksPerPage,
        },
      });

      if (response.data.success) {
        setTasks(response.data.tasks);
        setTotalPages(response.data.totalPages || 1);
        setTotalTasks(response.data.totalTasks || 0);
      }
    } catch (err) {
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, currentPage]);

  // Trigger tasks fetch when filters or page changes
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('task_manager_token');
    localStorage.removeItem('task_manager_user');
    navigate('/login');
  };

  // Toggle Task Status (pending -> completed, completed -> pending)
  const handleToggleStatus = async (id) => {
    try {
      const response = await api.patch(`/tasks/${id}/toggle`);
      if (response.data.success) {
        // Optimistically update or refetch
        setTasks(tasks.map(t => t._id === id ? response.data.task : t));
        showSuccessAlert('Task status updated successfully!');
      }
    } catch (err) {
      showErrorAlert('Failed to update task status.');
    }
  };

  // Delete Task
  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const response = await api.delete(`/tasks/${id}`);
      if (response.data.success) {
        showSuccessAlert('Task deleted successfully!');
        // If we deleted the last task on current page, go back a page
        if (tasks.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchTasks();
        }
      }
    } catch (err) {
      showErrorAlert('Failed to delete task.');
    }
  };

  // Create Task Submission
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!newTitle.trim()) {
      setCreateError('Title is required.');
      return;
    }

    setCreateLoading(true);
    try {
      const response = await api.post('/tasks', {
        title: newTitle,
        description: newDescription,
      });

      if (response.data.success) {
        setNewTitle('');
        setNewDescription('');
        setShowCreateModal(false);
        showSuccessAlert('Task created successfully!');
        setCurrentPage(1); // Go to first page
        fetchTasks();
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (task) => {
    setEditingTaskId(task._id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditError('');
    setShowEditModal(true);
  };

  // Edit Task Submission
  const handleEditTask = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!editTitle.trim()) {
      setEditError('Title is required.');
      return;
    }

    setEditLoading(true);
    try {
      const response = await api.put(`/tasks/${editingTaskId}`, {
        title: editTitle,
        description: editDescription,
      });

      if (response.data.success) {
        setShowEditModal(false);
        showSuccessAlert('Task updated successfully!');
        fetchTasks();
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update task.');
    } finally {
      setEditLoading(false);
    }
  };

  // Alerts helpers
  const showSuccessAlert = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const showErrorAlert = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset page on filter/search change
  };

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset page on filter/search change
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Header Banner */}
      <header className="glass" style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.appIcon}>
            <CheckCircle size={24} color="#A3E635" />
          </div>
          <div>
            <h1 style={styles.appTitle}>TaskSpace</h1>
            <p style={styles.appSubtitle}>Dashboard Panel</p>
          </div>
        </div>

        <div style={styles.headerRight}>
          {user && (
            <div style={styles.userInfo}>
              <div style={styles.avatar}>
                <User size={16} color="#94a3b8" />
              </div>
              <span style={styles.userName}>{user.name}</span>
            </div>
          )}
          <button onClick={handleLogout} className="btn btn-secondary" style={styles.logoutBtn}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Main Board */}
      <main style={styles.mainContent}>
        {/* Alerts */}
        {success && (
          <div className="alert alert-success" style={styles.floatingAlert}>
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={styles.floatingAlert}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Toolbar */}
        <section style={styles.toolbar}>
          <div style={styles.searchWrapper}>
            <Search style={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Search tasks by title..."
              value={search}
              onChange={handleSearchChange}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <div style={styles.selectWrapper}>
              <Filter style={styles.filterIcon} size={16} />
              <select
                value={statusFilter}
                onChange={handleFilterChange}
                style={styles.filterSelect}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
              style={styles.createBtn}
            >
              <Plus size={18} /> Create Task
            </button>
          </div>
        </section>

        {/* Task Grid/List */}
        {loading ? (
          <div style={styles.loaderArea}>
            <span className="spinner"></span>
            <p style={{ color: 'var(--text-secondary)' }}>Loading your tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="glass" style={styles.emptyState}>
            <FileText size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h3>No tasks found</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
              {search || statusFilter
                ? 'Try adjusting your search query or status filter.'
                : 'Click "Create Task" to add your first work item.'}
            </p>
          </div>
        ) : (
          <div style={styles.tasksList}>
            {tasks.map((task) => (
              <div key={task._id} className="glass" style={styles.taskCard}>
                <div style={styles.taskCardBody}>
                  <div style={styles.taskCardLeft}>
                    <button
                      onClick={() => handleToggleStatus(task._id)}
                      style={styles.checkboxBtn}
                      title={task.status === 'completed' ? 'Mark Pending' : 'Mark Completed'}
                    >
                      <div
                        style={{
                          ...styles.checkbox,
                          borderColor: task.status === 'completed' ? 'var(--success)' : 'var(--text-muted)',
                          backgroundColor: task.status === 'completed' ? 'var(--success)' : 'transparent',
                        }}
                      >
                        {task.status === 'completed' && (
                          <div style={styles.checkmark} />
                        )}
                      </div>
                    </button>
                    <div>
                      <h3
                        style={{
                          ...styles.taskTitle,
                          textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                          color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                        }}
                      >
                        {task.title}
                      </h3>
                      <p
                        style={{
                          ...styles.taskDesc,
                          color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-secondary)',
                        }}
                      >
                        {task.description || 'No description provided.'}
                      </p>
                      <span style={styles.taskDate}>
                        Created on {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div style={styles.taskCardRight}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: task.status === 'completed' ? 'var(--success-bg)' : 'var(--warning-bg)',
                        color: task.status === 'completed' ? '#a7f3d0' : '#fde68a',
                        border: `1px solid ${task.status === 'completed' ? 'var(--success-border)' : 'var(--warning-border)'}`,
                      }}
                    >
                      {task.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>

                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => openEditModal(task)}
                        style={styles.actionBtn}
                        title="Edit Task"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        style={{ ...styles.actionBtn, color: '#fca5a5' }}
                        title="Delete Task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {!loading && totalPages > 1 && (
          <div style={styles.pagination}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary"
              style={styles.pageBtn}
            >
              <ChevronLeft size={16} /> Prev
            </button>

            <span style={styles.pageInfo}>
              Page {currentPage} of {totalPages} ({totalTasks} tasks)
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary"
              style={styles.pageBtn}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>Create New Task</h2>
              <button onClick={() => setShowCreateModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            {createError && (
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <span>{createError}</span>
              </div>
            )}
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-title">Task Title</label>
                <input
                  id="new-title"
                  type="text"
                  className="form-input"
                  placeholder="Enter task name"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-desc">Description (Optional)</label>
                <textarea
                  id="new-desc"
                  className="form-input"
                  placeholder="Task details and sub-steps..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows="4"
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createLoading}
                >
                  {createLoading ? <span className="spinner" style={styles.btnSpinner}></span> : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {showEditModal && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>Edit Task Details</h2>
              <button onClick={() => setShowEditModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            {editError && (
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <span>{editError}</span>
              </div>
            )}
            <form onSubmit={handleEditTask}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-title">Task Title</label>
                <input
                  id="edit-title"
                  type="text"
                  className="form-input"
                  placeholder="Enter task name"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-desc">Description</label>
                <textarea
                  id="edit-desc"
                  className="form-input"
                  placeholder="Task details and sub-steps..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows="4"
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? <span className="spinner" style={styles.btnSpinner}></span> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  dashboardContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 40px',
    borderBottom: '1px solid var(--border-glass)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  appIcon: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--primary-glow)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(163, 230, 53, 0.2)',
  },
  appTitle: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  appSubtitle: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-glass)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  logoutBtn: {
    padding: '8px 16px',
    fontSize: '0.85rem',
  },
  mainContent: {
    flex: 1,
    padding: '40px',
    maxWidth: '1000px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  floatingAlert: {
    margin: 0,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  searchWrapper: {
    position: 'relative',
    flex: '1 1 300px',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px 12px 48px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'var(--transition)',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  selectWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  filterIcon: {
    position: 'absolute',
    left: '14px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  filterSelect: {
    padding: '12px 32px 12px 38px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    transition: 'var(--transition)',
  },
  createBtn: {
    padding: '12px 20px',
  },
  loaderArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    gap: '16px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 40px',
    borderRadius: 'var(--radius-md)',
    textAlign: 'center',
  },
  tasksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  taskCard: {
    borderRadius: 'var(--radius-md)',
    padding: '20px 24px',
    transition: 'var(--transition)',
  },
  taskCardBody: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  taskCardLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    flex: 1,
    minWidth: '250px',
  },
  checkboxBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    marginTop: '3px',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
  },
  checkmark: {
    width: '6px',
    height: '10px',
    border: 'solid white',
    borderWidth: '0 2px 2px 0',
    transform: 'rotate(45deg) translate(-1px, -1px)',
  },
  taskTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    marginBottom: '6px',
    lineHeight: 1.3,
  },
  taskDesc: {
    fontSize: '0.9rem',
    marginBottom: '10px',
    lineHeight: 1.4,
  },
  taskDate: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  taskCardRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '12px',
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '12px',
    textTransform: 'capitalize',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  actionBtn: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    marginTop: '10px',
  },
  pageBtn: {
    padding: '8px 16px',
    fontSize: '0.875rem',
  },
  pageInfo: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '24px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '500px',
    borderRadius: 'var(--radius-lg)',
    padding: '32px',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '28px',
  },
  btnSpinner: {
    width: '18px',
    height: '18px',
    borderWidth: '2px',
  },
};

export default Dashboard;
