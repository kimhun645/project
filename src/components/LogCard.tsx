import React from "react";
import { LogEntry } from "../utils/logEvent";
import { 
  Shield, 
  User, 
  Settings, 
  Package, 
  Bug, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Clock,
  User as UserIcon,
  Tag,
  Activity
} from "lucide-react";

interface Props {
  log: any;
  onExpand?: (log: any) => void;
}

const LogCard: React.FC<Props> = ({ log, onExpand }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case "AUTH": return <Shield className="h-4 w-4" />;
      case "USER": return <User className="h-4 w-4" />;
      case "SYSTEM": return <Settings className="h-4 w-4" />;
      case "INVENTORY": return <Package className="h-4 w-4" />;
      case "DEBUG": return <Bug className="h-4 w-4" />;
      case "SECURITY": return <Shield className="h-4 w-4" />;
      case "PERFORMANCE": return <Activity className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "ERROR": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "WARN": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "SUCCESS": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "DEBUG": return <Bug className="h-4 w-4 text-purple-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getColor = (level: string) => {
    switch (level) {
      case "ERROR": return "border-red-500 bg-red-50 text-red-800";
      case "WARN": return "border-yellow-400 bg-yellow-50 text-yellow-800";
      case "SUCCESS": return "border-green-400 bg-green-50 text-green-800";
      case "DEBUG": return "border-purple-400 bg-purple-50 text-purple-800";
      default: return "border-blue-400 bg-blue-50 text-blue-800";
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Pending...";
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString('th-TH');
      }
      return new Date(timestamp).toLocaleString('th-TH');
    } catch {
      return "Invalid date";
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return null;
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  return (
    <div className={`border-l-4 ${getColor(log.level)} bg-white shadow-sm hover:shadow-md transition-shadow p-4 rounded-lg mb-3`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {getIcon(log.type)}
          <h3 className="font-semibold text-lg">{log.type}</h3>
          <span className="text-sm text-gray-600">—</span>
          <span className="font-medium">{log.action}</span>
          {getLevelIcon(log.level)}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>{formatTimestamp(log.timestamp)}</span>
        </div>
      </div>

      <p className="text-gray-700 mb-3">{log.message}</p>

      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <UserIcon className="h-3 w-3" />
          <span>{log.userName || log.userId || "Anonymous"}</span>
        </div>
        
        {log.resource && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Tag className="h-3 w-3" />
            <span>{log.resource}</span>
          </div>
        )}

        {log.duration && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Activity className="h-3 w-3" />
            <span>{formatDuration(log.duration)}</span>
          </div>
        )}

        {log.tags && log.tags.length > 0 && (
          <div className="flex items-center gap-1 text-sm">
            {log.tags.map((tag: string, index: number) => (
              <span key={index} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {log.data && (
        <div className="mt-3">
          <button
            onClick={() => onExpand?.(log)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {log.expanded ? "ซ่อน" : "ดู"} ข้อมูลเพิ่มเติม
          </button>
          
          {log.expanded && (
            <pre className="bg-gray-100 text-sm mt-2 p-3 rounded border overflow-x-auto">
              {JSON.stringify(log.data, null, 2)}
            </pre>
          )}
        </div>
      )}

      {log.sessionId && (
        <div className="text-xs text-gray-500 mt-2">
          Session: {log.sessionId}
        </div>
      )}
    </div>
  );
};

export default LogCard;
