import api from '../api/client';
import { useState } from 'react';
import { Download, FileText, Users, BookOpen } from 'lucide-react';

function downloadFile(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [downloading, setDownloading] = useState(null);

  const exportStudents = async () => {
    setDownloading('students');
    try {
      const res = await api.get('students/');
      const rows = res.data || [];
      const header = ['first_name','last_name','date_of_birth','roll_number','classroom','contact_email','contact_phone','address'];
      const csv = [header.join(','), ...rows.map(r => header.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
      downloadFile('students.csv', csv);
    } finally {
      setDownloading(null);
    }
  };

  const exportGrades = async () => {
    setDownloading('grades');
    try {
      const res = await api.get('grades/');
      const rows = res.data || [];
      const header = ['student','subject','term','score','max_score'];
      const csv = [header.join(','), ...rows.map(r => header.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
      downloadFile('grades.csv', csv);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1>Reports</h1>
      </div>

      <div className="responsive-grid">
        <div className="card">
          <div className="card-body space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-lg gradient-bg text-white flex items-center justify-center mr-3">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-gray-900">Export Students</h3>
                  <p className="text-sm text-gray-600">Download all students as CSV.</p>
                </div>
              </div>
              <button onClick={exportStudents} className="btn-secondary">
                <Download className="h-4 w-4 mr-2" /> {downloading==='students' ? 'Preparing...' : 'Download'}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-lg gradient-bg text-white flex items-center justify-center mr-3">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-gray-900">Export Grades</h3>
                  <p className="text-sm text-gray-600">Download all grades as CSV.</p>
                </div>
              </div>
              <button onClick={exportGrades} className="btn-secondary">
                <Download className="h-4 w-4 mr-2" /> {downloading==='grades' ? 'Preparing...' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
