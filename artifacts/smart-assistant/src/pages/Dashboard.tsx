import { Link } from 'wouter';
import { Bot, BarChart, Gift, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const tools = [
  {
    title: 'AI Code Assistant',
    description: 'Expert coding help with context-aware explanations and markdown support.',
    icon: Bot,
    path: '/chat',
    color: 'text-primary'
  },
  {
    title: 'Data Analyzer',
    description: 'Upload CSV/Excel datasets to get instant AI-powered statistical insights.',
    icon: BarChart,
    path: '/analyze',
    color: 'text-chart-2'
  },
  {
    title: 'Rewards Researcher',
    description: 'Quickly categorize links and discover promotional patterns across platforms.',
    icon: Gift,
    path: '/rewards',
    color: 'text-chart-3'
  }
];

export default function Dashboard() {
  return (
    <div className="h-full overflow-y-auto p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            Welcome to Smart Assistant
          </h1>
          <p className="text-lg text-muted-foreground">
            A precise, command-center inspired toolkit designed for professionals. 
            Navigate your workflow with AI-assisted code help, rapid data analysis, and intelligent research tooling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Card key={tool.path} className="flex flex-col hover:border-primary/50 transition-colors bg-card hover:bg-card/80 border-border shadow-sm">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center border border-border mb-4">
                  <tool.icon className={`w-6 h-6 ${tool.color}`} />
                </div>
                <CardTitle className="text-xl">{tool.title}</CardTitle>
                <CardDescription className="text-sm mt-2">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-4">
                <Link href={tool.path}>
                  <Button variant="ghost" className="w-full justify-between hover:bg-primary/10 hover:text-primary">
                    Launch Tool
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
