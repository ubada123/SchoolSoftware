import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Shield,
  Mail,
  Calendar,
  UserCheck,
  UserX,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../api/client';

export default function AdminUsers() {
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'admin',
    status: 'active',
    is_superuser: false,
    is_staff: true,
    notes: ''
  });

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const loadAdminUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('admin-users/');
      setAdminUsers(response.data);
    } catch (error) {
      console.error('Failed to load admin users:', error);
      setMessage({ type: 'error', text: 'Failed to load admin users' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      if (editingUser) {
        await api.put(`admin-users/${editingUser.id}/`, form);
        setMessage({ type: 'success', text: 'Admin user updated successfully!' });
      } else {
        await api.post('admin-users/', form);
        setMessage({ type: 'success', text: 'Admin user created successfully!' });
      }
      
      setShowForm(false);
      setEditingUser(null);
      resetForm();
      loadAdminUsers();
    } catch (error) {
      const errorMsg = error?.response?.data ? JSON.stringify(error.response.data) : 'Failed to save admin user';
      setMessage({ type: 'error', text: `Error: ${errorMsg}` });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: '', // Password field will be required for update
      role: user.role,
      status: user.status,
      is_superuser: user.is_superuser,
      is_staff: user.is_staff,
      notes: user.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this admin user? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`admin-users/${userId}/`);
      setMessage({ type: 'success', text: 'Admin user deleted successfully!' });
      loadAdminUsers();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete admin user' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      role: 'admin',
      status: 'active',
      is_superuser: false,
      is_staff: true,
      notes: ''
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    resetForm();
  };

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      staff: 'bg-green-100 text-green-800'
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 mr-3 text-purple-600" />
            Admin Users
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage admin users and their permissions
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          <UserPlus className="h-4 w-4 mr-2" /> Add Admin User
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-xl p-4 ${message.type === 'success' ? 'status-success' : 'status-error'}`}>
          {message.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4">
              {editingUser ? 'Edit Admin User' : 'Add New Admin User'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={(e) => setForm({...form, username: e.target.value})}
                    className="form-input"
                    required
                    disabled={editingUser}
                  />
                </div>
                
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={(e) => setForm({...form, first_name: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={(e) => setForm({...form, last_name: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={(e) => setForm({...form, password: e.target.value})}
                      className="form-input pr-10"
                      required
                      minLength={6}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 6 characters long
                  </p>
                </div>
                
                <div>
                  <label className="form-label">Role</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={(e) => setForm({...form, role: e.target.value})}
                    className="form-input"
                    required
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={(e) => setForm({...form, status: e.target.value})}
                    className="form-input"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_superuser"
                      checked={form.is_superuser}
                      onChange={(e) => setForm({...form, is_superuser: e.target.checked})}
                      className="mr-2"
                    />
                    Super User
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_staff"
                      checked={form.is_staff}
                      onChange={(e) => setForm({...form, is_staff: e.target.checked})}
                      className="mr-2"
                    />
                    Staff
                  </label>
                </div>
              </div>
              
              <div>
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  className="form-input"
                  rows="3"
                  placeholder="Additional notes about this admin user..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  <X className="h-4 w-4 mr-2" /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Users Table */}
      <div className="card">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : adminUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No admin users found
                    </td>
                  </tr>
                ) : (
                  adminUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.username}
                            </div>
                                                   <div className="text-sm text-gray-500 flex items-center">
                         <Mail className="h-3 w-3 mr-1" />
                         {user.email}
                       </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                          {user.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(user.status)}`}>
                          {user.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          {user.is_superuser && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              <Shield className="h-3 w-3 mr-1" />
                              Super
                            </span>
                          )}
                          {user.is_staff && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Staff
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(user.date_joined).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
