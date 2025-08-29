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
} from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');

  useEffect(() => {
    api.get('/students/').then(r => setStudents(r.data));
    api.get('/classrooms/').then(r => setClassrooms(r.data));
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
              date_of_birth: String(row.date_of_birth || row.dob || row.DOB || '').trim(),
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
    const matchesClass = filterClass === '' || student.classroom === Number(filterClass);
    return matchesSearch && matchesClass;
  });

  const exportCsv = () => {
    const header = ['first_name','last_name','date_of_birth','roll_number','class','section'];
    const sample = [header.join(','),'John,Doe,2010-01-01,1,Grade 5,A'].join('\n');
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'students_sample.csv'; a.click(); URL.revokeObjectURL(url);
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
        <div className="flex items-center space-x-4">
          <div className="flex-1">
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
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="">All Classes</option>
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.section ? ` - ${c.section}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

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
                    {new Date(s.date_of_birth).toLocaleDateString()}
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
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500">
                    No students found. Try adjusting search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
