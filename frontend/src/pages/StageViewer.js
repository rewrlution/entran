import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Code,
  Brain,
  Play,
  ArrowRight,
  Zap
} from 'lucide-react';

function StageViewer() {
  const [selectedStage, setSelectedStage] = useState(0);
  const [stageData, setStageData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const stages = [
    {
      id: 0,
      name: 'Lexical Analysis',
      description: 'Parse markdown and create AST',
      icon: FileText,
      status: 'completed',
      color: 'green'
    },
    {
      id: 1,
      name: 'Transpilation',
      description: 'Convert AST to executable program',
      icon: Code,
      status: 'completed',
      color: 'blue'
    },
    {
      id: 2,
      name: 'Semantic Analysis',
      description: 'Extract intent and entities',
      icon: Brain,
      status: 'completed',
      color: 'purple'
    },
    {
      id: 3,
      name: 'Execution',
      description: 'Execute program with debugger',
      icon: Play,
      status: 'idle',
      color: 'gray'
    }
  ];

  const sampleData = {
    0: {
      input: {
        type: 'markdown',
        content: '# Network Troubleshooting\n\n## Steps\n1. Check connectivity\n2. Verify configuration',
        size: '2.1 KB'
      },
      output: {
        type: 'ast',
        nodes: 8,
        structure: {
          title: 'Network Troubleshooting',
          sections: 2,
          steps: 2
        }
      },
      metrics: {
        processingTime: '45ms',
        memoryUsage: '1.2MB',
        nodeCount: 8
      }
    },
    1: {
      input: {
        type: 'ast',
        nodes: 8,
        complexity: 'medium'
      },
      output: {
        type: 'program',
        procedures: 3,
        commands: 12,
        tools: ['ping', 'curl', 'netstat']
      },
      metrics: {
        processingTime: '120ms',
        memoryUsage: '2.1MB',
        optimization: '87%'
      }
    },
    2: {
      input: {
        type: 'program',
        procedures: 3,
        commands: 12
      },
      output: {
        type: 'analysis',
        intent: 'network_diagnostics',
        entities: {
          ips: ['192.168.1.1'],
          services: ['nginx'],
          files: ['/etc/hosts']
        },
        confidence: 0.92
      },
      metrics: {
        processingTime: '89ms',
        memoryUsage: '1.8MB',
        accuracy: '92%'
      }
    },
    3: {
      input: {
        type: 'analysis',
        procedures: 3,
        debugMode: true
      },
      output: {
        type: 'execution',
        status: 'ready',
        environment: 'sandbox',
        safety: 'enabled'
      },
      metrics: {
        processingTime: 'N/A',
        memoryUsage: '3.2MB',
        uptime: '0s'
      }
    }
  };

  useEffect(() => {
    // Simulate loading stage data
    setIsLoading(true);
    setTimeout(() => {
      setStageData(sampleData[selectedStage]);
      setIsLoading(false);
    }, 300);
  }, [selectedStage]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStageColor = (color, selected) => {
    const colors = {
      green: selected ? 'bg-green-100 border-green-300 text-green-800' : 'bg-green-50 border-green-200 text-green-700',
      blue: selected ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-blue-50 border-blue-200 text-blue-700',
      purple: selected ? 'bg-purple-100 border-purple-300 text-purple-800' : 'bg-purple-50 border-purple-200 text-purple-700',
      gray: selected ? 'bg-gray-100 border-gray-300 text-gray-800' : 'bg-gray-50 border-gray-200 text-gray-700'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline Stages</h1>
        <p className="text-gray-600">Monitor the 4-stage compilation pipeline</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Stage Navigation */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Compilation Stages</h2>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Pipeline Progress</span>
                <span>75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full progress-bar" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div className="space-y-3">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                const isSelected = selectedStage === stage.id;
                
                return (
                  <div key={stage.id}>
                    <button
                      onClick={() => setSelectedStage(stage.id)}
                      className={`
                        w-full text-left p-4 rounded-lg border-2 transition-all
                        ${getStageColor(stage.color, isSelected)}
                        hover:shadow-md
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Icon className="h-5 w-5 mr-3" />
                          <div>
                            <p className="font-medium">{stage.name}</p>
                            <p className="text-sm opacity-75">{stage.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {getStatusIcon(stage.status)}
                          {isSelected && <ChevronRight className="h-4 w-4 ml-2" />}
                        </div>
                      </div>
                    </button>

                    {/* Flow Arrow */}
                    {index < stages.length - 1 && (
                      <div className="flex justify-center py-2">
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stage Details */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="loading-spinner"></div>
                <span className="ml-3 text-gray-600">Loading stage data...</span>
              </div>
            ) : stageData ? (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {stages[selectedStage].name}
                  </h2>
                  <p className="text-gray-600">{stages[selectedStage].description}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Input */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                      <ArrowRight className="h-5 w-5 mr-2 rotate-180" />
                      Input
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-white rounded p-3">
                        <p className="text-sm font-medium text-gray-900">Type</p>
                        <p className="text-gray-600 capitalize">{stageData.input.type}</p>
                      </div>
                      {Object.entries(stageData.input).filter(([key]) => key !== 'type').map(([key, value]) => (
                        <div key={key} className="bg-white rounded p-3">
                          <p className="text-sm font-medium text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-gray-600">{typeof value === 'object' ? JSON.stringify(value) : value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Output */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                      <ArrowRight className="h-5 w-5 mr-2" />
                      Output
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-white rounded p-3">
                        <p className="text-sm font-medium text-gray-900">Type</p>
                        <p className="text-gray-600 capitalize">{stageData.output.type}</p>
                      </div>
                      {Object.entries(stageData.output).filter(([key]) => key !== 'type').map(([key, value]) => (
                        <div key={key} className="bg-white rounded p-3">
                          <p className="text-sm font-medium text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-gray-600">
                            {typeof value === 'object' ? (
                              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            ) : value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Performance Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(stageData.metrics).map(([key, value]) => (
                      <div key={key} className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-sm font-medium text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stage-specific Actions */}
                <div className="mt-6 flex space-x-3">
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                    Reprocess Stage
                  </button>
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                    View Raw Data
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                    Export Results
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-12">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a stage to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StageViewer;
