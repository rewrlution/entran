import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Code2,
  FileText,
  Layers,
  Play,
  Home,
  Github,
  Settings,
  Zap,
} from "lucide-react";

function Layout({ children }) {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Demo", href: "/demo", icon: Zap },
    { name: "Document Editor", href: "/editor", icon: FileText },
    { name: "Stage Viewer", href: "/stages", icon: Layers },
    { name: "Execution Monitor", href: "/execution", icon: Play },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Code2 className="h-8 w-8 text-primary-600 mr-2" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">ENTRAN</h1>
                <p className="text-xs text-gray-500">
                  English as Programming Language
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Github className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm h-screen sticky top-0">
          <div className="p-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${
                        isActive(item.href)
                          ? "bg-primary-100 text-primary-700 border-r-2 border-primary-500"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <Icon
                      className={`
                        mr-3 h-5 w-5 transition-colors
                        ${
                          isActive(item.href)
                            ? "text-primary-500"
                            : "text-gray-400 group-hover:text-gray-500"
                        }
                      `}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Stage Progress Indicator */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Pipeline Status
              </h3>
              <div className="space-y-2">
                {[
                  { name: "Lexical Analysis", status: "completed" },
                  { name: "Transpilation", status: "completed" },
                  { name: "Semantic Analysis", status: "completed" },
                  { name: "Execution", status: "idle" },
                ].map((stage, index) => (
                  <div key={stage.name} className="flex items-center">
                    <div
                      className={`
                        w-2 h-2 rounded-full mr-2
                        ${
                          stage.status === "completed"
                            ? "bg-green-500"
                            : stage.status === "active"
                            ? "bg-blue-500"
                            : stage.status === "error"
                            ? "bg-red-500"
                            : "bg-gray-300"
                        }
                      `}
                    />
                    <span className="text-xs text-gray-600">{stage.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
