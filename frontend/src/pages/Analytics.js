import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  BarChart3,
  Filter
} from 'lucide-react';
import { analyticsAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('sleep_hours');
  const [timeRange, setTimeRange] = useState(30);

  const metrics = [
    { key: 'sleep_hours', label: 'Sleep Hours', color: '#8b5cf6', unit: 'hours' },
    { key: 'steps', label: 'Steps', color: '#10b981', unit: 'steps' },
    { key: 'mood', label: 'Mood', color: '#f59e0b', unit: '/10' },
    { key: 'energy_level', label: 'Energy Level', color: '#06b6d4', unit: '/10' },
    { key: 'water_intake_liters', label: 'Water Intake', color: '#3b82f6', unit: 'L' },
    { key: 'heart_rate_avg', label: 'Heart Rate', color: '#ef4444', unit: 'bpm' },
    { key: 'stress_level', label: 'Stress Level', color: '#f97316', unit: '/10' }
  ];

  // ✅ useCallback ensures function references are stable
  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await analyticsAPI.getAnalytics(timeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Analytics error:', error);
      let errorMessage = 'Failed to load analytics data';
      if (error.message === 'Network Error') {
        errorMessage = 'Cannot connect to the server. Please check if the backend is running.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection and ensure the backend server is running.';
      }
      toast.error(errorMessage);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const loadChartData = useCallback(async (metric) => {
    try {
      const data = await analyticsAPI.getChartData(metric, timeRange);
      if (data.message) {
        toast.info(data.message);
      }
      setChartData(prev => ({
        ...prev,
        [metric]: data
      }));
    } catch (error) {
      console.error('Chart data error:', error);
      toast.error(error.response?.data?.detail || 'Failed to load chart data');
      setChartData(prev => ({
        ...prev,
        [metric]: { dates: [], values: [] }
      }));
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  useEffect(() => {
    if (selectedMetric) {
      loadChartData(selectedMetric);
    }
  }, [selectedMetric, timeRange, loadChartData]);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600';
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatChartData = (data) => {
    if (!data || !data.dates || !data.values) return [];
    
    return data.dates.map((date, index) => ({
      date: format(new Date(date), 'MMM dd'),
      value: data.values[index]
    }));
  };

  const getAnomalySeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'anomaly-high';
      case 'medium':
        return 'anomaly-medium';
      default:
        return 'anomaly-card';
    }
  };

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Health Data Available</h3>
      <p className="text-gray-600 mb-6">
        Start logging your health data to see analytics and trends.
      </p>
      <Link to="/logs" className="btn-primary">
        Add Health Log
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading your health analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData?.metrics || Object.keys(analyticsData.metrics).length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-gray-600">
            View insights and trends from your health data
          </p>
        </div>
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-gray-600">
            Analyze your health trends and patterns
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              className="input-field w-32"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      {analyticsData?.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(analyticsData.metrics).map(([metric, data]) => {
            const metricInfo = metrics.find(m => m.key === metric);
            if (!metricInfo) return null;

            return (
              <div key={metric} className="health-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {metricInfo.label}
                  </h3>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: metricInfo.color }}
                  ></div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {metric === 'sleep_hours' ? `${data.average}h` :
                       metric === 'steps' ? data.average.toLocaleString() :
                       metric === 'water_intake_liters' ? `${data.average}L` :
                       metric === 'heart_rate_avg' ? `${data.average} bpm` :
                       `${data.average}/10`}
                    </p>
                    <p className="text-sm text-gray-600">Average</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Min</p>
                      <p className="font-semibold text-gray-900">
                        {metric === 'sleep_hours' ? `${data.min}h` :
                         metric === 'steps' ? data.min.toLocaleString() :
                         metric === 'water_intake_liters' ? `${data.min}L` :
                         metric === 'heart_rate_avg' ? `${data.min} bpm` :
                         `${data.min}/10`}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Max</p>
                      <p className="font-semibold text-gray-900">
                        {metric === 'sleep_hours' ? `${data.max}h` :
                         metric === 'steps' ? data.max.toLocaleString() :
                         metric === 'water_intake_liters' ? `${data.max}L` :
                         metric === 'heart_rate_avg' ? `${data.max} bpm` :
                         `${data.max}/10`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trends */}
      {analyticsData?.trends && Object.keys(analyticsData.trends).length > 0 && (
        <div className="health-card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Health Trends</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analyticsData.trends).map(([metric, trend]) => {
              const metricInfo = metrics.find(m => m.key === metric);
              if (!metricInfo) return null;

              return (
                <div key={metric} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {metricInfo.label}
                    </p>
                    <p className={`text-sm ${getTrendColor(trend.direction)}`}>
                      {trend.direction} trend
                    </p>
                  </div>
                  <div className={`flex items-center space-x-1 ${getTrendColor(trend.direction)}`}>
                    {getTrendIcon(trend.direction)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="health-card mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Trend Analysis</h2>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="input-field w-48"
          >
            {metrics.map(metric => (
              <option key={metric.key} value={metric.key}>
                {metric.label}
              </option>
            ))}
          </select>
        </div>

        <div className="h-80">
          {chartData[selectedMetric] && chartData[selectedMetric].dates && chartData[selectedMetric].dates.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formatChartData(chartData[selectedMetric])}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={metrics.find(m => m.key === selectedMetric)?.color || '#3b82f6'}
                  strokeWidth={2}
                  dot={{ fill: metrics.find(m => m.key === selectedMetric)?.color || '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                <p>No data available for the selected metric</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Anomalies */}
      {analyticsData?.anomalies && analyticsData.anomalies.length > 0 && (
        <div className="health-card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Health Anomalies</span>
          </h2>
          <div className="space-y-4">
            {analyticsData.anomalies.map((anomaly, index) => (
              <div key={index} className={`anomaly-card ${getAnomalySeverityColor(anomaly.severity)}`}>
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-red-800">
                        {anomaly.type.replace('_', ' ').toUpperCase()}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        anomaly.severity === 'high' 
                          ? 'bg-red-200 text-red-800' 
                          : 'bg-yellow-200 text-yellow-800'
                      }`}>
                        {anomaly.severity}
                      </span>
                    </div>
                    <p className="text-sm text-red-700 mb-2">
                      {anomaly.description}
                    </p>
                    <p className="text-xs text-red-600">
                      {format(new Date(anomaly.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!analyticsData || Object.keys(analyticsData.metrics || {}).length === 0) && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-12 h-12 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start logging your health data to see analytics and trends.
          </p>
        </div>
      )}
    </div>
  );
};

export default Analytics;
