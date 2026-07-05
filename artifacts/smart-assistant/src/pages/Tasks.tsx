import React, { useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Plus, Trash2, CheckSquare, Clock, AlertCircle,
  Flag, CalendarDays, ListTodo, SortAsc, Filter
} from 'lucide-react';

type Priority = 'low' | 'medium' | 'high';
type Category = 'عام' | 'عمل' | 'شخصي' | 'برمجة' | 'تعلم';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  dueDate: string;
  createdAt: string;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; icon: string }> = {
  high:   { label: 'عالية',   color: 'text-red-400 border-red-400/30 bg-red-400/10',    icon: '🔴' },
  medium: { label: 'متوسطة', color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10', icon: '🟡' },
  low:    { label: 'منخفضة', color: 'text-green-400 border-green-400/30 bg-green-400/10',   icon: '🟢' },
};

const CATEGORIES: Category[] = ['عام', 'عمل', 'شخصي', 'برمجة', 'تعلم'];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function Tasks() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('daily_tasks', []);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newCategory, setNewCategory] = useState<Category>('عام');
  const [newDueDate, setNewDueDate] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [showCompleted, setShowCompleted] = useState(true);

  const addTask = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const task: Task = {
      id: generateId(),
      title: trimmed,
      completed: false,
      priority: newPriority,
      category: newCategory,
      dueDate: newDueDate,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [task, ...prev]);
    setNewTitle('');
    setNewDueDate('');
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  };

  const filtered = tasks.filter((t) => {
    if (!showCompleted && t.completed) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    return true;
  });

  const pending   = tasks.filter((t) => !t.completed).length;
  const completed = tasks.filter((t) => t.completed).length;
  const today     = new Date().toISOString().split('T')[0];

  const isOverdue = (t: Task) =>
    !t.completed && t.dueDate && t.dueDate < today!;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ListTodo className="w-8 h-8 text-primary" />
            مهامي اليومية
          </h1>
          <p className="text-muted-foreground mt-1">
            تنظيم وتتبع مهامك الشخصية بسهولة
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <div className="text-center px-4 py-2 rounded-lg bg-card border border-border">
            <p className="text-2xl font-bold text-primary">{pending}</p>
            <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
          </div>
          <div className="text-center px-4 py-2 rounded-lg bg-card border border-border">
            <p className="text-2xl font-bold text-green-400">{completed}</p>
            <p className="text-xs text-muted-foreground">مكتملة</p>
          </div>
          <div className="text-center px-4 py-2 rounded-lg bg-card border border-border">
            <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
            <p className="text-xs text-muted-foreground">الإجمالي</p>
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Plus className="w-4 h-4" />
            إضافة مهمة جديدة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            data-testid="input-new-task"
            placeholder="اكتب اسم المهمة..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            className="text-right bg-background border-border"
          />
          <div className="flex flex-wrap gap-2">
            {/* Priority */}
            <Select value={newPriority} onValueChange={(v) => setNewPriority(v as Priority)}>
              <SelectTrigger className="w-36 bg-background border-border" data-testid="select-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">🔴 أولوية عالية</SelectItem>
                <SelectItem value="medium">🟡 أولوية متوسطة</SelectItem>
                <SelectItem value="low">🟢 أولوية منخفضة</SelectItem>
              </SelectContent>
            </Select>

            {/* Category */}
            <Select value={newCategory} onValueChange={(v) => setNewCategory(v as Category)}>
              <SelectTrigger className="w-32 bg-background border-border" data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Due date */}
            <div className="flex items-center gap-1.5 flex-1 min-w-40">
              <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="bg-background border-border text-sm"
                data-testid="input-due-date"
              />
            </div>

            <Button
              onClick={addTask}
              disabled={!newTitle.trim()}
              className="gap-2"
              data-testid="button-add-task"
            >
              <Plus className="w-4 h-4" />
              إضافة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">تصفية:</span>

        <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as Priority | 'all')}>
          <SelectTrigger className="w-36 h-8 text-xs bg-card border-border" data-testid="filter-priority">
            <SelectValue placeholder="كل الأولويات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأولويات</SelectItem>
            <SelectItem value="high">🔴 عالية</SelectItem>
            <SelectItem value="medium">🟡 متوسطة</SelectItem>
            <SelectItem value="low">🟢 منخفضة</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as Category | 'all')}>
          <SelectTrigger className="w-32 h-8 text-xs bg-card border-border" data-testid="filter-category">
            <SelectValue placeholder="كل الفئات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الفئات</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          className={cn('h-8 text-xs gap-1', showCompleted && 'text-primary')}
          onClick={() => setShowCompleted(!showCompleted)}
          data-testid="toggle-completed"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          {showCompleted ? 'إخفاء المكتملة' : 'إظهار المكتملة'}
        </Button>

        {completed > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-destructive hover:text-destructive gap-1 ml-auto"
            onClick={clearCompleted}
            data-testid="button-clear-completed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            حذف المكتملة ({completed})
          </Button>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">لا توجد مهام</p>
            <p className="text-sm mt-1">أضف مهمة جديدة باستخدام النموذج أعلاه</p>
          </div>
        )}

        {filtered.map((task) => {
          const overdue = isOverdue(task);
          const pCfg = PRIORITY_CONFIG[task.priority];
          return (
            <div
              key={task.id}
              data-testid={`task-item-${task.id}`}
              className={cn(
                'flex items-start gap-3 p-4 rounded-lg border bg-card transition-all group',
                task.completed
                  ? 'opacity-50 border-border'
                  : overdue
                  ? 'border-red-500/40 bg-red-500/5'
                  : 'border-border hover:border-primary/40'
              )}
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
                className="mt-0.5 shrink-0"
                data-testid={`checkbox-task-${task.id}`}
              />

              <div className="flex-1 min-w-0 space-y-1.5">
                <p
                  className={cn(
                    'text-sm font-medium leading-snug',
                    task.completed && 'line-through text-muted-foreground'
                  )}
                >
                  {task.title}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Priority badge */}
                  <Badge variant="outline" className={cn('text-xs px-1.5 py-0', pCfg.color)}>
                    <Flag className="w-2.5 h-2.5 mr-1" />
                    {pCfg.label}
                  </Badge>

                  {/* Category */}
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {task.category}
                  </Badge>

                  {/* Due date */}
                  {task.dueDate && (
                    <span
                      className={cn(
                        'flex items-center gap-1 text-xs',
                        overdue ? 'text-red-400' : 'text-muted-foreground'
                      )}
                    >
                      {overdue ? (
                        <AlertCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {overdue ? 'متأخرة • ' : ''}
                      {new Date(task.dueDate).toLocaleDateString('ar-SA', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 opacity-0 group-hover:opacity-100 h-7 w-7 text-muted-foreground hover:text-destructive transition-all"
                onClick={() => deleteTask(task.id)}
                data-testid={`button-delete-${task.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <Card className="border-border bg-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground flex items-center gap-1">
                <SortAsc className="w-4 h-4" />
                تقدم اليوم
              </span>
              <span className="font-medium text-foreground">
                {completed} / {tasks.length} مهمة
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: tasks.length > 0 ? `${(completed / tasks.length) * 100}%` : '0%' }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-left">
              {tasks.length > 0
                ? `${Math.round((completed / tasks.length) * 100)}% مكتمل`
                : '—'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
