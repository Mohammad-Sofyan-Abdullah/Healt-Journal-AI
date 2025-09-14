import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Moon,
  Activity,
  Droplets,
  Heart,
  Smile,
  AlertCircle,
  Save,
  X
} from 'lucide-react';
import { healthLogsAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const HealthLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [formData, setFormData] = useState({
    sleep_hours: '',
    sleep_quality: '',
    steps: '',
    heart_rate_avg: '',
    heart_rate_max: '',
    water_intake_liters: '',
    calories_consumed: '',
    symptoms: [],
    pain_level: '',
    mood: '',
    energy_level: '',
    stress_level: '',
    exercise_minutes: '',
    notes: ''
  });

  const commonSymptoms = [
    'Headache', 'Fatigue', 'Nausea', 'Dizziness', 'Chest pain',
    'Shortness of breath', 'Muscle pain', 'Joint pain', 'Fever',
    'Cough', 'Sore throat', 'Runny nose', 'Stomach ache', 'Back pain'
  ];

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await healthLogsAPI.getAll();
      setLogs(data);
    } catch (error) {
      toast.error('Failed to load health logs');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSymptomToggle = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert empty strings to null for numeric fields
    const processedData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        value === '' ? null : 
        ['sleep_hours', 'sleep_quality', 'steps', 'heart_rate_avg', 'heart_rate_max', 
         'water_intake_liters', 'calories_consumed', 'pain_level', 'mood', 
         'energy_level', 'stress_level', 'exercise_minutes'].includes(key) 
          ? parseFloat(value) || null 
          : value
      ])
    );

    try {
      if (editingLog) {
        await healthLogsAPI.update(editingLog.id, processedData);
        toast.success('Health log updated successfully');
      } else {
        await healthLogsAPI.create(processedData);
        toast.success('Health log created successfully');
      }
      
      resetForm();
      loadLogs();
    } catch (error) {
      toast.error('Failed to save health log');
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setFormData({
      sleep_hours: log.sleep_hours || '',
      sleep_quality: log.sleep_quality || '',
      steps: log.steps || '',
      heart_rate_avg: log.heart_rate_avg || '',
      heart_rate_max: log.heart_rate_max || '',
      water_intake_liters: log.water_intake_liters || '',
      calories_consumed: log.calories_consumed || '',
      symptoms: log.symptoms || [],
      pain_level: log.pain_level || '',
      mood: log.mood || '',
      energy_level: log.energy_level || '',
      stress_level: log.stress_level || '',
      exercise_minutes: log.exercise_minutes || '',
      notes: log.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (logId) => {
    if (window.confirm('Are you sure you want to delete this health log?')) {
      try {
        await healthLogsAPI.delete(logId);
        toast.success('Health log deleted successfully');
        loadLogs();
      } catch (error) {
        toast.error('Failed to delete health log');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      sleep_hours: '',
      sleep_quality: '',
      steps: '',
      heart_rate_avg: '',
      heart_rate_max: '',
      water_intake_liters: '',
      calories_consumed: '',
      symptoms: [],
      pain_level: '',
      mood: '',
      energy_level: '',
      stress_level: '',
      exercise_minutes: '',
      notes: ''
    });
    setEditingLog(null);
    setShowForm(false);
  };

  const getMetricIcon = (metric, value) => {
    const icons = {
      sleep_hours: <Moon className="w-4 h-4 text-health-sleep" />,
      steps: <Activity className="w-4 h-4 text-health-steps" />,
      water_intake_liters: <Droplets className="w-4 h-4 text-health-water" />,
      heart_rate_avg: <Heart className="w-4 h-4 text-health-heart" />,
      mood: <Smile className="w-4 h-4 text-health-mood" />
    };
    return icons[metric] || <Activity className="w-4 h-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Logs</h1>
          <p className="mt-2 text-gray-600">
            Track your daily health metrics and symptoms
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Log</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingLog ? 'Edit Health Log' : 'Add Health Log'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Sleep Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <Moon className="w-5 h-5 text-health-sleep" />
                  <span>Sleep</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Sleep Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      name="sleep_hours"
                      value={formData.sleep_hours}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="e.g., 7.5"
                    />
                  </div>
                  <div>
                    <label className="form-label">Sleep Quality (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      name="sleep_quality"
                      value={formData.sleep_quality}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="e.g., 8"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Activity */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-health-steps" />
                  <span>Physical Activity</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Steps</label>
                    <input
                      type="number"
                      name="steps"
                      value={formData.steps}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="e.g., 8500"
                    />
                  </div>
                  <div>
                    <label className="form-label">Exercise (minutes)</label>
                    <input
                      type="number"
                      name="exercise_minutes"
                      value={formData.exercise_minutes}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="e.g., 30"
                    />
                  </div>
                  <div>
                    <label className="form-label">Avg Heart Rate</label>
                    <input
                      type="number"
                      name="heart_rate_avg"
                      value={formData.heart_rate_avg}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="e.g., 72"
                    />
                  </div>
                </div>
              </div>

              {/* Nutrition */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <Droplets className="w-5 h-5 text-health-water" />
                  <span>Nutrition</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Water Intake (liters)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="water_intake_liters"
                      value={formData.water_intake_liters}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="e.g., 2.5"
                    />
                  </div>
                  <div>
                    <label className="form-label">Calories Consumed</label>
                    <input
                      type="number"
                      name="calories_consumed"
                      value={formData.calories_consumed}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="e.g., 2000"
                    />
                  </div>
                </div>
              </div>

              {/* Mood & Energy */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <Smile className="w-5 h-5 text-health-mood" />
                  <span>Mood & Energy</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Mood (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      name="mood"
                      value={formData.mood}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="e.g., 7"
                    />
                  </div>
                  <div>
                    <label className="form-label">Energy Level (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      name="energy_level"
                      value={formData.energy_level}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="e.g., 6"
                    />
                  </div>
                  <div>
                    <label className="form-label">Stress Level (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      name="stress_level"
                      value={formData.stress_level}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="e.g., 4"
                    />
                  </div>
                </div>
              </div>

              {/* Symptoms */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span>Symptoms</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commonSymptoms.map(symptom => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => handleSymptomToggle(symptom)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        formData.symptoms.includes(symptom)
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="input-field"
                  placeholder="Any additional notes about your health today..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingLog ? 'Update' : 'Save'} Log</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Health Logs List */}
      {logs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-12 h-12 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Health Logs Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start tracking your health by adding your first log entry.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            Add Your First Log
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {logs.map((log) => (
            <div key={log.id} className="health-card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {format(new Date(log.date), 'EEEE, MMMM dd, yyyy')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {format(new Date(log.date), 'h:mm a')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(log)}
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(log).map(([key, value]) => {
                  if (['id', 'user_id', 'date', 'notes'].includes(key) || !value) return null;
                  
                  if (key === 'symptoms' && value.length > 0) {
                    return (
                      <div key={key} className="col-span-full">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-gray-700">Symptoms</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {value.map((symptom, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                            >
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={key} className="health-metric">
                      <div className="flex items-center space-x-2">
                        {getMetricIcon(key, value)}
                        <div>
                          <p className="text-xs text-gray-500 capitalize">
                            {key.replace('_', ' ')}
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {key === 'sleep_hours' ? `${value}h` :
                             key === 'water_intake_liters' ? `${value}L` :
                             key === 'heart_rate_avg' ? `${value} bpm` :
                             key === 'steps' ? value.toLocaleString() :
                             key.includes('level') || key === 'mood' || key === 'sleep_quality' ? `${value}/10` :
                             value}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {log.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{log.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthLogs;
