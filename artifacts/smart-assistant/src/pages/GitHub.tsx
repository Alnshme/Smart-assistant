import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import {
  Github, FolderOpen, FileCode, ChevronRight, Plus, RefreshCw,
  ArrowLeft, Eye, EyeOff, Save, Trash2, BookOpen, Lock, Globe,
  Star, GitFork, Clock, Search, Edit, Check, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface GHUser { login: string; name: string; avatar_url: string; public_repos: number; }
interface GHRepo {
  id: number; name: string; full_name: string; description: string | null;
  private: boolean; stargazers_count: number; forks_count: number;
  language: string | null; updated_at: string; default_branch: string;
  owner: { login: string };
}
interface GHContent { name: string; path: string; type: 'file' | 'dir'; sha: string; size: number; }

const GH = 'https://api.github.com';

const LANG_COLOR: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572A5',
  HTML: '#e34c26', CSS: '#563d7c', Rust: '#dea584', Go: '#00ADD8',
  Java: '#b07219', Ruby: '#701516', PHP: '#4F5D95', Shell: '#89e051',
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const sortContents = (arr: GHContent[]) =>
  [...arr].sort((a, b) =>
    a.type !== b.type ? (a.type === 'dir' ? -1 : 1) : a.name.localeCompare(b.name)
  );

export default function GitHub() {
  const [token, setToken] = useLocalStorage('github_token', '');
  const [inputToken, setInputToken] = useState(token);
  const [showToken, setShowToken] = useState(false);
  const [user, setUser] = useState<GHUser | null>(null);
  const [repos, setRepos] = useState<GHRepo[]>([]);
  const [query, setQuery] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<GHRepo | null>(null);
  const [pathStack, setPathStack] = useState<string[]>([]);
  const [contents, setContents] = useState<GHContent[]>([]);
  const [selectedFile, setSelectedFile] = useState<GHContent | null>(null);
  const [fileSha, setFileSha] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [commitMsg, setCommitMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [connectError, setConnectError] = useState('');
  // new repo
  const [showNewRepo, setShowNewRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);
  // new file
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [newFileCommit, setNewFileCommit] = useState('');

  const { toast } = useToast();

  const ghFetch = useCallback(
    async (path: string, opts?: RequestInit) => {
      const res = await fetch(`${GH}${path}`, {
        ...opts,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          ...(opts?.headers ?? {}),
        },
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(e.message ?? `HTTP ${res.status}`);
      }
      return res.json();
    },
    [token]
  );

  /* ── CONNECT ── */
  const connect = async () => {
    const t = inputToken.trim();
    if (!t) return;
    setLoading(true); setConnectError('');
    try {
      const res = await fetch(`${GH}/user`, {
        headers: { Authorization: `Bearer ${t}`, Accept: 'application/vnd.github.v3+json' },
      });
      if (!res.ok) throw new Error('Invalid token — check scopes and expiry.');
      const u: GHUser = await res.json();
      setToken(t);
      setUser(u);
      toast({ title: `Connected as @${u.login}`, description: 'GitHub account linked successfully.' });
    } catch (e: any) {
      setConnectError(e.message);
    }
    setLoading(false);
  };

  const disconnect = () => {
    setToken(''); setInputToken(''); setUser(null);
    setRepos([]); setSelectedRepo(null); setContents([]);
    setSelectedFile(null); setPathStack([]);
  };

  /* ── FETCH REPOS ── */
  const fetchRepos = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data: GHRepo[] = await ghFetch('/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator');
      setRepos(data);
    } catch (e: any) {
      toast({ title: 'Failed to load repos', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  }, [token, ghFetch]);

  /* ── INITIAL LOAD ── */
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const u: GHUser = await ghFetch('/user');
        setUser(u);
      } catch { disconnect(); return; }
      fetchRepos();
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredRepos = repos.filter(r =>
    !query || r.name.toLowerCase().includes(query.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(query.toLowerCase())
  );

  /* ── BROWSE ── */
  const loadContents = async (repo: GHRepo, path: string) => {
    setLoading(true);
    try {
      const data = await ghFetch(`/repos/${repo.full_name}/contents/${path}`);
      setContents(sortContents(Array.isArray(data) ? data : []));
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const browseRepo = (repo: GHRepo) => {
    setSelectedRepo(repo); setPathStack([]); setSelectedFile(null);
    loadContents(repo, '');
  };

  const browseDir = (item: GHContent) => {
    if (!selectedRepo) return;
    setPathStack(prev => [...prev, item.name]);
    setSelectedFile(null);
    loadContents(selectedRepo, item.path);
  };

  const navigateStack = (idx: number) => {
    if (!selectedRepo) return;
    const stack = pathStack.slice(0, idx + 1);
    setPathStack(stack);
    setSelectedFile(null);
    loadContents(selectedRepo, stack.join('/'));
  };

  const backToRepoRoot = () => {
    if (!selectedRepo) return;
    setPathStack([]); setSelectedFile(null);
    loadContents(selectedRepo, '');
  };

  /* ── FILE OPS ── */
  const openFile = async (item: GHContent) => {
    if (!selectedRepo) return;
    setSelectedFile(item); setEditMode(false); setLoading(true);
    try {
      const data = await ghFetch(`/repos/${selectedRepo.full_name}/contents/${item.path}`);
      const decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
      setFileSha(data.sha);
      setFileContent(decoded); setEditContent(decoded);
      setCommitMsg(`Update ${item.name}`);
    } catch (e: any) {
      toast({ title: 'Failed to load file', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const saveFile = async () => {
    if (!selectedRepo || !selectedFile) return;
    setBusy('saving');
    try {
      await ghFetch(`/repos/${selectedRepo.full_name}/contents/${selectedFile.path}`, {
        method: 'PUT',
        body: JSON.stringify({
          message: commitMsg || `Update ${selectedFile.name}`,
          content: btoa(unescape(encodeURIComponent(editContent))),
          sha: fileSha,
          branch: selectedRepo.default_branch,
        }),
      });
      setFileContent(editContent); setEditMode(false);
      toast({ title: 'Committed ✓', description: `${selectedFile.name} saved.` });
    } catch (e: any) {
      toast({ title: 'Commit failed', description: e.message, variant: 'destructive' });
    }
    setBusy('');
  };

  const deleteFile = async () => {
    if (!selectedRepo || !selectedFile) return;
    if (!window.confirm(`Delete "${selectedFile.name}"? This cannot be undone.`)) return;
    setBusy('deleting');
    try {
      const data = await ghFetch(`/repos/${selectedRepo.full_name}/contents/${selectedFile.path}`);
      await ghFetch(`/repos/${selectedRepo.full_name}/contents/${selectedFile.path}`, {
        method: 'DELETE',
        body: JSON.stringify({ message: `Delete ${selectedFile.name}`, sha: data.sha }),
      });
      toast({ title: 'Deleted', description: `${selectedFile.name} removed.` });
      setSelectedFile(null);
      backToRepoRoot();
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
    setBusy('');
  };

  const createRepo = async () => {
    if (!newRepoName.trim()) return;
    setBusy('new-repo');
    try {
      await ghFetch('/user/repos', {
        method: 'POST',
        body: JSON.stringify({ name: newRepoName.trim(), description: newRepoDesc, private: newRepoPrivate, auto_init: true }),
      });
      toast({ title: 'Repository created ✓', description: `${newRepoName.trim()} is ready.` });
      setShowNewRepo(false); setNewRepoName(''); setNewRepoDesc(''); setNewRepoPrivate(false);
      fetchRepos();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
    setBusy('');
  };

  const createFile = async () => {
    if (!selectedRepo || !newFileName.trim()) return;
    setBusy('new-file');
    const dir = pathStack.join('/');
    const filePath = dir ? `${dir}/${newFileName.trim()}` : newFileName.trim();
    try {
      await ghFetch(`/repos/${selectedRepo.full_name}/contents/${filePath}`, {
        method: 'PUT',
        body: JSON.stringify({
          message: newFileCommit || `Add ${newFileName.trim()}`,
          content: btoa(unescape(encodeURIComponent(newFileContent))),
          branch: selectedRepo.default_branch,
        }),
      });
      toast({ title: 'File created ✓', description: filePath });
      setShowNewFile(false); setNewFileName(''); setNewFileContent(''); setNewFileCommit('');
      loadContents(selectedRepo, pathStack.join('/'));
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
    setBusy('');
  };

  /* ════════════════════════════════════════════════
      VIEWS
  ════════════════════════════════════════════════ */

  /* ── NOT CONNECTED ── */
  if (!token) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Github className="w-10 h-10 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Connect to GitHub</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Enter your Personal Access Token to manage repositories, browse files, and commit changes — all from here.
            </p>
          </div>
          <div className="text-left space-y-3">
            <Label>Personal Access Token</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showToken ? 'text' : 'password'}
                  value={inputToken}
                  onChange={e => setInputToken(e.target.value)}
                  placeholder="ghp_..."
                  className="font-mono pr-10 bg-background"
                  onKeyDown={e => e.key === 'Enter' && connect()}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button onClick={connect} disabled={loading || !inputToken.trim()}>
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Connect'}
              </Button>
            </div>
            {connectError && <p className="text-destructive text-sm">{connectError}</p>}
            <p className="text-xs text-muted-foreground">
              Create a token at{' '}
              <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                github.com/settings/tokens
              </a>{' '}
              with <strong>repo</strong> scope.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── FILE VIEW ── */
  if (selectedFile) {
    const isBinary = /\.(png|jpe?g|gif|webp|ico|pdf|zip|tar|gz|exe|bin|wasm|mp4|mp3)$/i.test(selectedFile.name);
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border flex-shrink-0 flex-wrap gap-y-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="gap-1 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-mono text-sm font-medium">{selectedFile.name}</span>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {!isBinary && !editMode && (
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)} className="gap-1">
                <Edit className="w-3.5 h-3.5" /> Edit
              </Button>
            )}
            {editMode && (
              <>
                <Input
                  className="h-8 text-sm w-56 bg-background"
                  placeholder="Commit message…"
                  value={commitMsg}
                  onChange={e => setCommitMsg(e.target.value)}
                />
                <Button size="sm" onClick={saveFile} disabled={busy === 'saving'} className="gap-1">
                  {busy === 'saving' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Commit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditMode(false); setEditContent(fileContent); }}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
            <Button size="sm" variant="destructive" onClick={deleteFile} disabled={busy === 'deleting'} className="gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading…
            </div>
          ) : isBinary ? (
            <div className="text-center text-muted-foreground py-24">
              <FileCode className="w-12 h-12 mx-auto mb-4 opacity-20" />
              Binary file — preview not available.
            </div>
          ) : editMode ? (
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full h-full min-h-[28rem] font-mono text-sm bg-muted/30 border border-border rounded-lg p-4 resize-none focus:outline-none focus:border-primary text-foreground"
            />
          ) : (
            <pre className="font-mono text-sm bg-muted/20 border border-border rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
              {fileContent}
            </pre>
          )}
        </div>
      </div>
    );
  }

  /* ── REPO BROWSER ── */
  if (selectedRepo) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* breadcrumb header */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-border flex-shrink-0 flex-wrap gap-y-2">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedRepo(null); setContents([]); setPathStack([]); }} className="gap-1 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Repos
          </Button>
          <div className="flex items-center gap-1 text-sm min-w-0 flex-wrap">
            <span className="text-muted-foreground">/</span>
            <button onClick={backToRepoRoot} className="hover:text-primary font-semibold transition-colors truncate">
              {selectedRepo.name}
            </button>
            {pathStack.map((seg, i) => (
              <React.Fragment key={i}>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <button
                  onClick={() => navigateStack(i)}
                  className={cn('hover:text-primary transition-colors truncate', i === pathStack.length - 1 && 'text-foreground font-medium')}
                >
                  {seg}
                </button>
              </React.Fragment>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowNewFile(true)} className="gap-1">
              <Plus className="w-3.5 h-3.5" /> New File
            </Button>
            <Button size="sm" variant="ghost" onClick={backToRepoRoot} disabled={loading}>
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* new file inline form */}
        {showNewFile && (
          <div className="border-b border-border bg-muted/20 p-5 space-y-3 flex-shrink-0">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Create New File
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">File name</Label>
                <Input value={newFileName} onChange={e => setNewFileName(e.target.value)} placeholder="README.md" className="h-8 text-sm bg-background" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Commit message</Label>
                <Input value={newFileCommit} onChange={e => setNewFileCommit(e.target.value)} placeholder="Add new file" className="h-8 text-sm bg-background" />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Content</Label>
              <textarea
                value={newFileContent} onChange={e => setNewFileContent(e.target.value)} rows={5}
                className="w-full font-mono text-sm bg-background border border-border rounded-md p-2 resize-none focus:outline-none focus:border-primary text-foreground"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={createFile} disabled={busy === 'new-file' || !newFileName.trim()} className="gap-1">
                {busy === 'new-file' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Create File
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNewFile(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* file list */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading…
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center text-muted-foreground py-20">This directory is empty.</div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              {contents.map((item, i) => (
                <button
                  key={`${item.sha}-${i}`}
                  onClick={() => item.type === 'dir' ? browseDir(item) : openFile(item)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left',
                    i < contents.length - 1 && 'border-b border-border'
                  )}
                >
                  {item.type === 'dir'
                    ? <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
                    : <FileCode className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  <span className={cn('flex-1 font-mono', item.type === 'dir' && 'text-primary font-medium')}>
                    {item.name}
                  </span>
                  {item.type === 'file' && (
                    <span className="text-xs text-muted-foreground">
                      {item.size < 1024 ? `${item.size} B` : `${(item.size / 1024).toFixed(1)} KB`}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── REPOS LIST ── */
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* top bar */}
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {user?.avatar_url && (
              <img src={user.avatar_url} alt={user.login} className="w-10 h-10 rounded-full border border-border" />
            )}
            <div>
              <p className="font-bold leading-tight">{user?.name || user?.login}</p>
              <p className="text-sm text-muted-foreground">@{user?.login} · {user?.public_repos} repositories</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => setShowNewRepo(true)} className="gap-1">
              <Plus className="w-4 h-4" /> New Repo
            </Button>
            <Button size="sm" variant="outline" onClick={fetchRepos} disabled={loading} className="gap-1">
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Refresh
            </Button>
            <Button size="sm" variant="ghost" onClick={disconnect} className="text-destructive hover:bg-destructive/10">
              Disconnect
            </Button>
          </div>
        </div>

        {/* new repo form */}
        {showNewRepo && (
          <div className="border border-border rounded-xl p-5 mb-6 bg-muted/20 space-y-4">
            <h4 className="font-semibold flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-primary" /> Create New Repository
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-1.5 block">Repository name *</Label>
                <Input value={newRepoName} onChange={e => setNewRepoName(e.target.value)} placeholder="my-project" className="bg-background" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Description</Label>
                <Input value={newRepoDesc} onChange={e => setNewRepoDesc(e.target.value)} placeholder="Optional" className="bg-background" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
              <input type="checkbox" checked={newRepoPrivate} onChange={e => setNewRepoPrivate(e.target.checked)} className="accent-primary" />
              Private repository
            </label>
            <div className="flex gap-2">
              <Button onClick={createRepo} disabled={busy === 'new-repo' || !newRepoName.trim()} className="gap-1">
                {busy === 'new-repo' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create
              </Button>
              <Button variant="ghost" onClick={() => { setShowNewRepo(false); setNewRepoName(''); setNewRepoDesc(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search repositories…" className="pl-9 bg-background" />
        </div>

        {/* repos grid */}
        {loading && repos.length === 0 ? (
          <div className="flex items-center justify-center h-56 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading repositories…
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRepos.map(repo => (
              <button
                key={repo.id}
                onClick={() => browseRepo(repo)}
                className="text-left border border-border rounded-xl p-4 hover:border-primary/50 hover:bg-muted/20 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {repo.private
                      ? <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      : <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                    <span className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                      {repo.name}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
                {repo.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{repo.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {repo.language && (
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: LANG_COLOR[repo.language] ?? '#64748b' }} />
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" />{repo.stargazers_count}</span>
                  <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{repo.forks_count}</span>
                  <span className="flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" />{fmt(repo.updated_at)}</span>
                </div>
              </button>
            ))}
            {filteredRepos.length === 0 && (
              <div className="col-span-2 text-center text-muted-foreground py-20">No repositories found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
