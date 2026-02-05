import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSyncSchedule, updateSyncSchedule, startManualSync, getSyncHistory } from "@/api/syncApi";
import { SyncSchedule, SyncScheduleItem, SyncHistoryItem } from "@/types/sync";
import { Loader2, RefreshCw, Save, Play, FileText, Clock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SyncScheduleSettings = () => {
  const [schedule, setSchedule] = useState<SyncSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [runningManual, setRunningManual] = useState<string | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<SyncScheduleItem | null>(null);
  const [logs, setLogs] = useState<SyncHistoryItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSchedule();
  }, []);

  useEffect(() => {
    if (logsOpen && selectedSchedule?.id) {
      loadLogs(selectedSchedule.id);
    }
  }, [logsOpen, selectedSchedule]);

  const loadLogs = async (scheduleId: string) => {
    setLoadingLogs(true);
    try {
      const history = await getSyncHistory({ 
        scheduleId,
        limit: 20 
      });
      // Handle array response
      if (Array.isArray(history)) {
        setLogs(history);
      } else if (history.data && Array.isArray(history.data)) {
        setLogs(history.data);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Failed to load logs", error);
      toast({
        title: "Error",
        description: "Failed to load schedule logs",
        variant: "destructive",
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const response = await getSyncSchedule();
      if (response.success) {
        setSchedule(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load schedule settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load schedule settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!schedule) return;
    setSaving(true);
    try {
      const response = await updateSyncSchedule(schedule);
      if (response.success) {
        setSchedule(response.data);
        toast({
          title: "Success",
          description: "Schedule settings saved successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save schedule settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save schedule settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleManualTrigger = async (item: SyncScheduleItem) => {
    if (!item.type) return;
    setRunningManual(item.id || item.type);
    try {
      await startManualSync({
        type: item.type,
        scheduleId: item.id,
        startDateTime: new Date().toISOString(),
        endDateTime: new Date().toISOString(),
      } as any); 
      
      toast({
        title: "Success",
        description: `${item.description} triggered successfully`,
      });
      // Reload schedule to update last run time
      setTimeout(loadSchedule, 2000); // Small delay to allow job to start/update status
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to trigger ${item.description}`,
        variant: "destructive",
      });
    } finally {
      setRunningManual(null);
    }
  };

  const updateScheduleItem = (index: number, field: keyof SyncScheduleItem, value: any) => {
    if (!schedule) return;
    const newSchedules = [...schedule.schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setSchedule({ ...schedule, schedules: newSchedules });
  };

  const openLogs = (item: SyncScheduleItem) => {
    setSelectedSchedule(item);
    setLogsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!schedule) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sync Schedule Configuration</CardTitle>
            <CardDescription>Manage automated attendance and employee synchronization schedules</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={loadSchedule}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
          <div className="space-y-0.5">
            <Label className="text-base">Global Scheduler Status</Label>
            <p className="text-sm text-muted-foreground">
              {schedule.enabled ? "Scheduler is currently running" : "Scheduler is paused"}
            </p>
          </div>
          <Switch
            checked={schedule.enabled}
            onCheckedChange={(checked) => setSchedule({ ...schedule, enabled: checked })}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Scheduled Jobs</h3>
          {schedule.schedules.map((item, index) => (
            <div key={index} className="flex flex-col space-y-4 p-4 border rounded-lg shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.description}</span>
                    <Badge variant={item.type === 'EMPLOYEE_SYNC' ? "secondary" : "default"}>
                      {item.type === 'EMPLOYEE_SYNC' ? 'Employee Sync' : 'Attendance Sync'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Next Run: {item.nextRun ? new Date(item.nextRun).toLocaleString() : 'Not scheduled'}
                  </div>
                  {item.lastRun && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Last Run: {new Date(item.lastRun).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openLogs(item)}
                    title="View Logs"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!runningManual}
                    onClick={() => handleManualTrigger(item)}
                  >
                    {runningManual === (item.id || item.type) ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Run Now
                  </Button>
                  <Switch
                    checked={item.enabled}
                    onCheckedChange={(checked) => updateScheduleItem(index, 'enabled', checked)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select 
                    value={item.frequency || 'daily'} 
                    onValueChange={(value) => updateScheduleItem(index, 'frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="interval">Interval (Hours)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {item.frequency === 'interval' ? (
                  <div className="space-y-2">
                    <Label>Every (Hours)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      value={item.intervalValue || 1}
                      onChange={(e) => updateScheduleItem(index, 'intervalValue', parseInt(e.target.value) || 1)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Run Time (24h)</Label>
                    <Input
                      type="time"
                      value={item.time}
                      onChange={(e) => updateScheduleItem(index, 'time', e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Input
                    value={item.timezone || 'Asia/Jakarta'}
                    onChange={(e) => updateScheduleItem(index, 'timezone', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </CardContent>

      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Execution Logs</DialogTitle>
            <DialogDescription>
              Recent execution history for {selectedSchedule?.description}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 mt-4 border rounded-md">
            {loadingLogs ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : logs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Executed At</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.syncId}>
                      <TableCell>
                        <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(log.executedAt).toLocaleString()}</TableCell>
                      <TableCell>{log.executionTimeMs}ms</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          Processed: {log.recordsProcessed}<br/>
                          Inserted: {log.recordsInserted}<br/>
                          Skipped: {log.recordsSkipped}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs">
                         {log.errorMessage || JSON.stringify(log.parameters || {})}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No logs found for this schedule.
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SyncScheduleSettings;
