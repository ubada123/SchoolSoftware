import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { UserPlus, Users, Save } from 'lucide-react';

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
    contact_email: '',
    contact_phone: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

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

  const idForClassName = (name) => classrooms.find((c) => String(c.name) === String(name))?.id;

  const ensureClassroomId = async (name) => {
    const existingId = idForClassName(name);
    if (existingId) return existingId;
    // create if missing
    const created = await api.post('classrooms/', { name: String(name), section: '' });
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
      const classroomId = await ensureClassroomId(form.classroom);
      const classroomNumericId = Number(classroomId);
      const payload = { 
        first_name: form.first_name,
        last_name: form.last_name,
        date_of_birth: form.date_of_birth, // YYYY-MM-DD from input[type=date]
        admission_date: form.admission_date, // YYYY-MM-DD from input[type=date]
        roll_number: form.roll_number,
        classroom: classroomNumericId,
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

  const classValues = ['1','2','3','4','5'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center"><UserPlus className="h-7 w-7 mr-3 icon-gradient" />Add New Student</h1>
      </div>

      {message && (
        <div className={`rounded-xl p-4 ${message.type==='success' ? 'status-success' : 'status-error'}`}>
          <span className="text-sm break-all">{message.text}</span>
        </div>
      )}

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
                type="date" 
                name="date_of_birth" 
                value={form.date_of_birth} 
                onChange={handleChange} 
                onClick={handleDateClick}
                className="form-input relative z-10" 
                required 
                style={{ 
                  position: 'relative', 
                  zIndex: 10,
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none'
                }}
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
                data-lpignore="true"
                data-form-type="other"
                autocomplete="off"
                data-lastpass-rid=""
                data-1p-ignore=""
              />
              {form.date_of_birth && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {new Date(form.date_of_birth).toLocaleDateString()}
                </p>
              )}
            </div>
            <div>
              <label className="form-label">Admission Date</label>
              <input 
                type="date" 
                name="admission_date" 
                value={form.admission_date} 
                onChange={handleChange} 
                onClick={handleDateClick}
                className="form-input relative z-10" 
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
              {form.admission_date && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {new Date(form.admission_date).toLocaleDateString()}
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
    </div>
  );
}
