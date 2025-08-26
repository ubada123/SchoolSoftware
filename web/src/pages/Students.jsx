import { useEffect, useState } from 'react';
import api from '../api/client.js';
import Papa from 'papaparse';
import { 
  Users, 
  Plus, 
  Download, 
  Upload, 
  Search, 
  Filter,
  UserPlus,
  FileText,
  Calendar,
  Hash,
  GraduationCap,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [roll, setRoll] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [classrooms, setClassrooms] = useState([]);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');

  useEffect(() => {
    api.get('/students/').then(r => setStudents(r.data));
    api.get('/classrooms/').then(r => setClassrooms(r.data));
  }, []);

  const createStudent = async (e) => {
    e.preventDefault();
    const res = await api.post('/students/', {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dob,
      roll_number: roll,
      classroom: classroomId ? Number(classroomId) : null,
    });
    setStudents([res.data, ...students]);
    setFirstName(''); setLastName(''); setDob(''); setRoll(''); setClassroomId('');
  };

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

      {/* Create Student Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
            Add New Student
          </h3>
        </div>
        <form onSubmit={createStudent} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input 
                placeholder="First name" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={firstName} 
                onChange={e=>setFirstName(e.target.value)} 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input 
                placeholder="Last name" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={lastName} 
                onChange={e=>setLastName(e.target.value)} 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={dob} 
                onChange={e=>setDob(e.target.value)} 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
              <input 
                placeholder="Roll number" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={roll} 
                onChange={e=>setRoll(e.target.value)} 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={classroomId} 
                onChange={e=>setClassroomId(e.target.value)}
              >
                <option value="">Select class</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.section ? ` - ${c.section}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button 
              type="submit" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </button>
          </div>
        </form>
      </div>

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

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map(s => (
          <div key={s.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {s.first_name} {s.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">Roll #{s.roll_number}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {new Date(s.date_of_birth).toLocaleDateString()}
              </div>
              {s.classroom_detail && (
                <div className="flex items-center text-sm text-gray-600">
                  <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                  {s.classroom_detail.name}{s.classroom_detail.section ? ` - ${s.classroom_detail.section}` : ''}
                </div>
              )}
              {s.contact_email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  {s.contact_email}
                </div>
              )}
              {s.contact_phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {s.contact_phone}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterClass ? 'Try adjusting your search or filters.' : 'Get started by adding a new student.'}
          </p>
        </div>
      )}
    </div>
  );
}
