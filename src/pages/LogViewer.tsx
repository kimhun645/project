import React, { useEffect, useState, useCallback } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, orderBy, query, where, limit } from "firebase/firestore";
import LogCard from "../components/LogCard";
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Trash2, 
  Settings,
  Eye,
  EyeOff,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  Bug
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Real-time subscription
  useEffect(() => {
    if (!autoRefresh) return;

    let q = query(
      collection(db, "logs"), 
      orderBy("timestamp", "desc"),
      limit(100)
    );

    // Apply type filter
    if (filter !== "ALL") {
      q = query(q, where("type", "==", filter));
    }

    // Apply level filter
    if (levelFilter !== "ALL") {
      q = query(q, where("level", "==", levelFilter));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setLogs(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching logs:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลด logs ได้",
        variant: "destructive",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [filter, levelFilter, autoRefresh, toast]);

  // Filter logs by search term
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.message?.toLowerCase().includes(searchLower) ||
      log.action?.toLowerCase().includes(searchLower) ||
      log.userName?.toLowerCase().includes(searchLower) ||
      log.resource?.toLowerCase().includes(searchLower)
    );
  });

  const handleExpandLog = useCallback((log: any) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(log.id)) {
      newExpanded.delete(log.id);
    } else {
      newExpanded.add(log.id);
    }
    setExpandedLogs(newExpanded);
  }, [expandedLogs]);

  const handleExportLogs = useCallback(async () => {
    try {
      const csvContent = [
        "Timestamp,Type,Action,Message,Level,User,Resource,Session ID",
        ...filteredLogs.map(log => [
          log.timestamp?.toDate?.()?.toISOString() || "N/A",
          log.type || "N/A",
          log.action || "N/A",
          `"${(log.message || "").replace(/"/g, '""')}"`,
          log.level || "N/A",
          log.userName || log.userId || "Anonymous",
          log.resource || "N/A",
          log.sessionId || "N/A"
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "สำเร็จ",
        description: "ส่งออก logs เรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออก logs ได้",
        variant: "destructive",
      });
    }
  }, [filteredLogs, toast]);

  const getLogStats = () => {
    const stats = {
      total: logs.length,
      byType: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
      errors: logs.filter(log => log.level === "ERROR").length,
      warnings: logs.filter(log => log.level === "WARN").length,
      success: logs.filter(log => log.level === "SUCCESS").length
    };

    logs.forEach(log => {
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    });

    return stats;
  };

  const stats = getLogStats();

  const logTypes = [
    { value: "ALL", label: "ทั้งหมด", icon: <Activity className="h-4 w-4" /> },
    { value: "AUTH", label: "Authentication", icon: <User className="h-4 w-4" /> },
    { value: "USER", label: "User Management", icon: <User className="h-4 w-4" /> },
    { value: "SYSTEM", label: "System", icon: <Settings className="h-4 w-4" /> },
    { value: "INVENTORY", label: "Inventory", icon: <Activity className="h-4 w-4" /> },
    { value: "SECURITY", label: "Security", icon: <AlertTriangle className="h-4 w-4" /> },
    { value: "PERFORMANCE", label: "Performance", icon: <Activity className="h-4 w-4" /> },
    { value: "DEBUG", label: "Debug", icon: <Bug className="h-4 w-4" /> }
  ];

  const logLevels = [
    { value: "ALL", label: "ทั้งหมด", icon: <Info className="h-4 w-4" /> },
    { value: "INFO", label: "Info", icon: <Info className="h-4 w-4" /> },
    { value: "SUCCESS", label: "Success", icon: <CheckCircle className="h-4 w-4" /> },
    { value: "WARN", label: "Warning", icon: <AlertTriangle className="h-4 w-4" /> },
    { value: "ERROR", label: "Error", icon: <AlertTriangle className="h-4 w-4" /> },
    { value: "DEBUG", label: "Debug", icon: <Bug className="h-4 w-4" /> }
  ];

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">📊 System Log Viewer</h1>
          <p className="text-gray-600">ดู logs ระบบแบบ real-time</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Logs</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-red-500">{stats.errors}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.warnings}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success</p>
                  <p className="text-2xl font-bold text-green-500">{stats.success}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ค้นหา logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  {logTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Level Filter */}
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="เลือกระดับ" />
                </SelectTrigger>
                <SelectContent>
                  {logLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        {level.icon}
                        {level.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="flex items-center gap-2"
                >
                  {autoRefresh ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {autoRefresh ? "หยุด" : "เริ่ม"} Auto Refresh
                </Button>

                <Button
                  variant="outline"
                  onClick={handleExportLogs}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Logs ({filteredLogs.length} รายการ)</span>
              {isLoading && (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-500">กำลังโหลด...</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLogs.length > 0 ? (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <LogCard
                    key={log.id}
                    log={{
                      ...log,
                      expanded: expandedLogs.has(log.id)
                    }}
                    onExpand={handleExpandLog}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">ไม่พบ logs ที่ตรงกับการค้นหา</p>
                <p className="text-gray-400 text-sm">ลองเปลี่ยนตัวกรองหรือคำค้นหา</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LogViewer;
