import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Activity, 
  CheckCircle, 
  Clock,
  BarChart3,
  AlertCircle,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [stats, setStats] = useState({
    documentsProcessed: 42,
    successRate: 95.2,
    averageExecutionTime: 1.3,
    activeProcesses: 3
  });

  const [recentDocuments, setRecentDocuments] = useState([
    {
      id: 1,
      name: 'nginx-troubleshooting.md',
      status: 'completed',
      timestamp: '2 minutes ago',
      stages: 4
    },
    {
      id: 2,
      name: 'database-connection.md',
      status: 'processing',
      timestamp: '5 minutes ago',
      stages: 2
    },
    {
      id: 3,
      name: 'ssl-certificate-renewal.md',
      status: 'completed',
      timestamp: '1 hour ago',
      stages: 4
    }
  ]);

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 card-hover">
      <div className="flex items-center">
        <div className={`p-2 bg-${color}-100 rounded-lg`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-100';
      case 'processing':
        return 'text-blue-700 bg-blue-100';
      case 'error':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor your ENTRAN pipeline performance and manage troubleshooting documents
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Documents Processed"
          value={stats.documentsProcessed}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Avg Execution Time"
          value={`${stats.averageExecutionTime}s`}
          icon={Zap}
          color="yellow"
        />
        <StatCard
          title="Active Processes"
          value={stats.activeProcesses}
          icon={Activity}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/editor"
                className="flex items-center p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors group"
              >
                <Upload className="h-5 w-5 text-primary-600 mr-3" />
                <div>
                  <p className="font-medium text-primary-900">Upload Document</p>
                  <p className="text-sm text-primary-600">Start a new troubleshooting workflow</p>
                </div>
              </Link>

              <Link
                to="/stages"
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <BarChart3 className="h-5 w-5 text-gray-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">View Pipeline</p>
                  <p className="text-sm text-gray-600">Monitor compilation stages</p>
                </div>
              </Link>

              <Link
                to="/execution"
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <Activity className="h-5 w-5 text-gray-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Execution Monitor</p>
                  <p className="text-sm text-gray-600">Debug and control execution</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
              <Link 
                to="/editor" 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    {getStatusIcon(doc.status)}
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-600">
                        {doc.stages} stages • {doc.timestamp}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="mt-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { stage: 'Lexical Analysis', status: 'healthy', count: 156 },
              { stage: 'Transpilation', status: 'healthy', count: 142 },
              { stage: 'Semantic Analysis', status: 'healthy', count: 139 },
              { stage: 'Execution', status: 'warning', count: 134 }
            ].map((item) => (
              <div key={item.stage} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                  item.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <p className="font-medium text-gray-900">{item.stage}</p>
                <p className="text-sm text-gray-600">{item.count} processed</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
