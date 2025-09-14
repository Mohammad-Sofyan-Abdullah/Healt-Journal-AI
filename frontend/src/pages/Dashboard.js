import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  AlertTriangle,
  Clock,
  Activity,
  Droplets,
  Heart,
  Moon,
  Smile,
} from 'lucide-react';
import { dashboardAPI, aiAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await dashboardAPI.getSummary();
      if (!data.has_logs) {
        toast.info('No health logs found. Start logging your health data!');
      }
      setDashboardData(data);
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error(error.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAIAnalysis = async () => {
    setAiAnalyzing(true);
    try {
      await aiAPI.analyze();
      toast.success('AI analysis completed!');
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to generate AI analysis');
    } finally {
      setAiAnalyzing(false);
    }
  };

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

  const getMetricIcon = (metric) => {
    switch (metric) {
      case 'sleep':
        return <Moon className="w-5 h-5 text-health-sleep" />;
      case 'steps':
        return <Activity className="w-5 h-5 text-health-steps" />;
      case 'water':
        return <Droplets className="w-5 h-5 text-health-water" />;
      case 'mood':
        return <Smile className="w-5 h-5 text-health-mood" />;
      case 'heart_rate':
        return <Heart className="w-5 h-5 text-health-heart" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Track your health journey and get AI-powered insights
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/logs"
          className="health-card hover:shadow-lg transition-all duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors duration-200">
              <Plus className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Add Health Log</h3>
              <p className="text-sm text-gray-600">Record today's health data</p>
            </div>
          </div>
        </Link>

        <button
          onClick={handleAIAnalysis}
          disabled={aiAnalyzing}
          className="health-card hover:shadow-lg transition-all duration-200 group disabled:opacity-50"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-200">
              {aiAnalyzing ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              ) : (
                <Brain className="w-6 h-6 text-purple-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Analysis</h3>
              <p className="text-sm text-gray-600">
                {aiAnalyzing ? 'Analyzing...' : 'Get personalized insights'}
              </p>
            </div>
          </div>
        </button>

        <Link
          to="/analytics"
          className="health-card hover:shadow-lg transition-all duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">View Analytics</h3>
              <p className="text-sm text-gray-600">See your health trends</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Health Data + AI Insights */}
      {dashboardData?.recent_logs && dashboardData.recent_logs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Logs */}
          <div className="health-card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Health Data</h2>
            <div className="space-y-4">
              {dashboardData.recent_logs.slice(0, 3).map((log, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(log.date), 'MMM dd, yyyy')}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        {log.sleep_hours && (
                          <span className="flex items-center space-x-1">
                            <Moon className="w-3 h-3" />
                            <span>{log.sleep_hours}h sleep</span>
                          </span>
                        )}
                        {log.steps && (
                          <span className="flex items-center space-x-1">
                            <Activity className="w-3 h-3" />
                            <span>{log.steps.toLocaleString()} steps</span>
                          </span>
                        )}
                        {log.mood && (
                          <span className="flex items-center space-x-1">
                            <Smile className="w-3 h-3" />
                            <span>Mood: {log.mood}/10</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/logs"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="health-card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">AI Insights</h2>
            {dashboardData.latest_insight ? (
              <div className="prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {dashboardData.latest_insight.content}
                </ReactMarkdown>
                <p className="text-xs text-gray-500 mt-2">
                  {format(new Date(dashboardData.latest_insight.date), 'MMM dd, yyyy')}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No AI insights yet</p>
                <button
                  onClick={handleAIAnalysis}
                  disabled={aiAnalyzing}
                  className="btn-primary"
                >
                  {aiAnalyzing ? 'Analyzing...' : 'Generate Insights'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Health Metrics Overview */}
      {dashboardData?.analytics_summary?.metrics && (
        <div className="health-card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Health Metrics Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(dashboardData.analytics_summary.metrics).map(([metric, data]) => (
              <div key={metric} className="health-metric">
                <div className="flex items-center space-x-3">
                  {getMetricIcon(metric)}
                  <div>
                    <p className="text-sm font-medium text-gray-600 capitalize">
                      {metric.replace('_', ' ')}
                    </p>
                    <p className="health-metric-value">
                      {metric === 'sleep'
                        ? `${data.average}h`
                        : metric === 'steps'
                        ? data.average.toLocaleString()
                        : metric === 'water_intake'
                        ? `${data.average}L`
                        : metric === 'heart_rate'
                        ? `${data.average} bpm`
                        : `${data.average}/10`}
                    </p>
                  </div>
                </div>
                {dashboardData.analytics_summary.trends[metric] && (
                  <div
                    className={`flex items-center space-x-1 ${getTrendColor(
                      dashboardData.analytics_summary.trends[metric].direction
                    )}`}
                  >
                    {getTrendIcon(dashboardData.analytics_summary.trends[metric].direction)}
                    <span className="text-xs font-medium">
                      {dashboardData.analytics_summary.trends[metric].direction}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalies Alert */}
      {dashboardData?.analytics_summary?.anomalies_count > 0 && (
        <div className="anomaly-card mb-8">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Health Anomalies Detected</h3>
              <p className="text-sm text-red-700">
                {dashboardData.analytics_summary.anomalies_count} unusual patterns found in your
                recent data.
                <Link to="/analytics" className="ml-2 underline hover:no-underline">
                  View details
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!dashboardData?.recent_logs || dashboardData.recent_logs.length === 0) && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="w-12 h-12 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Your Health Journey</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Begin tracking your health data to get personalized insights and recommendations.
          </p>
          <Link to="/logs" className="btn-primary">
            Add Your First Health Log
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
