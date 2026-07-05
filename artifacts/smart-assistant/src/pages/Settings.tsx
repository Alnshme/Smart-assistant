import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Save, Trash2, Key, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { apiKey, setApiKey, totalTokens, resetTokens } = useAppContext();
  const [inputValue, setInputValue] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    setApiKey(inputValue);
    toast({
      title: 'Settings Saved',
      description: 'Your API key has been securely stored in your browser.',
    });
  };

  const handleClear = () => {
    setInputValue('');
    setApiKey('');
    toast({
      title: 'Key Cleared',
      description: 'Your API key has been removed from browser storage.',
      variant: 'destructive',
    });
  };

  const handleResetTokens = () => {
    resetTokens();
    toast({
      title: 'Tokens Reset',
      description: 'Your token usage count has been reset to zero.',
    });
  };

  return (
    <div className="h-full overflow-y-auto p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Configure your application preferences and API keys.
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                NaraRouter API Configuration
              </CardTitle>
              <CardDescription>
                Your API key is stored locally in your browser and is never sent to our servers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="api-key"
                        type={showKey ? "text" : "password"}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="sk-..."
                        className="pr-10 bg-background font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border pt-6">
              <Button variant="outline" onClick={handleClear} disabled={!inputValue && !apiKey} className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Key
              </Button>
              <Button onClick={handleSave} disabled={inputValue === apiKey} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Usage Statistics
              </CardTitle>
              <CardDescription>
                Track the total number of tokens consumed by the AI models across all tools.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total Tokens Used</p>
                  <p className="text-2xl font-mono font-bold text-primary">{totalTokens.toLocaleString()}</p>
                </div>
                <Button variant="secondary" onClick={handleResetTokens} disabled={totalTokens === 0}>
                  Reset Counter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
