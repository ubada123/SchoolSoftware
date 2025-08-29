import { Link } from 'react-router-dom';
import { GraduationCap, UserPlus, BarChart3, CreditCard, AlertTriangle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api/client';

export default function Dashboard() {
  const [overduePayments, setOverduePayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverduePayments = async () => {
      try {
        const response = await api.get('payments/');
        const overdue = response.data.filter(payment => payment.is_overdue);
        setOverduePayments(overdue);
      } catch (error) {
        console.error('Failed to load overdue payments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOverduePayments();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1>Dashboard</h1>
      </div>

      {/* Overdue Payments Alert */}
      {overduePayments.length > 0 && (
        <div className="card border-2 border-red-200 bg-red-50">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">
                    Overdue Payments Alert
                  </h3>
                  <p className="text-sm text-red-700">
                    {overduePayments.length} payment{overduePayments.length > 1 ? 's' : ''} {overduePayments.length > 1 ? 'are' : 'is'} overdue
                  </p>
                </div>
              </div>
              <Link to="/fees" className="btn-danger">
                View Details
              </Link>
            </div>
            
            {/* Overdue Payments List */}
            <div className="mt-4 space-y-2">
              {overduePayments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-gray-900">{payment.student_full_name}</p>
                    <p className="text-sm text-gray-600">
                      {payment.fee_type} - Due: {payment.due_date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">₹{payment.balance}</p>
                    <p className="text-xs text-red-500">OVERDUE</p>
                  </div>
                </div>
              ))}
              {overduePayments.length > 3 && (
                <p className="text-sm text-red-600 text-center">
                  +{overduePayments.length - 3} more overdue payments
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="responsive-grid">
        <Link to="/students/new" className="card hover-lift hover-glow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-900">Add New Student</h3>
                <p className="mt-2 text-sm text-gray-600">Create a student record with class, roll number and contacts.</p>
              </div>
              <div className="h-12 w-12 rounded-xl gradient-bg flex items-center justify-center text-white">
                <UserPlus className="h-6 w-6" />
              </div>
            </div>
          </div>
        </Link>

        <Link to="/fees" className="card hover-lift hover-glow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-900">Fees Structure</h3>
                <p className="mt-2 text-sm text-gray-600">Manage fee categories, amounts, and payment tracking for all classes.</p>
              </div>
              <div className="h-12 w-12 rounded-xl gradient-bg flex items-center justify-center text-white">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
          </div>
        </Link>

        <Link to="/reports" className="card hover-lift hover-glow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-900">Reports</h3>
                <p className="mt-2 text-sm text-gray-600">Export students and grades as CSV for offline use.</p>
              </div>
              <div className="h-12 w-12 rounded-xl gradient-bg flex items-center justify-center text-white">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
