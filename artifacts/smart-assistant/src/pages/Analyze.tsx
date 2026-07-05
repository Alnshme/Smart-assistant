import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useAppContext } from '@/context/AppContext';
import { useAnalyzeData } from '@workspace/api-client-react';
import { 
  BarChart2, 
  UploadCloud, 
  FileSpreadsheet, 
  Table as TableIcon,
  Bot,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface DataFile {
  name: string;
  rows: any[];
  columns: string[];
}

export default function Analyze() {
  const { apiKey, addTokens } = useAppContext();
  const { toast } = useToast();
  
  const [fileData, setFileData] = useState<DataFile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ text: string; tokens: number } | null>(null);
  
  const analyzeMutation = useAnalyzeData();

  const processData = (data: any[], name: string) => {
    if (!data || data.length === 0) {
      toast({
        title: "Empty File",
        description: "The uploaded file contains no data.",
        variant: "destructive"
      });
      return;
    }
    
    // Convert array of arrays to array of objects if needed
    let rows = data;
    let columns: string[] = [];
    
    if (Array.isArray(data[0])) {
      columns = data[0].map(String);
      rows = data.slice(1).map(row => {
        const obj: any = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
    } else {
      columns = Object.keys(data[0] || {});
    }

    setFileData({ name, rows, columns });
    setAnalysisResult(null); // Reset previous analysis
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          processData(results.data, file.name);
        },
        error: (error: any) => {
          toast({ title: 'CSV Error', description: error.message, variant: 'destructive' });
        }
      });
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          processData(json, file.name);
        } catch (err: any) {
          toast({ title: 'Excel Error', description: err.message, variant: 'destructive' });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast({ title: 'Unsupported File', description: 'Please upload a CSV or Excel file.', variant: 'destructive' });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  // Calculate Stats
  const getStats = () => {
    if (!fileData) return null;
    
    const rowCount = fileData.rows.length;
    const stats: Record<string, { min: number; max: number; avg: number; type: string }> = {};
    const numericCols: string[] = [];

    fileData.columns.forEach(col => {
      let isNumeric = true;
      let sum = 0;
      let count = 0;
      let min = Infinity;
      let max = -Infinity;

      fileData.rows.forEach(row => {
        const val = row[col];
        if (val !== null && val !== undefined && val !== '') {
          const num = Number(val);
          if (!isNaN(num)) {
            sum += num;
            count++;
            min = Math.min(min, num);
            max = Math.max(max, num);
          } else {
            isNumeric = false;
          }
        }
      });

      if (isNumeric && count > 0) {
        stats[col] = {
          type: 'numeric',
          min,
          max,
          avg: sum / count
        };
        numericCols.push(col);
      }
    });

    return { rowCount, stats, numericCols };
  };

  const statsInfo = getStats();

  const handleAnalyze = () => {
    if (!fileData || !statsInfo || !apiKey) {
      if (!apiKey) {
        toast({ title: 'API Key Missing', description: 'Please add your API key in Settings.', variant: 'destructive' });
      }
      return;
    }

    const summaryText = `
      File: ${fileData.name}
      Total Rows: ${statsInfo.rowCount}
      Columns: ${fileData.columns.join(', ')}
      Numeric Columns Stats:
      ${statsInfo.numericCols.map(col => 
        `- ${col}: Min=${statsInfo.stats[col].min}, Max=${statsInfo.stats[col].max}, Avg=${statsInfo.stats[col].avg.toFixed(2)}`
      ).join('\n')}
    `;

    analyzeMutation.mutate({
      data: {
        apiKey,
        dataSummary: summaryText,
        fileName: fileData.name
      }
    }, {
      onSuccess: (data) => {
        addTokens(data.tokensUsed);
        setAnalysisResult({ text: data.analysis, tokens: data.tokensUsed });
      },
      onError: (err: any) => {
        toast({ title: 'Analysis Error', description: err?.response?.data?.error || err.message, variant: 'destructive' });
      }
    });
  };

  const chartData = fileData && statsInfo && statsInfo.numericCols.length >= 2
    ? fileData.rows.slice(0, 100).map(row => ({
        x: Number(row[statsInfo.numericCols[0]!]),
        y: Number(row[statsInfo.numericCols[1]!])
      })).filter(pt => !isNaN(pt.x) && !isNaN(pt.y))
    : [];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Analyzer</h1>
          <p className="text-sm text-muted-foreground">Upload CSV/Excel for AI statistical insights</p>
        </div>
      </div>

      {!fileData && (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="p-0">
            <div 
              {...getRootProps()} 
              className={cn(
                "flex flex-col items-center justify-center py-20 px-4 text-center cursor-pointer transition-colors rounded-xl",
                isDragActive ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
              )}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center mb-4 shadow-sm">
                <UploadCloud className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Drag & drop dataset here</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                Supports .csv, .xlsx, .xls files up to 10MB
              </p>
              <Button variant="secondary">Select File</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {fileData && statsInfo && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                    Dataset: {fileData.name}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => { setFileData(null); setAnalysisResult(null); }}>
                    Clear File
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Total Rows</p>
                  <p className="text-xl font-bold">{statsInfo.rowCount}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Total Columns</p>
                  <p className="text-xl font-bold">{fileData.columns.length}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Numeric Columns</p>
                  <p className="text-xl font-bold">{statsInfo.numericCols.length}</p>
                </div>
              </CardContent>
            </Card>

            {statsInfo.numericCols.length >= 2 && chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-primary" />
                    Scatter: {statsInfo.numericCols[0]} vs {statsInfo.numericCols[1]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis 
                          type="number" 
                          dataKey="x" 
                          name={statsInfo.numericCols[0]} 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          tickLine={false}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="y" 
                          name={statsInfo.numericCols[1]} 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          tickLine={false}
                        />
                        <RechartsTooltip 
                          cursor={{ strokeDasharray: '3 3' }} 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Scatter name="Data" data={chartData} fill="hsl(var(--primary))" opacity={0.6} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-primary" />
                  Preview (First 5 Rows)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="w-full">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                      <tr>
                        {fileData.columns.map((col, i) => (
                          <th key={i} className="px-4 py-3 font-medium whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fileData.rows.slice(0, 5).map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-border/50 hover:bg-muted/20">
                          {fileData.columns.map((col, colIndex) => (
                            <td key={colIndex} className="px-4 py-3 whitespace-nowrap overflow-hidden max-w-[200px] text-ellipsis">
                              {row[col]?.toString() || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-1 space-y-6">
            <Card className="h-full flex flex-col border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Bot className="w-5 h-5" />
                  AI Insights
                </CardTitle>
                <CardDescription>
                  Generate statistical summaries and pattern recognition automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {!analysisResult ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-background border border-primary/20 flex items-center justify-center shadow-sm">
                      <BarChart2 className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Click below to send the dataset summary to the AI for analysis.
                    </p>
                    <Button 
                      className="w-full mt-4" 
                      onClick={handleAnalyze} 
                      disabled={analyzeMutation.isPending || !apiKey}
                    >
                      {analyzeMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Analyze with AI'
                      )}
                    </Button>
                    {!apiKey && (
                      <Alert variant="destructive" className="mt-4 bg-background">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>API Key Required</AlertTitle>
                        <AlertDescription className="text-xs">
                          Configure your key in settings to use AI tools.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <ScrollArea className="flex-1 -mx-6 px-6 h-[400px]">
                      <div className="prose prose-sm dark:prose-invert">
                        <ReactMarkdown>{analysisResult.text}</ReactMarkdown>
                      </div>
                    </ScrollArea>
                    <div className="pt-4 mt-4 border-t border-border flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Tokens used: {analysisResult.tokens}</span>
                      <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={analyzeMutation.isPending}>
                        {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Re-analyze'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
