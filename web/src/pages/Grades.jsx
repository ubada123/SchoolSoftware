import { useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';
import Papa from 'papaparse';
import { 
  BookOpen, 
  Plus, 
  Download, 
  Upload, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  Calendar,
  Award,
  TrendingUp,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function Grades() {
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);

  // Create form
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [term, setTerm] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');

  // Filters
  const [filterStudentId, setFilterStudentId] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterTerm, setFilterTerm] = useState('');

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editStudentId, setEditStudentId] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editTerm, setEditTerm] = useState('');
  const [editScore, setEditScore] = useState('');
  const [editMaxScore, setEditMaxScore] = useState('');

  // Import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    api.get('/grades/').then(r => setGrades(r.data));
    api.get('/students/').then(r => setStudents(r.data));
  }, []);

  const filteredGrades = useMemo(() => {
    return grades.filter(g => {
      const matchesStudent = filterStudentId ? String(g.student) === String(filterStudentId) : true;
      const matchesSubject = filterSubject ? g.subject.toLowerCase().includes(filterSubject.toLowerCase()) : true;
      const matchesTerm = filterTerm ? g.term.toLowerCase().includes(filterTerm.toLowerCase()) : true;
      return matchesStudent && matchesSubject && matchesTerm;
    });
  }, [grades, filterStudentId, filterSubject, filterTerm]);

  const createGrade = async (e) => {
    e.preventDefault();
    const res = await api.post('/grades/', {
      student: studentId ? Number(studentId) : null,
      subject,
      term,
      score: Number(score),
      max_score: Number(maxScore || '100'),
    });
    setGrades([res.data, ...grades]);
    setStudentId(''); setSubject(''); setTerm(''); setScore(''); setMaxScore('100');
  };

  const startEdit = (g) => {
    setEditId(g.id);
    setEditStudentId(String(g.student));
    setEditSubject(g.subject);
    setEditTerm(g.term);
    setEditScore(String(g.score));
    setEditMaxScore(String(g.max_score));
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditStudentId('');
    setEditSubject('');
    setEditTerm('');
    setEditScore('');
    setEditMaxScore('');
  };

  const saveEdit = async (id) => {
    const res = await api.put(`/grades/${id}/`, {
      student: editStudentId ? Number(editStudentId) : null,
      subject: editSubject,
      term: editTerm,
      score: Number(editScore),
      max_score: Number(editMaxScore || '100'),
    });
    setGrades(grades.map(g => (g.id === id ? res.data : g)));
    cancelEdit();
  };

  const deleteGrade = async (id) => {
    if (!confirm('Delete this grade?')) return;
    await api.delete(`/grades/${id}/`);
    setGrades(grades.filter(g => g.id !== id));
  };

  const exportCsv = () => {
    const header = ['Student','Subject','Term','Score','Max'];
    const lines = [header.join(',')];
    filteredGrades.forEach(g => {
      const name = g.student_detail ? `${g.student_detail.first_name} ${g.student_detail.last_name}` : '';
      lines.push([name, g.subject, g.term, g.score, g.max_score].map(x => `"${String(x).replaceAll('"','""')}"`).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grades.csv';
    a.click();
    URL.revokeObjectURL(url);
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
        const rollToId = new Map(students.map(s => [String(s.roll_number || '').trim(), s.id]));
        const nameToId = new Map(students.map(s => [`${s.first_name} ${s.last_name}`.trim().toLowerCase(), s.id]));
        let created = 0, failed = 0;
        for (const row of rows) {
          try {
            const roll = String(row.roll_number || '').trim();
            const name = String(row.student || row.name || '').trim().toLowerCase();
            const student = rollToId.get(roll) || nameToId.get(name);
            if (!student) { failed++; continue; }
            const payload = {
              student,
              subject: String(row.subject || row.Subject || '').trim(),
              term: String(row.term || row.Term || '').trim(),
              score: Number(row.score || row.Score || 0),
              max_score: Number(row.max_score || row.Max || 100),
            };
            if (!payload.subject || !payload.term) { failed++; continue; }
            await api.post('/grades/', payload);
            created++;
          } catch (err) {
            failed++;
          }
        }
        const refreshed = await api.get('/grades/');
        setGrades(refreshed.data);
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

  const getGradeColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BookOpen className="h-8 w-8 mr-3 text-blue-600" />
            Grades
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage student grades and academic performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportCsv}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
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
            Imported {importResult.created}/{importResult.total} grades. Failed: {importResult.failed}
          </div>
        </div>
      )}

      {/* Create Grade Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Plus className="h-5 w-5 mr-2 text-blue-600" />
            Add New Grade
          </h3>
        </div>
        <form onSubmit={createGrade} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={studentId} 
                onChange={(e)=>setStudentId(e.target.value)}
                required
              >
                <option value="">Select student</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} ({s.roll_number})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input 
                placeholder="Subject" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={subject} 
                onChange={e=>setSubject(e.target.value)} 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
              <input 
                placeholder="Term" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={term} 
                onChange={e=>setTerm(e.target.value)} 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="Score" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={score} 
                onChange={e=>setScore(e.target.value)} 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="Max score" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={maxScore} 
                onChange={e=>setMaxScore(e.target.value)} 
                required
              />
            </div>
            <div className="flex items-end">
              <button 
                type="submit" 
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Grade
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Student</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value={filterStudentId} 
              onChange={(e)=>setFilterStudentId(e.target.value)}
            >
              <option value="">All Students</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Subject</label>
            <input 
              placeholder="Filter by subject" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value={filterSubject} 
              onChange={e=>setFilterSubject(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Term</label>
            <input 
              placeholder="Filter by term" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value={filterTerm} 
              onChange={e=>setFilterTerm(e.target.value)} 
            />
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-500">
              Showing {filteredGrades.length} of {grades.length} grades
            </div>
          </div>
        </div>
      </div>

      {/* Grades Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGrades.map(g => (
          <div key={g.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {g.student_detail ? `${g.student_detail.first_name} ${g.student_detail.last_name}` : 'Unknown Student'}
                  </h3>
                  <p className="text-sm text-gray-500">{g.subject}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(g.score, g.max_score)}`}>
                {((g.score / g.max_score) * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                Term: {g.term}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Award className="h-4 w-4 mr-2 text-gray-400" />
                Score: {g.score} / {g.max_score}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              {editId === g.id ? (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => saveEdit(g.id)} 
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </button>
                  <button 
                    onClick={cancelEdit} 
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => startEdit(g)} 
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </button>
                  <button 
                    onClick={() => deleteGrade(g.id)} 
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredGrades.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No grades found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filterStudentId || filterSubject || filterTerm ? 'Try adjusting your filters.' : 'Get started by adding a new grade.'}
          </p>
        </div>
      )}
    </div>
  );
}
