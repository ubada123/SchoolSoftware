import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Papa from 'papaparse';
import { UserPlus, Users, Save, Upload, Download, FileText } from 'lucide-react';

export default function AddStudent() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    admission_date: '',
    roll_number: '',
    classroom: '', // holds class NAME '1'|'2'|'3'|'4'|'5'
    section: 'A', // holds section 'A'|'B'|'C'
    father_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Bulk upload states
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('classrooms/');
        const list = Array.isArray(res.data) ? res.data : [];
        list.sort((a, b) => {
          const na = Number(a.name); const nb = Number(b.name);
          return (isNaN(na) || isNaN(nb)) ? String(a.name).localeCompare(String(b.name)) : na - nb;
        });
        setClassrooms(list);
      } catch {}
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field ${name} changed to:`, value); // Debug logging
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleDateClick = (e) => {
    // Prevent LastPass interference in Chrome
    e.preventDefault();
    e.stopPropagation();
    
    // Force focus and show date picker
    const dateInput = e.target;
    dateInput.focus();
    dateInput.showPicker?.();
  };

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
    console.log('formatDateForAPI input:', dateStr, typeof dateStr);
    
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined' || dateStr === '') {
      console.log('formatDateForAPI: returning null for empty/null value');
      return null;
    }
    
    // Convert to string if it's not already
    const dateString = String(dateStr).trim();
    console.log('formatDateForAPI trimmed:', dateString);
    
    // Simple regex to match DD-MM-YYYY format
    const ddMmYyyyRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    const yyyyMmDdRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    
    if (ddMmYyyyRegex.test(dateString)) {
      // DD-MM-YYYY format, convert to YYYY-MM-DD
      const match = dateString.match(ddMmYyyyRegex);
      const result = `${match[3]}-${match[2]}-${match[1]}`;
      console.log('formatDateForAPI DD-MM-YYYY -> YYYY-MM-DD:', result);
      return result;
    } else if (yyyyMmDdRegex.test(dateString)) {
      // Already YYYY-MM-DD format
      console.log('formatDateForAPI already YYYY-MM-DD:', dateString);
      return dateString;
    } else {
      console.log('formatDateForAPI: invalid format, returning original:', dateString);
      return dateString;
    }
  };

  // Test the date conversion function
  const testDateConversion = () => {
    console.log('=== Testing date conversion ===');
    console.log('15-01-2010 ->', formatDateForAPI('15-01-2010')); // Should be 2010-01-15
    console.log('01-06-2024 ->', formatDateForAPI('01-06-2024')); // Should be 2024-06-01
    console.log('2010-01-15 ->', formatDateForAPI('2010-01-15')); // Should be 2010-01-15
    console.log('null ->', formatDateForAPI(null)); // Should be null
    console.log('empty ->', formatDateForAPI('')); // Should be null
    
    // Test with potential CSV data
    console.log('=== Testing with CSV-like data ===');
    console.log('"15-01-2010" ->', formatDateForAPI('"15-01-2010"')); // With quotes
    console.log(' 15-01-2010 ->', formatDateForAPI(' 15-01-2010')); // With leading space
    console.log('15-01-2010  ->', formatDateForAPI('15-01-2010 ')); // With trailing space
    console.log('=== End test ===');
  };
  
  // Run test on component mount
  testDateConversion();
  
  // Test different date formats
  const testDateFormats = () => {
    console.log('=== Testing different date formats ===');
    const testDates = [
      '2010-01-15', // YYYY-MM-DD
      '15-01-2010', // DD-MM-YYYY
      '2010/01/15', // YYYY/MM/DD
      '15/01/2010', // DD/MM/YYYY
      '2010.01.15', // YYYY.MM.DD
      '15.01.2010'  // DD.MM.YYYY
    ];
    
    testDates.forEach(date => {
      console.log(`${date} -> formatDateForAPI -> ${formatDateForAPI(date)}`);
    });
    console.log('=== End date format test ===');
  };
  
  // Run date format test
  testDateFormats();
  
  // Test API call with known good data
  const testAPICall = async () => {
    console.log('=== Testing API call with known good data ===');
    
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    console.log('Authentication token:', token ? 'Present' : 'Not present');
    
    if (!token) {
      console.error('No authentication token found. Please login first.');
      return;
    }
    
    try {
      // First, get available classrooms
      console.log('Fetching available classrooms...');
      const classroomsResponse = await api.get('classrooms/');
      console.log('Available classrooms:', classroomsResponse.data);
      
      // Use the first available classroom
      const availableClassroom = classroomsResponse.data[0];
      if (!availableClassroom) {
        console.error('No classrooms available. Please create a classroom first.');
        return;
      }
      
      // Test with minimal required fields first
      const timestamp = Date.now();
      const minimalPayload = {
        first_name: 'Test',
        last_name: 'Student',
        date_of_birth: '2010-01-15',
        roll_number: `TEST${timestamp}`,
        classroom: availableClassroom.id
      };
      
      console.log('Testing minimal payload first:', minimalPayload);
      try {
        const minimalResponse = await api.post('students/', minimalPayload);
        console.log('Minimal payload successful:', minimalResponse.data);
      } catch (minimalError) {
        console.error('Minimal payload failed:', minimalError.response?.data);
        console.error('Minimal payload error details:', JSON.stringify(minimalError.response?.data, null, 2));
      }
      
      const testPayload = {
        first_name: 'Test',
        last_name: 'Student',
        date_of_birth: '2010-01-15', // YYYY-MM-DD format
        admission_date: '2024-06-01', // YYYY-MM-DD format
        roll_number: `TEST${timestamp + 1}`,
        classroom: availableClassroom.id,
        father_name: 'Test Father',
        contact_email: 'test@example.com',
        contact_phone: '1234567890',
        address: 'Test Address'
      };
      
      console.log('Test payload:', testPayload);
      console.log('Test payload JSON:', JSON.stringify(testPayload));
      
      // Log the exact request being made
      console.log('Making API request to:', '/api/students/');
      console.log('Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.substring(0, 20)}...`
      });
      
      const response = await api.post('students/', testPayload);
      console.log('API call successful:', response.data);
    } catch (error) {
      console.error('API call failed:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      // Log the full error details
      if (error.response?.data) {
        console.error('Full error details:', JSON.stringify(error.response.data, null, 2));
      }
    }
    console.log('=== End API test ===');
  };

  const idForClassNameAndSection = (name, section) => classrooms.find((c) => String(c.name) === String(name) && c.section === section)?.id;

  const ensureClassroomId = async (name, section) => {
    const existingId = idForClassNameAndSection(name, section);
    if (existingId) return existingId;
    // create if missing
    const created = await api.post('classrooms/', { name: String(name), section: section });
    const newList = [created.data, ...classrooms];
    newList.sort((a, b) => {
      const na = Number(a.name); const nb = Number(b.name);
      return (isNaN(na) || isNaN(nb)) ? String(a.name).localeCompare(String(b.name)) : na - nb;
    });
    setClassrooms(newList);
    return created.data.id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const classroomId = await ensureClassroomId(form.classroom, form.section);
      const classroomNumericId = Number(classroomId);
      const payload = { 
        first_name: form.first_name,
        last_name: form.last_name,
        date_of_birth: formatDateForAPI(form.date_of_birth), // Convert DD-MM-YYYY to YYYY-MM-DD for API
        admission_date: formatDateForAPI(form.admission_date), // Convert DD-MM-YYYY to YYYY-MM-DD for API
        roll_number: form.roll_number,
        classroom: classroomNumericId,
        father_name: form.father_name || '',
        contact_email: form.contact_email || '',
        contact_phone: form.contact_phone || '',
        address: form.address || '',
      };
      await api.post('students/', payload);
      navigate('/students');
    } catch (err) {
      const apiMsg = err?.response?.data ? JSON.stringify(err.response.data) : err?.message || 'Unknown error';
      setMessage({ type: 'error', text: `Failed to create student: ${apiMsg}` });
    } finally {
      setSaving(false);
    }
  };

  // Bulk upload functions
  const exportSampleCsv = () => {
    const header = ['first_name', 'last_name', 'date_of_birth', 'admission_date', 'roll_number', 'class', 'section', 'father_name', 'contact_email', 'contact_phone', 'address'];
    const sampleData = [
      'John', 'Doe', '15-01-2010', '01-06-2024', 'A001', '1', 'A', 'John Doe Sr.', 'john.doe@email.com', '+1234567890', '123 Main St, City'
    ];
    const csv = [header.join(','), sampleData.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_bulk_upload_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    setImportResult(null);
    setMessage(null);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log('CSV Parse Results:', results);
        const rows = results.data;
        let created = 0, failed = 0, errors = [];
        
        for (const [index, row] of rows.entries()) {
          console.log(`Processing Row ${index + 2}:`, row);
          console.log(`Row ${index + 2} - Raw CSV data:`, {
            first_name: row.first_name,
            last_name: row.last_name,
            date_of_birth: row.date_of_birth,
            admission_date: row.admission_date,
            roll_number: row.roll_number,
            class: row.class,
            section: row.section
          });
          
          try {
            const classroomName = row.class || row.class_name || row.Class || row.ClassName || '';
            const classroomSection = row.section || row.Section || 'A';
            
            if (!row.first_name || !row.last_name || !row.date_of_birth || !row.roll_number || !classroomName) {
              failed++;
              errors.push(`Row ${index + 2}: Missing required fields`);
              continue;
            }
            
            const classroomId = await ensureClassroomId(classroomName, classroomSection);
            
            // Get raw date values
            const rawDateOfBirth = String(row.date_of_birth || row.dob || row.DOB || '').trim();
            const rawAdmissionDate = String(row.admission_date || '').trim();
            
            console.log(`Row ${index + 2} - Raw dates:`, {
              date_of_birth: rawDateOfBirth,
              admission_date: rawAdmissionDate
            });
            
            // Convert dates - with more detailed logging
            console.log(`Row ${index + 2} - Before conversion:`, {
              rawDateOfBirth,
              rawAdmissionDate,
              rawDateOfBirthType: typeof rawDateOfBirth,
              rawAdmissionDateType: typeof rawAdmissionDate
            });
            
            const convertedDateOfBirth = formatDateForAPI(rawDateOfBirth);
            const convertedAdmissionDate = formatDateForAPI(rawAdmissionDate || null);
            
            console.log(`Row ${index + 2} - After conversion:`, {
              date_of_birth: convertedDateOfBirth,
              admission_date: convertedAdmissionDate,
              dateOfBirthType: typeof convertedDateOfBirth,
              admissionDateType: typeof convertedAdmissionDate
            });
            
            const payload = {
              first_name: String(row.first_name || row.firstname || row.FirstName || '').trim(),
              last_name: String(row.last_name || row.lastname || row.LastName || '').trim(),
              date_of_birth: convertedDateOfBirth,
              admission_date: convertedAdmissionDate,
              roll_number: String(row.roll_number || row.roll || row.Roll || '').trim(),
              classroom: classroomId,
              father_name: String(row.father_name || row.father || '').trim() || '',
              contact_email: String(row.contact_email || row.email || '').trim() || '',
              contact_phone: String(row.contact_phone || row.phone || '').trim() || '',
              address: String(row.address || '').trim() || '',
            };
            
            console.log(`Row ${index + 2} - Full payload:`, payload);
            console.log(`Row ${index + 2} - Payload JSON:`, JSON.stringify(payload));
            console.log(`Row ${index + 2} - Date fields in payload:`, {
              date_of_birth: payload.date_of_birth,
              admission_date: payload.admission_date,
              date_of_birth_type: typeof payload.date_of_birth,
              admission_date_type: typeof payload.admission_date
            });
            
            try {
              const response = await api.post('students/', payload);
              console.log(`Row ${index + 2} - Success:`, response.data);
            } catch (apiError) {
              console.error(`Row ${index + 2} - API Error:`, apiError.response?.data);
              console.error(`Row ${index + 2} - Full Error:`, apiError);
              throw apiError; // Re-throw to be caught by the outer try-catch
            }
            created++;
          } catch (err) {
            failed++;
            const errorMsg = err?.response?.data ? JSON.stringify(err.response.data) : err?.message || 'Unknown error';
            errors.push(`Row ${index + 2}: ${errorMsg}`);
          }
        }
        
        setImportResult({ created, failed, total: rows.length, errors });
        setImporting(false);
        e.target.value = '';
        
        if (created > 0) {
          setMessage({ type: 'success', text: `Successfully imported ${created} students!` });
        }
      },
      error: (error) => {
        setImportResult({ created: 0, failed: 0, total: 0, errors: [`Parse error: ${error.message}`] });
        setImporting(false);
        e.target.value = '';
        setMessage({ type: 'error', text: 'Failed to parse CSV file' });
      }
    });
  };

  const classValues = ['1','2','3','4','5'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center"><UserPlus className="h-7 w-7 mr-3 icon-gradient" />Add New Student</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowBulkUpload(!showBulkUpload)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showBulkUpload 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileText className="h-4 w-4 mr-2 inline" />
            {showBulkUpload ? 'Single Student' : 'Bulk Upload'}
          </button>
          {showBulkUpload && (
            <>
              <button
                onClick={exportSampleCsv}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2 inline" />
                Sample CSV
              </button>
              <button
                onClick={testDateConversion}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Test Date Conversion
              </button>
              <button
                onClick={testAPICall}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Test API Call
              </button>
              <label className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                <input type="file" accept=".csv" onChange={handleBulkUpload} className="hidden" />
                <Upload className="h-4 w-4 mr-2 inline" />
                {importing ? 'Importing...' : 'Import CSV'}
              </label>
            </>
          )}
        </div>
      </div>

      {message && (
        <div className={`rounded-xl p-4 ${message.type==='success' ? 'status-success' : 'status-error'}`}>
          <span className="text-sm break-all">{message.text}</span>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-700 mb-2">
            <strong>Import Results:</strong> {importResult.created} successful, {importResult.failed} failed out of {importResult.total} total rows.
          </div>
          {importResult.errors.length > 0 && (
            <div className="mt-2">
              <details className="text-sm">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                  View Error Details ({importResult.errors.length} errors)
                </summary>
                <div className="mt-2 max-h-40 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-red-600 text-xs mb-1">
                      {error}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Bulk Upload Instructions */}
      {showBulkUpload && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="card-body">
            <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Bulk Upload Instructions
            </h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>CSV Format:</strong> Your CSV file should have the following columns:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code>first_name</code> - Student's first name (required)</li>
                <li><code>last_name</code> - Student's last name (required)</li>
                <li><code>date_of_birth</code> - Date of birth in DD-MM-YYYY format (required)</li>
                <li><code>admission_date</code> - Admission date in DD-MM-YYYY format (optional)</li>
                <li><code>roll_number</code> - Student's roll number (required)</li>
                <li><code>class</code> - Class number (1-5) (required)</li>
                <li><code>section</code> - Section (A, B, C) (optional, defaults to A)</li>
                <li><code>father_name</code> - Father's name (optional)</li>
                <li><code>contact_email</code> - Contact email (optional)</li>
                <li><code>contact_phone</code> - Contact phone (optional)</li>
                <li><code>address</code> - Student's address (optional)</li>
              </ul>
              <p className="mt-3"><strong>Steps:</strong></p>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>Click "Sample CSV" to download a template</li>
                <li>Fill in your student data following the template</li>
                <li>Save as CSV file</li>
                <li>Click "Import CSV" and select your file</li>
                <li>Review the import results</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {!showBulkUpload && (
        <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">First Name</label>
              <input 
                name="first_name" 
                value={form.first_name} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="John" 
                required 
                data-lpignore="true"
                data-form-type="other"
                autocomplete="off"
              />
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input 
                name="last_name" 
                value={form.last_name} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="Doe" 
                required 
                data-lpignore="true"
                data-form-type="other"
                autocomplete="off"
              />
            </div>
            <div>
              <label className="form-label">Date of Birth</label>
              <input 
                type="text" 
                name="date_of_birth" 
                value={form.date_of_birth} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="DD-MM-YYYY"
                required 
                pattern="\d{2}-\d{2}-\d{4}"
                title="Please enter date in DD-MM-YYYY format"
                data-lpignore="true"
                data-form-type="other"
                autocomplete="off"
                data-lastpass-rid=""
                data-1p-ignore=""
              />
              {form.date_of_birth && (
                <p className="text-sm text-gray-600 mt-1">
                  Format: DD-MM-YYYY (e.g., 15-01-2010)
                </p>
              )}
            </div>
                        <div>
              <label className="form-label">Admission Date</label>
              <input
                type="text"
                name="admission_date"
                value={form.admission_date}
                onChange={handleChange}
                className="form-input"
                placeholder="DD-MM-YYYY"
                pattern="\d{2}-\d{2}-\d{4}"
                title="Please enter date in DD-MM-YYYY format"
                data-lpignore="true"
                data-form-type="other"
                autocomplete="off"
                data-lastpass-rid=""
                data-1p-ignore=""
              />
              {form.admission_date && (
                <p className="text-sm text-gray-600 mt-1">
                  Format: DD-MM-YYYY (e.g., 01-06-2024)
                </p>
              )}
            </div>
            <div>
              <label className="form-label">Roll Number</label>
              <input 
                name="roll_number" 
                value={form.roll_number} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="A001" 
                required 
                data-lpignore="true"
                data-form-type="other"
                autocomplete="off"
              />
            </div>
            <div>
              <label className="form-label flex items-center"><Users className="h-4 w-4 mr-2 text-purple-500" />Class</label>
              <select 
                name="classroom" 
                value={form.classroom} 
                onChange={handleChange} 
                className="form-input" 
                required
                data-lpignore="true"
                data-form-type="other"
                autocomplete="off"
              >
                <option value="">Select Class</option>
                {classValues.map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label flex items-center"><Users className="h-4 w-4 mr-2 text-purple-500" />Section</label>
              <select 
                name="section" 
                value={form.section} 
                onChange={handleChange} 
                className="form-input" 
                required
                data-lpignore="true"
                data-form-type="other"
                autocomplete="off"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
            <div>
              <label className="form-label">Father's Name</label>
              <input 
                name="father_name" 
                value={form.father_name} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="Father's full name" 
                data-lpignore="true"
                data-form-type="other"
                autocomplete="off"
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input 
                type="email" 
                name="contact_email" 
                value={form.contact_email} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="parent@example.com" 
                data-lpignore="true"
                data-form-type="other"
                autocomplete="off"
              />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input 
                name="contact_phone" 
                value={form.contact_phone} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="+1 555 123 4567" 
                data-lpignore="true"
                data-form-type="other"
                autocomplete="off"
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Address</label>
              <textarea 
                name="address" 
                value={form.address} 
                onChange={handleChange} 
                className="form-input" 
                rows={3} 
                placeholder="Street, City" 
                data-lpignore="true"
                data-form-type="other"
                autocomplete="off"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              {saving ? (<span className="flex items-center"><span className="loading-spinner h-5 w-5 mr-2"></span>Saving...</span>) : (<span className="flex items-center"><Save className="h-4 w-4 mr-2"/>Save Student</span>)}
            </button>
          </div>
        </div>
        </form>
      )}
    </div>
  );
}
