import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, X, Loader2, CheckSquare, Square, Trash2,
  Calendar, List, LayoutGrid, Filter,
  ChevronLeft, ChevronRight, AlertCircle, Clock,
  Send, Repeat, User, Zap, Flag,
} from "lucide-react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Subtask  = { id: number; title: string; done: boolean };
type Comment  = { id: number; text: string; createdAt: string };

type Task = {
  id: number; businessId: number; clientId: number | null; clientName: string | null;
  title: string; description?: string; status: string; priority: string;
  dueDate: string | null; completedAt: string | null;
  subtasks: Subtask[]; comments: Comment[]; recurring: string;
  position: number; createdAt: string; updatedAt: string;
};

type Stats = { total: number; dueToday: number; overdue: number; completedThisWeek: number };

// ── Config ────────────────────────────────────────────────────────────────────

const PRIORITY_CFG: Record<string, { label: string; color: string; border: string; bg: string; dot: string }> = {
  urgent: { label: "Urgent", color: "text-red-400",   border: "border-l-red-500",   bg: "bg-red-500/10",   dot: "bg-red-500" },
  high:   { label: "High",   color: "text-amber-400", border: "border-l-amber-500", bg: "bg-amber-500/10", dot: "bg-amber-500" },
  normal: { label: "Normal", color: "text-blue-400",  border: "border-l-blue-500",  bg: "bg-blue-500/10",  dot: "bg-blue-500" },
  low:    { label: "Low",    color: "text-muted-foreground", border: "border-l-border", bg: "bg-muted/10", dot: "bg-muted-foreground" },
};

const STATUSES = ["todo", "in_progress", "done", "on_hold"] as const;

const NICHE_COLUMNS: Record<string, Record<string, string>> = {
  dog_trainer:  { todo: "Upcoming",  in_progress: "In Training",   done: "Completed",        on_hold: "On Hold" },
  urban_farmer: { todo: "To Plant",  in_progress: "Growing",        done: "Ready to Harvest", on_hold: "On Hold" },
  tailor:       { todo: "Queued",    in_progress: "In Stitching",   done: "Delivered",        on_hold: "On Hold" },
  photographer: { todo: "Upcoming",  in_progress: "In Editing",     done: "Delivered",        on_hold: "On Hold" },
  contractor:   { todo: "Pending",   in_progress: "In Progress",    done: "Completed",        on_hold: "On Hold" },
};
const DEFAULT_COLUMNS = { todo: "To Do", in_progress: "In Progress", done: "Done", on_hold: "On Hold" };

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("nf_token")}`, "Content-Type": "application/json" };
}
function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function isOverdue(task: Task) {
  return !!task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
}
function isToday(task: Task) {
  if (!task.dueDate) return false;
  const d = new Date(task.dueDate), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

// ── Priority Badge ─────────────────────────────────────────────────────────────

function PriorityBadge({ priority, compact = false }: { priority: string; compact?: boolean }) {
  const c = PRIORITY_CFG[priority] || PRIORITY_CFG.normal;
  if (compact) return <span className={cn("w-2 h-2 rounded-full inline-block shrink-0", c.dot)} />;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", c.bg, c.color)}>
      <Flag className="w-2.5 h-2.5" /> {c.label}
    </span>
  );
}

// ── Draggable Task Card ────────────────────────────────────────────────────────

function DraggableCard({ task, onClick, onToggleDone }: {
  task: Task; onClick: () => void; onToggleDone: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = { transform: CSS.Translate.toString(transform) };
  const p = PRIORITY_CFG[task.priority] || PRIORITY_CFG.normal;
  const done = task.subtasks.filter(s => s.done).length;
  const overdue = isOverdue(task);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <div
        onClick={e => { if (!isDragging) onClick(); }}
        className={cn(
          "bg-card border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing select-none border-l-4 hover:shadow-lg transition-all",
          p.border, isDragging && "opacity-30 shadow-2xl scale-105",
          overdue && "bg-red-500/3",
        )}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className={cn("text-sm font-medium text-foreground leading-snug flex-1", task.status === "done" && "line-through text-muted-foreground")}>
            {task.title}
          </p>
          <button
            onClick={e => { e.stopPropagation(); onToggleDone(); }}
            className="shrink-0 mt-0.5 text-muted-foreground hover:text-teal-400 transition-colors">
            {task.status === "done" ? <CheckSquare className="w-4 h-4 text-teal-400" /> : <Square className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <span className={cn("text-xs flex items-center gap-0.5", overdue ? "text-red-400 font-semibold" : isToday(task) ? "text-amber-400" : "text-muted-foreground")}>
              <Clock className="w-2.5 h-2.5" /> {fmtDate(task.dueDate)}
            </span>
          )}
          {task.clientName && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <User className="w-2.5 h-2.5" /> {task.clientName}
            </span>
          )}
        </div>
        {task.subtasks.length > 0 && (
          <div className="mt-2">
            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${(done / task.subtasks.length) * 100}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{done}/{task.subtasks.length} subtasks</p>
          </div>
        )}
        {task.recurring !== "none" && (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-primary/60">
            <Repeat className="w-2.5 h-2.5" /> {task.recurring}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Kanban Column ──────────────────────────────────────────────────────────────

function KanbanColumn({ status, label, tasks, onAddTask, onTaskClick, onToggleDone, activeId }: {
  status: string; label: string; tasks: Task[];
  onAddTask: () => void; onTaskClick: (t: Task) => void;
  onToggleDone: (id: number, isDone: boolean) => void; activeId: number | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const topColors: Record<string, string> = {
    todo: "border-t-muted-foreground/40", in_progress: "border-t-blue-500",
    done: "border-t-teal-500", on_hold: "border-t-amber-500",
  };

  return (
    <div className={cn("flex flex-col bg-background/40 border border-border rounded-2xl border-t-2 transition-all min-h-[360px]",
      topColors[status], isOver && "bg-primary/5 border-primary/30 shadow-lg shadow-primary/5")}>
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <span className="text-xs font-medium bg-muted/30 text-muted-foreground px-1.5 py-0.5 rounded-full">{tasks.length}</span>
        </div>
      </div>
      <div ref={setNodeRef} className="flex-1 px-2 pb-2 space-y-2 min-h-[120px]">
        {tasks.map(task => (
          <DraggableCard key={task.id} task={task}
            onClick={() => onTaskClick(task)}
            onToggleDone={() => onToggleDone(task.id, task.status === "done")} />
        ))}
        {tasks.length === 0 && !activeId && (
          <div className="h-16 border-2 border-dashed border-border/30 rounded-xl flex items-center justify-center mt-1">
            <p className="text-xs text-muted-foreground/40">Drop here</p>
          </div>
        )}
      </div>
      <div className="px-2 pb-3">
        <button onClick={onAddTask}
          className="w-full flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors border border-dashed border-border/40">
          <Plus className="w-3.5 h-3.5" /> Add task
        </button>
      </div>
    </div>
  );
}

// ── Task Detail Panel ──────────────────────────────────────────────────────────

function TaskDetailPanel({ task, open, onClose, onUpdate, clients }: {
  task: Task | null; open: boolean; onClose: () => void;
  onUpdate: (t: Task) => void; clients: any[];
}) {
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [priority, setPriority] = useState("normal");
  const [status, setStatus]     = useState("todo");
  const [dueDate, setDueDate]   = useState("");
  const [clientId, setClientId] = useState("");
  const [recurring, setRec]     = useState("none");
  const [subtaskInput, setSTI]  = useState("");
  const [commentInput, setCmtI] = useState("");
  const [saving, setSaving]     = useState(false);
  const [aiSuggestions, setAiS] = useState<string[]>([]);
  const [aiLoading, setAiLoad]  = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title); setDesc(task.description || "");
      setPriority(task.priority); setStatus(task.status);
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : "");
      setClientId(task.clientId?.toString() || ""); setRec(task.recurring);
    }
    setAiS([]);
  }, [task]);

  const save = async (field?: Record<string, any>) => {
    if (!task) return;
    setSaving(true);
    const body = field || { title, description: desc, priority, status, dueDate: dueDate || null, clientId: clientId ? Number(clientId) : null, recurring };
    const res = await fetch(`/api/tasks/${task.id}`, { method: "PUT", headers: authHeader(), body: JSON.stringify(body) });
    if (res.ok) { onUpdate(await res.json()); }
    setSaving(false);
  };

  const addSubtask = async () => {
    if (!task || !subtaskInput.trim()) return;
    const res = await fetch(`/api/tasks/${task.id}/subtasks`, { method: "POST", headers: authHeader(), body: JSON.stringify({ title: subtaskInput }) });
    if (res.ok) { onUpdate(await res.json()); setSTI(""); }
  };

  const toggleSubtask = async (subId: number, done: boolean) => {
    if (!task) return;
    const res = await fetch(`/api/tasks/${task.id}/subtasks/${subId}`, { method: "PATCH", headers: authHeader(), body: JSON.stringify({ done }) });
    if (res.ok) onUpdate(await res.json());
  };

  const deleteSubtask = async (subId: number) => {
    if (!task) return;
    const res = await fetch(`/api/tasks/${task.id}/subtasks/${subId}`, { method: "PATCH", headers: authHeader(), body: JSON.stringify({ _delete: true }) });
    if (res.ok) onUpdate(await res.json());
  };

  const addComment = async () => {
    if (!task || !commentInput.trim()) return;
    const res = await fetch(`/api/tasks/${task.id}/comments`, { method: "POST", headers: authHeader(), body: JSON.stringify({ text: commentInput }) });
    if (res.ok) { onUpdate(await res.json()); setCmtI(""); }
  };

  const suggestSubtasks = async () => {
    if (!task) return;
    setAiLoad(true);
    const prompt = `I have a task titled "${task.title}"${task.description ? `. Description: ${task.description}` : ""}. Suggest 4 concise, actionable subtasks. Return ONLY a JSON array of strings. Example: ["Step 1", "Step 2", "Step 3", "Step 4"]`;
    try {
      const res = await fetch("/api/ai/insight", { method: "POST", headers: authHeader(), body: JSON.stringify({ prompt }) });
      const d = await res.json();
      const match = (d.insight || "").match(/\[[\s\S]*?\]/);
      setAiS(match ? JSON.parse(match[0]) : [`Prepare for ${task.title}`, "Review details", "Take action", "Mark complete"]);
    } catch { setAiS([`Prepare for ${task.title}`, "Review details", "Take action", "Mark complete"]); }
    setAiLoad(false);
  };

  const addAiSubtask = async (t: string) => {
    if (!task) return;
    const res = await fetch(`/api/tasks/${task.id}/subtasks`, { method: "POST", headers: authHeader(), body: JSON.stringify({ title: t }) });
    if (res.ok) { onUpdate(await res.json()); setAiS(prev => prev.filter(s => s !== t)); }
  };

  if (!task) return null;
  const doneCount = task.subtasks.filter(s => s.done).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-card border-l border-border shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => save({ status: status === "done" ? "todo" : "done" })}
                  className="text-muted-foreground hover:text-teal-400 transition-colors">
                  {task.status === "done" ? <CheckSquare className="w-5 h-5 text-teal-400" /> : <Square className="w-5 h-5" />}
                </button>
                <span className="text-xs text-muted-foreground">Mark done</span>
              </div>
              <div className="flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <textarea value={title} onChange={e => setTitle(e.target.value)} onBlur={() => save()}
                className="w-full bg-transparent text-lg font-bold text-foreground resize-none focus:outline-none placeholder:text-muted-foreground/40"
                rows={2} placeholder="Task title…" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Priority</label>
                  <select value={priority} onChange={e => { setPriority(e.target.value); save({ priority: e.target.value }); }}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none">
                    {Object.entries(PRIORITY_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Status</label>
                  <select value={status} onChange={e => { setStatus(e.target.value); save({ status: e.target.value }); }}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none">
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Due Date & Time</label>
                  <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} onBlur={() => save()}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Linked Client</label>
                  <select value={clientId} onChange={e => { setClientId(e.target.value); save({ clientId: e.target.value ? Number(e.target.value) : null }); }}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none">
                    <option value="">No client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Recurring</label>
                <div className="flex gap-2">
                  {["none", "daily", "weekly", "monthly"].map(r => (
                    <button key={r} onClick={() => { setRec(r); save({ recurring: r }); }}
                      className={cn("flex-1 py-1.5 rounded-xl text-xs font-medium border capitalize transition-all",
                        recurring === r ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                      {r === "none" ? "None" : r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Description</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} onBlur={() => save()} rows={3}
                  placeholder="Add notes, details, context…"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>

              {/* Subtasks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Subtasks {task.subtasks.length > 0 && `(${doneCount}/${task.subtasks.length})`}
                  </label>
                  <button onClick={suggestSubtasks} disabled={aiLoading}
                    className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors">
                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} AI suggest
                  </button>
                </div>
                {task.subtasks.length > 0 && (
                  <div className="mb-2">
                    <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${(doneCount / task.subtasks.length) * 100}%` }} />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5 mb-2">
                  {task.subtasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2 group py-0.5">
                      <button onClick={() => toggleSubtask(st.id, !st.done)} className="shrink-0 text-muted-foreground hover:text-teal-400 transition-colors">
                        {st.done ? <CheckSquare className="w-4 h-4 text-teal-400" /> : <Square className="w-4 h-4" />}
                      </button>
                      <span className={cn("flex-1 text-sm", st.done && "line-through text-muted-foreground")}>{st.title}</span>
                      <button onClick={() => deleteSubtask(st.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {aiSuggestions.length > 0 && (
                  <div className="space-y-1.5 mb-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
                    <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1"><Zap className="w-3 h-3" /> AI Suggested</p>
                    {aiSuggestions.map(s => (
                      <button key={s} onClick={() => addAiSubtask(s)}
                        className="w-full text-left flex items-center gap-2 text-sm text-foreground hover:text-primary py-0.5 transition-colors">
                        <Plus className="w-3.5 h-3.5 shrink-0 text-primary" /> {s}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input value={subtaskInput} onChange={e => setSTI(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }}
                    placeholder="Add subtask… (Enter)"
                    className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <button onClick={addSubtask} className="px-3 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Notes</label>
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                  {task.comments.map(c => (
                    <div key={c.id} className="bg-background border border-border/50 rounded-xl px-3 py-2.5">
                      <p className="text-sm text-foreground leading-relaxed">{c.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(c.createdAt).toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                  {task.comments.length === 0 && <p className="text-xs text-muted-foreground">No notes yet.</p>}
                </div>
                <div className="flex gap-2">
                  <input value={commentInput} onChange={e => setCmtI(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addComment(); } }}
                    placeholder="Add a note… (Enter)"
                    className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <button onClick={addComment} className="px-3 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-0.5 pt-2 border-t border-border/50">
                <p>Created: {new Date(task.createdAt).toLocaleString("en-IN")}</p>
                <p>Updated: {new Date(task.updatedAt).toLocaleString("en-IN")}</p>
                {task.completedAt && <p className="text-teal-400">Completed: {new Date(task.completedAt).toLocaleString("en-IN")}</p>}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Quick Add ─────────────────────────────────────────────────────────────────

function QuickAdd({ open, onClose, onCreate, defaultStatus }: {
  open: boolean; onClose: () => void; onCreate: (t: string, s: string) => Promise<void>; defaultStatus: string;
}) {
  const [value, setValue]   = useState("");
  const [saving, setSaving] = useState(false);
  const ref                 = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) { setValue(""); setTimeout(() => ref.current?.focus(), 50); } }, [open]);

  const submit = async () => {
    if (!value.trim()) return;
    setSaving(true); await onCreate(value.trim(), defaultStatus); setSaving(false); onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 flex gap-3">
            <input ref={ref} value={value} onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onClose(); }}
              placeholder='Task title… (Enter to save, Esc to cancel)'
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
            <button onClick={submit} disabled={saving || !value.trim()}
              className="px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Calendar View ──────────────────────────────────────────────────────────────

function CalendarView({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (t: Task) => void }) {
  const [cur, setCur]           = useState(new Date());
  const [selectedDay, setSel]   = useState<number | null>(null);

  const year = cur.getFullYear(), month = cur.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const byDay: Record<number, Task[]> = {};
  tasks.forEach(t => {
    if (!t.dueDate) return;
    const d = new Date(t.dueDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      byDay[day] = [...(byDay[day] || []), t];
    }
  });

  const selectedTasks = selectedDay ? (byDay[selectedDay] || []) : [];

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button onClick={() => setCur(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <h3 className="font-semibold text-foreground">{cur.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h3>
          <button onClick={() => setCur(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-7 border-b border-border">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} className="px-2 py-2 text-xs font-medium text-muted-foreground text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="h-20 border-b border-r border-border/20" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayTasks = byDay[day] || [];
            const isT = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSel = day === selectedDay;
            return (
              <div key={day} onClick={() => setSel(day === selectedDay ? null : day)}
                className={cn("h-20 border-b border-r border-border/20 p-1.5 cursor-pointer hover:bg-white/5 transition-colors overflow-hidden",
                  isSel && "bg-primary/10")}>
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mb-1 mx-auto",
                  isT ? "bg-primary text-primary-foreground" : "text-foreground")}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 2).map(t => {
                    const p = PRIORITY_CFG[t.priority] || PRIORITY_CFG.normal;
                    return (
                      <div key={t.id} onClick={e => { e.stopPropagation(); onTaskClick(t); }}
                        className={cn("text-xs px-1 py-0.5 rounded truncate font-medium", p.bg, p.color)}>
                        {t.title}
                      </div>
                    );
                  })}
                  {dayTasks.length > 2 && <p className="text-xs text-muted-foreground text-center">+{dayTasks.length - 2}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedDay && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="font-semibold text-foreground mb-3">
            {new Date(year, month, selectedDay).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            <span className="ml-2 text-sm font-normal text-muted-foreground">{selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}</span>
          </h3>
          {selectedTasks.length === 0
            ? <p className="text-sm text-muted-foreground">No tasks on this day.</p>
            : <div className="space-y-2">
              {selectedTasks.map(t => (
                <button key={t.id} onClick={() => onTaskClick(t)}
                  className={cn("w-full text-left px-3 py-2.5 rounded-xl border border-l-4 hover:border-primary/40 transition-all",
                    PRIORITY_CFG[t.priority]?.border || "border-l-border", "border-border bg-background/50")}>
                  <p className={cn("text-sm font-medium text-foreground", t.status === "done" && "line-through text-muted-foreground")}>{t.title}</p>
                  {t.clientName && <p className="text-xs text-muted-foreground mt-0.5">{t.clientName}</p>}
                  <PriorityBadge priority={t.priority} />
                </button>
              ))}
            </div>}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function Tasks() {
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [clients, setClients]   = useState<any[]>([]);
  const [stats, setStats]       = useState<Stats | null>(null);
  const [workspace, setWS]      = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState<"kanban" | "list" | "calendar">("kanban");
  const [search, setSearch]     = useState("");
  const [filterPriority, setFP] = useState("");
  const [filterStatus, setFS]   = useState("");
  const [filterClient, setFC]   = useState("");
  const [quickFilter, setQF]    = useState("");
  const [sortBy, setSortBy]     = useState<"created" | "dueDate" | "priority">("created");
  const [detailTask, setDetail] = useState<Task | null>(null);
  const [quickAdd, setQuickAdd] = useState(false);
  const [quickAddStatus, setQAS] = useState("todo");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const h = authHeader();
    const [ts, st, cl, ws] = await Promise.all([
      fetch("/api/tasks", { headers: h }).then(r => r.ok ? r.json() : []),
      fetch("/api/tasks/stats", { headers: h }).then(r => r.ok ? r.json() : null),
      fetch("/api/clients", { headers: h }).then(r => r.ok ? r.json() : []),
      fetch("/api/onboarding/config", { headers: h }).then(r => r.ok ? r.json() : null),
    ]);
    setTasks(ts); setStats(st); setClients(cl); setWS(ws);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // "T" keyboard shortcut for quick add
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "t" && !e.ctrlKey && !e.metaKey && !(e.target as HTMLElement).matches("input,textarea,select,[contenteditable]")) {
        e.preventDefault(); setQAS("todo"); setQuickAdd(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const niche = workspace?.niche || "";
  const rawKanban = workspace?.kanbanColumns as string[] | undefined;
  const columns = rawKanban?.length === 4
    ? { todo: rawKanban[0], in_progress: rawKanban[1], done: rawKanban[2], on_hold: rawKanban[3] }
    : NICHE_COLUMNS[niche.toLowerCase().replace(/\s+/g, "_")] || DEFAULT_COLUMNS;
  const tasksLabel = workspace?.terminology?.tasks || "Tasks";

  const createTask = async (title: string, status = "todo") => {
    const res = await fetch("/api/tasks", { method: "POST", headers: authHeader(), body: JSON.stringify({ title, status, priority: "normal" }) });
    if (res.ok) { const t = await res.json(); setTasks(prev => [t, ...prev]); }
  };

  const updateTask = (updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    if (detailTask?.id === updated.id) setDetail(updated);
  };

  const deleteTask = async (id: number) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE", headers: authHeader() });
    setTasks(prev => prev.filter(t => t.id !== id));
    if (detailTask?.id === id) setDetail(null);
  };

  const changeStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/tasks/${id}/status`, { method: "PATCH", headers: authHeader(), body: JSON.stringify({ status }) });
    if (res.ok) {
      const updated = await res.json();
      updateTask(updated);
      // Refresh stats
      fetch("/api/tasks/stats", { headers: authHeader() }).then(r => r.ok ? r.json() : null).then(st => { if (st) setStats(st); });
      // If recurring + done, reload to show the new task
      if (status === "done" && updated.recurring !== "none") fetchAll();
    }
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as number);
  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const taskId = active.id as number;
    const newStatus = over.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus || !STATUSES.includes(newStatus as any)) return;
    await changeStatus(taskId, newStatus);
  };

  const nowDate = new Date();
  const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());

  const filtered = useMemo(() => {
    let list = [...tasks];
    if (search) list = list.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    if (filterPriority) list = list.filter(t => t.priority === filterPriority);
    if (filterStatus)   list = list.filter(t => t.status === filterStatus);
    if (filterClient)   list = list.filter(t => t.clientId?.toString() === filterClient);
    if (quickFilter === "today")   list = list.filter(t => isToday(t) && t.status !== "done");
    if (quickFilter === "overdue") list = list.filter(t => isOverdue(t));
    if (quickFilter === "no_date") list = list.filter(t => !t.dueDate);
    if (sortBy === "dueDate")  list.sort((a, b) => !a.dueDate ? 1 : !b.dueDate ? -1 : new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    if (sortBy === "priority") {
      const order = { urgent: 0, high: 1, normal: 2, low: 3 };
      list.sort((a, b) => (order[a.priority as keyof typeof order] ?? 2) - (order[b.priority as keyof typeof order] ?? 2));
    }
    return list;
  }, [tasks, search, filterPriority, filterStatus, filterClient, quickFilter, sortBy]);

  const byStatus = (s: string) => filtered.filter(t => t.status === s);
  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  const bulkComplete = async () => { await Promise.all([...selected].map(id => changeStatus(id, "done"))); setSelected(new Set()); };
  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} tasks?`)) return;
    await Promise.all([...selected].map(id => deleteTask(id))); setSelected(new Set());
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{tasksLabel}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {loading ? "Loading…" : `${tasks.filter(t => t.status !== "done").length} active`}
              <span className="ml-2 text-xs text-muted-foreground/60">Press <kbd className="px-1 py-0.5 bg-muted rounded font-mono text-xs">T</kbd> to quick add</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-xl border border-border overflow-hidden">
              {[
                { v: "kanban",   Icon: LayoutGrid },
                { v: "list",     Icon: List },
                { v: "calendar", Icon: Calendar },
              ].map(({ v, Icon }) => (
                <button key={v} onClick={() => setView(v as any)}
                  title={v} className={cn("px-3 py-2 transition-colors", view === v ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <button onClick={() => { setQAS("todo"); setQuickAdd(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all">
              <Plus className="w-4 h-4" /> New Task
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Active Tasks",         value: stats?.total ?? "—",              bg: "bg-primary/10 text-primary",    Icon: CheckSquare },
            { label: "Due Today",            value: stats?.dueToday ?? "—",           bg: "bg-amber-500/10 text-amber-400", Icon: Clock },
            { label: "Overdue",              value: stats?.overdue ?? "—",            bg: "bg-red-500/10 text-red-400",    Icon: AlertCircle },
            { label: "Completed This Week",  value: stats?.completedThisWeek ?? "—", bg: "bg-teal-500/10 text-teal-400", Icon: CheckSquare },
          ].map(({ label, value, bg, Icon }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className={cn("p-2.5 rounded-xl", bg)}><Icon className="w-4 h-4" /></div>
              <div>
                <p className="text-xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Overdue banner ── */}
        {(stats?.overdue || 0) > 0 && (
          <button onClick={() => setQF(quickFilter === "overdue" ? "" : "overdue")}
            className="w-full flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-2xl px-4 py-3 text-left hover:bg-red-500/10 transition-colors">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-foreground flex-1">
              <strong>{stats?.overdue}</strong> overdue task{stats?.overdue !== 1 ? "s" : ""} need your attention.
            </p>
            <span className="text-xs text-red-400">{quickFilter === "overdue" ? "Clear ×" : "Show →"}</span>
          </button>
        )}

        {/* ── Quick filters + Search ── */}
        <div className="flex flex-wrap gap-2 items-center">
          {[
            { k: "",        label: "All" },
            { k: "today",   label: "Due Today" },
            { k: "overdue", label: "Overdue" },
            { k: "no_date", label: "No Date" },
          ].map(({ k, label }) => (
            <button key={k} onClick={() => setQF(quickFilter === k ? "" : k)}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                quickFilter === k ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>
              {label}
            </button>
          ))}
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…"
              className="w-full pl-8 pr-3 py-1.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>

        {/* ── List-view extra filters ── */}
        {view === "list" && (
          <div className="flex gap-2 flex-wrap">
            <select value={filterPriority} onChange={e => setFP(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none">
              <option value="">All priorities</option>
              {Object.entries(PRIORITY_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFS(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none">
              <option value="">All statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="on_hold">On Hold</option>
            </select>
            <select value={filterClient} onChange={e => setFC(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none">
              <option value="">All clients</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none">
              <option value="created">Newest</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        )}

        {/* ── Bulk actions ── */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5">
            <p className="text-sm font-medium text-primary">{selected.size} selected</p>
            <button onClick={bulkComplete} className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1.5 ml-2"><CheckSquare className="w-4 h-4" /> Complete</button>
            <button onClick={bulkDelete}   className="text-sm text-destructive hover:text-destructive/80 flex items-center gap-1.5"><Trash2 className="w-4 h-4" /> Delete</button>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-muted-foreground hover:text-foreground">Clear</button>
          </div>
        )}

        {/* ── Main content ── */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : tasks.length === 0 && !search && !filterPriority && !filterStatus ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-24 bg-card border border-border rounded-2xl">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckSquare className="w-10 h-10 text-primary/40" />
            </div>
            <p className="font-bold text-foreground text-lg mb-1">No {tasksLabel.toLowerCase()} yet</p>
            <p className="text-sm text-muted-foreground mb-5 text-center max-w-xs">Stay on top of your business. Add your first task to get started.</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuickAdd(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> Add First Task
              </button>
              <p className="text-xs text-muted-foreground">or press <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">T</kbd></p>
            </div>
          </div>
        ) : view === "kanban" ? (
          // ── Kanban ──
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STATUSES.map(status => (
                <KanbanColumn key={status} status={status} label={columns[status]}
                  tasks={byStatus(status)}
                  onAddTask={() => { setQAS(status); setQuickAdd(true); }}
                  onTaskClick={t => setDetail(t)}
                  onToggleDone={(id, isDone) => changeStatus(id, isDone ? "todo" : "done")}
                  activeId={activeId}
                />
              ))}
            </div>
            <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18,0.67,0.6,1.22)" }}>
              {activeTask && (
                <div className={cn("bg-card border border-border rounded-xl p-3 shadow-2xl border-l-4 w-56 rotate-2", PRIORITY_CFG[activeTask.priority]?.border || "border-l-border")}>
                  <p className="text-sm font-medium text-foreground mb-1.5">{activeTask.title}</p>
                  <PriorityBadge priority={activeTask.priority} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        ) : view === "list" ? (
          // ── List ──
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="border-b border-border bg-background/30">
                    <th className="px-4 py-3 w-8">
                      <input type="checkbox"
                        onChange={e => setSelected(e.target.checked ? new Set(filtered.map(t => t.id)) : new Set())}
                        checked={selected.size === filtered.length && filtered.length > 0} className="rounded" />
                    </th>
                    {["Title", "Priority", "Status", "Due Date", "Client", ""].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">No tasks match current filters</td></tr>
                  ) : filtered.map(task => {
                    const overdue = isOverdue(task);
                    const p = PRIORITY_CFG[task.priority] || PRIORITY_CFG.normal;
                    return (
                      <tr key={task.id}
                        className={cn("border-b border-border/50 last:border-0 hover:bg-white/5 transition-colors cursor-pointer", overdue && "bg-red-500/3")}>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={selected.has(task.id)}
                            onChange={() => setSelected(prev => { const n = new Set(prev); n.has(task.id) ? n.delete(task.id) : n.add(task.id); return n; })}
                            className="rounded" />
                        </td>
                        <td className="px-3 py-3" onClick={() => setDetail(task)}>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-1 h-8 rounded-full shrink-0", p.dot)} />
                            <div>
                              <p className={cn("text-sm font-medium text-foreground", task.status === "done" && "line-through text-muted-foreground")}>{task.title}</p>
                              {task.subtasks.length > 0 && (
                                <p className="text-xs text-muted-foreground">{task.subtasks.filter(s => s.done).length}/{task.subtasks.length} subtasks</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3" onClick={() => setDetail(task)}><PriorityBadge priority={task.priority} /></td>
                        <td className="px-3 py-3 text-xs capitalize text-muted-foreground" onClick={() => setDetail(task)}>
                          {task.status.replace("_", " ")}
                        </td>
                        <td className="px-3 py-3" onClick={() => setDetail(task)}>
                          {task.dueDate ? (
                            <span className={cn("text-xs", overdue ? "text-red-400 font-semibold" : isToday(task) ? "text-amber-400 font-semibold" : "text-muted-foreground")}>
                              {fmtDate(task.dueDate)}
                            </span>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-3 text-sm text-muted-foreground" onClick={() => setDetail(task)}>{task.clientName || "—"}</td>
                        <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button onClick={() => changeStatus(task.id, task.status === "done" ? "todo" : "done")}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-teal-400 hover:bg-teal-500/10 transition-colors">
                              <CheckSquare className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteTask(task.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // ── Calendar ──
          <CalendarView tasks={filtered} onTaskClick={setDetail} />
        )}
      </div>

      <QuickAdd open={quickAdd} onClose={() => setQuickAdd(false)} onCreate={createTask} defaultStatus={quickAddStatus} />
      <TaskDetailPanel task={detailTask} open={!!detailTask} onClose={() => setDetail(null)} onUpdate={updateTask} clients={clients} />
    </AppLayout>
  );
}
