import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import Papa from 'papaparse';
import { 
  Users, 
  Download, 
  Upload, 
  Search, 
  Calendar,
  GraduationCap,
  Mail,
  Phone,
  UserPlus,
  Edit,
  Trash2,
  Save,
  X,
} from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');

  // Edit/Delete states
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    admission_date: '',
    roll_number: '',
    classroom: '',
    section: 'A',
    father_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Helper function to convert YYYY-MM-DD to DD-MM-YYYY for display
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // If in YYYY-MM-DD format, convert to DD-MM-YYYY
      if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      // If already in DD-MM-YYYY format, return as is
      if (parts[0].length === 2) return dateStr;
    }
    return dateStr;
  };

  // Helper function to convert DD-MM-YYYY to YYYY-MM-DD for API
  const formatDateForAPI = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // If in DD-MM-YYYY format, convert to YYYY-MM-DD
      if (parts[0].length === 2) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      // If already in YYYY-MM-DD format, return as is
      if (parts[0].length === 4) return dateStr;
    }
    return dateStr;
  };

  // Helper function to convert DD-MM-YYYY to YYYY-MM-DD for date picker
  const formatDateForDatePicker = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // If in DD-MM-YYYY format, convert to YYYY-MM-DD
      if (parts[0].length === 2) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      // If already in YYYY-MM-DD format, return as is
      if (parts[0].length === 4) return dateStr;
    }
    return dateStr;
  };

  // Helper function to convert YYYY-MM-DD from date picker to DD-MM-YYYY for display
  const formatDateFromDatePicker = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // If in YYYY-MM-DD format, convert to DD-MM-YYYY
      if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      // If already in DD-MM-YYYY format, return as is
      if (parts[0].length === 2) return dateStr;
    }
    return dateStr;
  };

  useEffect(() => {
    api.get('/students/').then(r => setStudents(r.data));
    api.get('/classrooms/').then(r => setClassrooms(r.data));
    
    // Test date picker functionality
    console.log('=== Date Picker Debug Info ===');
    console.log('Browser supports date input:', 'date' in document.createElement('input'));
    console.log('Date picker should work in modern browsers');
    console.log('=== End Debug Info ===');
  }, []);

  const findOrCreateClassroom = async (name, section) => {
    name = String(name || '').trim();
    section = String(section || '').trim();
    if (!name) return null;
    const existing = classrooms.find(c => c.name === name && String(c.section || '') === section);
    if (existing) return existing.id;
    const res = await api.post('/classrooms/', { name, section });
    const created = res.data;
    setClassrooms([created, ...classrooms]);
    return created.id;
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        let created = 0, failed = 0;
        for (const row of rows) {
          try {
            const classroomName = row.class || row.class_name || row.Class || row.ClassName || '';
            const classroomSection = row.section || row.Section || '';
            const classroom = await findOrCreateClassroom(classroomName, classroomSection);
            const payload = {
              first_name: String(row.first_name || row.firstname || row.FirstName || row.First || '').trim(),
              last_name: String(row.last_name || row.lastname || row.LastName || row.Last || '').trim(),
              date_of_birth: formatDateForAPI(String(row.date_of_birth || row.dob || row.DOB || '').trim()),
              roll_number: String(row.roll_number || row.roll || row.Roll || '').trim(),
              classroom,
            };
            if (!payload.first_name || !payload.last_name || !payload.date_of_birth) { failed++; continue; }
            await api.post('/students/', payload);
            created++;
          } catch (err) {
            failed++;
          }
        }
        const refreshed = await api.get('/students/');
        setStudents(refreshed.data);
        setImportResult({ created, failed, total: rows.length });
        setImporting(false);
        e.target.value = '';
      },
      error: () => {
        setImportResult({ created: 0, failed: 0, total: 0, error: 'Parse error' });
        setImporting(false);
        e.target.value = '';
      }
    });
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roll_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = filterClass === '' || 
      (student.classroom_detail && student.classroom_detail.id === Number(filterClass));
    
    const matchesSection = filterSection === '' || 
      (student.classroom_detail && student.classroom_detail.section === filterSection);
    
    return matchesSearch && matchesClass && matchesSection;
  });

  const exportCsv = () => {
    const header = ['first_name','last_name','date_of_birth','roll_number','class','section'];
    const sample = [header.join(','),'John,Doe,2010-01-01,1,Grade 5,A'].join('\n');
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'students_sample.csv'; a.click(); URL.revokeObjectURL(url);
  };

  // Edit student functions
  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setEditForm({
      first_name: student.first_name,
      last_name: student.last_name,
      date_of_birth: formatDateForDatePicker(student.date_of_birth),
      admission_date: formatDateForDatePicker(student.admission_date) || '',
      roll_number: student.roll_number,
      classroom: student.classroom_detail?.name || '',
      section: student.classroom_detail?.section || 'A',
      father_name: student.father_name || '',
      contact_email: student.contact_email || '',
      contact_phone: student.contact_phone || '',
      address: student.address || '',
    });
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    try {
      // Find or create classroom
      const classroomId = await findOrCreateClassroom(editForm.classroom, editForm.section);
      
      const payload = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        date_of_birth: formatDateForAPI(editForm.date_of_birth),
        admission_date: formatDateForAPI(editForm.admission_date) || null,
        roll_number: editForm.roll_number,
        classroom: classroomId,
        father_name: editForm.father_name || '',
        contact_email: editForm.contact_email || '',
        contact_phone: editForm.contact_phone || '',
        address: editForm.address || '',
      };

      await api.put(`/students/${editingStudent.id}/`, payload);
      
      // Refresh students list
      const refreshed = await api.get('/students/');
      setStudents(refreshed.data);
      
      setEditingStudent(null);
      setMessage({ type: 'success', text: 'Student updated successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
      
    } catch (error) {
      const errorMsg = error?.response?.data ? JSON.stringify(error.response.data) : 'Failed to update student';
      setMessage({ type: 'error', text: `Update failed: ${errorMsg}` });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/students/${studentId}/`);
      
      // Refresh students list
      const refreshed = await api.get('/students/');
      setStudents(refreshed.data);
      
      setMessage({ type: 'success', text: 'Student deleted successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
      
    } catch (error) {
      const errorMsg = error?.response?.data ? JSON.stringify(error.response.data) : 'Failed to delete student';
      setMessage({ type: 'error', text: `Delete failed: ${errorMsg}` });
    }
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    setEditForm({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      admission_date: '',
      roll_number: '',
      classroom: '',
      section: 'A',
      father_name: '',
      contact_email: '',
      contact_phone: '',
      address: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="h-8 w-8 mr-3 text-blue-600" />
            Students
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage student information and enrollment
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/students/new" className="btn-primary">
            <UserPlus className="h-4 w-4 mr-2" /> Add Student
          </Link>
          <button
            onClick={exportCsv}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Sample CSV
          </button>
          <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
            <input type="file" accept=".csv" onChange={handleImportFile} className="hidden" />
            <Upload className="h-4 w-4 mr-2" />
            {importing ? 'Importing...' : 'Import CSV'}
          </label>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`rounded-lg p-4 ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {message.text}
          </div>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-700">
            Imported {importResult.created}/{importResult.total} students. Failed: {importResult.failed}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Students</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or roll number..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Class</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="">All Classes</option>
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>
                  Class {c.name}{c.section ? ` - Section ${c.section}` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Section</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
            >
              <option value="">All Sections</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
        </div>
        
        {/* Clear Filters Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterClass('');
              setFilterSection('');
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Filter Summary */}
      {(searchTerm || filterClass || filterSection) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700">
              <span className="font-medium">Active Filters:</span>
              {searchTerm && <span className="ml-2 px-2 py-1 bg-blue-100 rounded text-xs">Search: "{searchTerm}"</span>}
              {filterClass && (
                <span className="ml-2 px-2 py-1 bg-blue-100 rounded text-xs">
                  Class: {classrooms.find(c => c.id === Number(filterClass))?.name || filterClass}
                </span>
              )}
              {filterSection && <span className="ml-2 px-2 py-1 bg-blue-100 rounded text-xs">Section: {filterSection}</span>}
              <span className="ml-2 text-blue-600">
                Showing {filteredStudents.length} of {students.length} students
              </span>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterClass('');
                setFilterSection('');
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {s.first_name} {s.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{s.roll_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDateForDisplay(s.date_of_birth)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {s.classroom_detail ? (
                      <span>{s.classroom_detail.name}{s.classroom_detail.section ? ` - ${s.classroom_detail.section}` : ''}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{s.contact_email || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{s.contact_phone || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditStudent(s)}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        title="Edit Student"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(s.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete Student"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-sm text-gray-500">
                    No students found. Try adjusting search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Student: {editingStudent.first_name} {editingStudent.last_name}
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateStudent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={editForm.date_of_birth}
                      onChange={(e) => {
                        console.log('Date of Birth changed:', e.target.value);
                        setEditForm({...editForm, date_of_birth: e.target.value});
                      }}
                      onClick={(e) => {
                        // Force show date picker
                        e.target.showPicker?.();
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                      required
                      max={new Date().toISOString().split('T')[0]}
                      style={{
                        position: 'relative',
                        zIndex: 10,
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none'
                      }}
                    />
                    {editForm.date_of_birth && (
                      <p className="text-sm text-gray-600 mt-1">
                        Selected: {new Date(editForm.date_of_birth).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
                    <input
                      type="date"
                      name="admission_date"
                      value={editForm.admission_date}
                      onChange={(e) => {
                        console.log('Admission Date changed:', e.target.value);
                        setEditForm({...editForm, admission_date: e.target.value});
                      }}
                      onClick={(e) => {
                        // Force show date picker
                        e.target.showPicker?.();
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                      max={new Date().toISOString().split('T')[0]}
                      style={{
                        position: 'relative',
                        zIndex: 10,
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none'
                      }}
                    />
                    {editForm.admission_date && (
                      <p className="text-sm text-gray-600 mt-1">
                        Selected: {new Date(editForm.admission_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                    <input
                      type="text"
                      name="roll_number"
                      value={editForm.roll_number}
                      onChange={(e) => setEditForm({...editForm, roll_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <select
                      name="classroom"
                      value={editForm.classroom}
                      onChange={(e) => setEditForm({...editForm, classroom: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Class</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                    <select
                      name="section"
                      value={editForm.section}
                      onChange={(e) => setEditForm({...editForm, section: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                    <input
                      type="text"
                      name="father_name"
                      value={editForm.father_name}
                      onChange={(e) => setEditForm({...editForm, father_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="contact_email"
                      value={editForm.contact_email}
                      onChange={(e) => setEditForm({...editForm, contact_email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      name="contact_phone"
                      value={editForm.contact_phone}
                      onChange={(e) => setEditForm({...editForm, contact_phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    name="address"
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {saving ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
