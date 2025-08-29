import { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit, Trash2, Download, Upload, DollarSign, Calendar, Users, TrendingUp } from 'lucide-react';
import api from '../api/client';

export default function Fees() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filteredPayments, setFilteredPayments] = useState([]);

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    student: '',
    fee_type: '',
    total_fee: '',
    total_paid: '',
    payment_date: '',
    due_date: '',
    payment_method: 'cash',
    receipt_number: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Filter payments based on search and filter criteria
  useEffect(() => {
    let filtered = [...payments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.student_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.fee_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Month filter
    if (filterMonth) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        const paymentMonth = paymentDate.getMonth() + 1; // getMonth() returns 0-11
        const paymentYear = paymentDate.getFullYear();
        const [filterYear, filterMonthNum] = filterMonth.split('-');
        return paymentMonth === parseInt(filterMonthNum) && paymentYear === parseInt(filterYear);
      });
    }

    // Class filter
    if (filterClass) {
      filtered = filtered.filter(payment => {
        const student = students.find(s => s.id === payment.student);
        return student && student.classroom === parseInt(filterClass);
      });
    }

    setFilteredPayments(filtered);
  }, [payments, searchTerm, filterMonth, filterClass, students]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, studentsRes, classroomsRes] = await Promise.all([
        api.get('payments/'),
        api.get('students/'),
        api.get('classrooms/')
      ]);
      
      setPayments(paymentsRes.data || []);
      setStudents(studentsRes.data || []);
      setClassrooms(classroomsRes.data || []);
      
      console.log('Loaded payments:', paymentsRes.data);
      console.log('Total payments in table:', (paymentsRes.data || []).length);
      
    } catch (error) {
      console.error('Load data error:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Calculate balance automatically
      const calculatedBalance = calculateBalance(paymentForm.total_fee, paymentForm.total_paid);
      const paymentData = {
        ...paymentForm,
        balance: calculatedBalance
      };
      
      console.log('Submitting payment form:', paymentData);
      const response = await api.post('payments/', paymentData);
      console.log('Payment recorded:', response.data);
      
      // Reset form
      setSelectedClass('');
      setFilteredStudents([]);
      setPaymentForm({
        student: '',
        fee_type: '',
        total_fee: '',
        total_paid: '',
        payment_date: '',
        due_date: '',
        payment_method: 'cash',
        receipt_number: '',
        notes: ''
      });
      
      // Reload data to update the table
      await loadData();
      
      setMessage({ type: 'success', text: 'Payment recorded successfully and added to table!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('Payment error:', error);
      const errorMsg = error?.response?.data ? JSON.stringify(error.response.data) : 'Failed to record payment';
      setMessage({ type: 'error', text: `Payment failed: ${errorMsg}` });
    } finally {
      setLoading(false);
    }
  };

  const exportPayments = () => {
    const csv = [
      ['Student', 'Fee Type', 'Total Fee (₹)', 'Total Paid (₹)', 'Balance (₹)', 'Payment Date', 'Due Date', 'Status', 'Method', 'Receipt Number'],
      ...filteredPayments.map(payment => [
        payment.student_full_name,
        payment.fee_type,
        `₹${payment.total_fee || 0}`,
        `₹${payment.total_paid || 0}`,
        `₹${payment.balance || 0}`,
        payment.payment_date,
        payment.due_date || '',
        payment.is_overdue ? 'OVERDUE' : 'PAID',
        payment.payment_method,
        payment.receipt_number
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payments.csv';
    a.click();
  };

  // Handle class selection
  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setPaymentForm({...paymentForm, student: ''}); // Reset student selection
    
    if (classId) {
      const filtered = students.filter(student => student.classroom === parseInt(classId));
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  };

  // Edit payment
  const handleEditPayment = (payment) => {
    console.log('Editing payment:', payment);
    setEditingPayment(payment);
    
    // Find the student to get their class
    const student = students.find(s => s.id === payment.student);
    console.log('Found student:', student);
    if (student) {
      setSelectedClass(student.classroom.toString());
      const filtered = students.filter(s => s.classroom === student.classroom);
      setFilteredStudents(filtered);
    }
    
    const formData = {
      student: payment.student,
      fee_type: payment.fee_type,
      total_fee: payment.total_fee || '',
      total_paid: payment.total_paid || '',
      payment_date: payment.payment_date,
      due_date: payment.due_date || '',
      payment_method: payment.payment_method,
      receipt_number: payment.receipt_number || '',
      notes: payment.notes || ''
    };
    
    console.log('Setting form data:', formData);
    setPaymentForm(formData);
  };

  // Update payment
  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Calculate balance automatically
      const calculatedBalance = calculateBalance(paymentForm.total_fee, paymentForm.total_paid);
      const paymentData = {
        ...paymentForm,
        balance: calculatedBalance
      };
      
      console.log('Updating payment:', editingPayment.id, paymentData);
      const response = await api.put(`payments/${editingPayment.id}/`, paymentData);
      console.log('Update response:', response.data);
      
      setEditingPayment(null);
      setSelectedClass('');
      setFilteredStudents([]);
      setPaymentForm({
        student: '',
        fee_type: '',
        total_fee: '',
        total_paid: '',
        payment_date: '',
        due_date: '',
        payment_method: 'cash',
        receipt_number: '',
        notes: ''
      });
      
      // Reload data to update the table
      await loadData();
      
      setMessage({ type: 'success', text: 'Payment updated successfully' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('Update payment error:', error);
      const errorMsg = error?.response?.data ? JSON.stringify(error.response.data) : 'Failed to update payment';
      setMessage({ type: 'error', text: `Update failed: ${errorMsg}` });
    } finally {
      setLoading(false);
    }
  };

  // Delete payment
  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        setLoading(true);
        await api.delete(`payments/${paymentId}/`);
        loadData();
        setMessage({ type: 'success', text: 'Payment deleted successfully' });
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to delete payment' });
      } finally {
        setLoading(false);
      }
    }
  };

  // Calculate balance automatically
  const calculateBalance = (totalFee, totalPaid) => {
    const fee = parseFloat(totalFee) || 0;
    const paid = parseFloat(totalPaid) || 0;
    return (fee - paid).toFixed(2);
  };

  const totalRevenue = payments.reduce((sum, payment) => sum + parseFloat(payment.total_paid || 0), 0);
  const monthlyRevenue = payments
    .filter(payment => {
      const paymentDate = new Date(payment.payment_date);
      const currentDate = new Date();
      return paymentDate.getMonth() === currentDate.getMonth() && 
             paymentDate.getFullYear() === currentDate.getFullYear();
    })
    .reduce((sum, payment) => sum + parseFloat(payment.total_paid || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center">
          <CreditCard className="h-7 w-7 mr-3 icon-gradient" />
          Fees Management
        </h1>
      </div>

      {message && (
        <div className={`rounded-xl p-4 ${message.type === 'success' ? 'status-success' : 'status-error'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600">₹{monthlyRevenue.toFixed(2)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-purple-600">{filteredPayments.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Records */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Payment Records</h2>
          <button onClick={exportPayments} className="btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="form-label">Search</label>
                <input
                  type="text"
                  placeholder="Search by student name, fee type, or receipt number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Month Filter */}
              <div>
                <label className="form-label">Filter by Month</label>
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Class Filter */}
              <div>
                <label className="form-label">Filter by Class</label>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="form-input"
                >
                  <option value="">All Classes</option>
                  {classrooms.map(classroom => (
                    <option key={classroom.id} value={classroom.id}>
                      Class {classroom.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterMonth('');
                    setFilterClass('');
                  }}
                  className="btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Payment Form */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium mb-4">
              {editingPayment ? 'Edit Payment' : 'Record New Payment'}
            </h3>
            <form onSubmit={editingPayment ? handleUpdatePayment : handlePaymentSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {editingPayment && (
                <div className="md:col-span-2 lg:col-span-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Editing Payment:</strong> {editingPayment.student_full_name} - {editingPayment.fee_type} (ID: {editingPayment.id})
                  </p>
                </div>
              )}
              <div>
                <label className="form-label">Class</label>
                <select
                  name="classroom"
                  value={selectedClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Select Class</option>
                  {classrooms.map(classroom => (
                    <option key={classroom.id} value={classroom.id}>
                      Class {classroom.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Student</label>
                <select
                  name="student"
                  value={paymentForm.student}
                  onChange={(e) => setPaymentForm({...paymentForm, student: e.target.value})}
                  className="form-input"
                  required
                  disabled={!selectedClass}
                  data-lpignore="true"
                  data-form-type="other"
                  autocomplete="off"
                >
                  <option value="">{selectedClass ? 'Select Student' : 'Select Class First'}</option>
                  {filteredStudents.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} - Roll: {student.roll_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Fee Type</label>
                <select
                  name="fee_type"
                  value={paymentForm.fee_type}
                  onChange={(e) => setPaymentForm({...paymentForm, fee_type: e.target.value})}
                  className="form-input"
                  required
                  data-lpignore="true"
                  data-form-type="other"
                  autocomplete="off"
                >
                  <option value="">Select Type</option>
                  <option value="tuition">Tuition Fee</option>
                  <option value="admission">Admission Fee</option>
                  <option value="other">Other</option>
                </select>
              </div>



              <div>
                <label className="form-label">Total Fee (₹)</label>
                <input
                  type="number"
                  name="total_fee"
                  value={paymentForm.total_fee}
                  onChange={(e) => setPaymentForm({...paymentForm, total_fee: e.target.value})}
                  className="form-input"
                  placeholder="0.00"
                  step="0.01"
                  required
                  data-lpignore="true"
                  data-form-type="other"
                  autocomplete="off"
                />
              </div>

              <div>
                <label className="form-label">Total Paid (₹)</label>
                <input
                  type="number"
                  name="total_paid"
                  value={paymentForm.total_paid}
                  onChange={(e) => setPaymentForm({...paymentForm, total_paid: e.target.value})}
                  className="form-input"
                  placeholder="0.00"
                  step="0.01"
                  required
                  data-lpignore="true"
                  data-form-type="other"
                  autocomplete="off"
                />
              </div>

              <div>
                <label className="form-label">Balance (₹)</label>
                <div className="form-input bg-gray-50 text-gray-700 cursor-not-allowed">
                  ₹{calculateBalance(paymentForm.total_fee, paymentForm.total_paid)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically calculated: Total Fee - Total Paid
                </p>
              </div>

              <div>
                <label className="form-label">Payment Date</label>
                <input
                  type="date"
                  name="payment_date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                  onClick={(e) => {
                    // Prevent LastPass interference in Chrome
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Force focus and show date picker
                    const dateInput = e.target;
                    dateInput.focus();
                    dateInput.showPicker?.();
                  }}
                  className="form-input"
                  required
                  style={{ 
                    position: 'relative', 
                    zIndex: 10,
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none'
                  }}
                  max={new Date().toISOString().split('T')[0]} // Allow past and current dates
                  data-lpignore="true"
                  data-form-type="other"
                  autocomplete="off"
                  data-lastpass-rid=""
                  data-1p-ignore=""
                />
                {paymentForm.payment_date && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {new Date(paymentForm.payment_date).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  name="due_date"
                  value={paymentForm.due_date}
                  onChange={(e) => setPaymentForm({...paymentForm, due_date: e.target.value})}
                  onClick={(e) => {
                    // Prevent LastPass interference in Chrome
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Force focus and show date picker
                    const dateInput = e.target;
                    dateInput.focus();
                    dateInput.showPicker?.();
                  }}
                  className="form-input"
                  style={{ 
                    position: 'relative', 
                    zIndex: 10,
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none'
                  }}
                  data-lpignore="true"
                  data-form-type="other"
                  autocomplete="off"
                  data-lastpass-rid=""
                  data-1p-ignore=""
                />
                {paymentForm.due_date && (
                  <p className="text-sm text-gray-600 mt-1">
                    Due: {new Date(paymentForm.due_date).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">Payment Method</label>
                <select
                  name="payment_method"
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                  className="form-input"
                  required
                  data-lpignore="true"
                  data-form-type="other"
                  autocomplete="off"
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="online">Online Payment</option>
                </select>
              </div>

              <div>
                <label className="form-label">Receipt Number</label>
                <input
                  type="text"
                  name="receipt_number"
                  value={paymentForm.receipt_number}
                  onChange={(e) => setPaymentForm({...paymentForm, receipt_number: e.target.value})}
                  className="form-input"
                  placeholder="Optional"
                  data-lpignore="true"
                  data-form-type="other"
                  autocomplete="off"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  className="form-input"
                  rows={2}
                  placeholder="Optional notes..."
                  data-lpignore="true"
                  data-form-type="other"
                  autocomplete="off"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3 flex gap-2">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (editingPayment ? 'Updating...' : 'Recording...') : (editingPayment ? 'Update Payment' : 'Record Payment')}
                </button>
                {editingPayment && (
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => {
                      setEditingPayment(null);
                      setSelectedClass('');
                      setFilteredStudents([]);
                      setPaymentForm({
                        student: '',
                        fee_type: '',
                        total_fee: '',
                        total_paid: '',
                        payment_date: '',
                        due_date: '',
                        payment_method: 'cash',
                        receipt_number: '',
                        notes: ''
                      });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Payments Table */}
        <div className="card">
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Fee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <CreditCard className="h-12 w-12 text-gray-300 mb-2" />
                            <p className="text-lg font-medium">
                              {payments.length === 0 ? 'No payments recorded yet' : 'No payments match your search/filter criteria'}
                            </p>
                            <p className="text-sm">
                              {payments.length === 0 ? 'Record a payment above to see it here' : 'Try adjusting your search or filter options'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((payment) => (
                                              <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.student_full_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{payment.fee_type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{payment.total_fee || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{payment.total_paid || 0}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${parseFloat(payment.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₹{payment.balance || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.payment_date}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${payment.is_overdue ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                            {payment.due_date ? (
                              <span className={payment.is_overdue ? 'bg-red-100 px-2 py-1 rounded text-xs' : ''}>
                                {payment.due_date}
                                {payment.is_overdue && <span className="ml-1">⚠️ OVERDUE</span>}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{payment.payment_method}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.receipt_number || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleEditPayment(payment)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeletePayment(payment.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
    </div>
  );
}
