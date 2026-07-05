import React, { useState } from 'react';
import { Search, ExternalLink, Lightbulb, Compass, Award, TrendingUp, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const categories = {
  sports: { keywords: ['رياضي', 'كرة', 'sport', 'football', 'betting', 'مراهنة'], name: 'Sports Betting', icon: Award, color: 'bg-chart-1/20 text-chart-1 border-chart-1/30' },
  noDeposit: { keywords: ['ترحيب', 'مجاني', 'free', 'no deposit', 'welcome', 'بونص'], name: 'No-Deposit Bonuses', icon: GiftIcon, color: 'bg-chart-2/20 text-chart-2 border-chart-2/30' },
  casino: { keywords: ['كازينو', 'casino', 'بوكر', 'poker', 'slots', 'سلوتس'], name: 'Casino & Poker', icon: Compass, color: 'bg-chart-3/20 text-chart-3 border-chart-3/30' },
  crypto: { keywords: ['عملة', 'بيتكوين', 'crypto', 'bitcoin', 'eth', 'تشفير'], name: 'Crypto & Web3', icon: TrendingUp, color: 'bg-chart-4/20 text-chart-4 border-chart-4/30' }
};

const ALL_LINKS = [
  { title: 'AskGamblers Reviews', url: 'https://askgamblers.com', cat: 'general', desc: 'Trusted casino reviews and dispute resolution.' },
  { title: 'Gambling.com', url: 'https://gambling.com', cat: 'general', desc: 'Comprehensive gambling guides and top lists.' },
  { title: 'CasinosAnalyzer', url: 'https://casinosanalyzer.com', cat: 'general', desc: 'Bonus codes and detailed casino analysis.' },
  
  { title: 'Bet365 Sportsbook', url: '#', cat: 'sports', desc: 'Leading sports betting platform with live streaming.' },
  { title: 'DraftKings Promos', url: '#', cat: 'sports', desc: 'Daily fantasy and sportsbook promotions.' },
  { title: 'FreeSpins No Deposit', url: '#', cat: 'noDeposit', desc: 'Aggregator of welcome free spins.' },
  { title: 'WelcomeBonus Finder', url: '#', cat: 'noDeposit', desc: 'Find the highest matching deposit bonuses.' },
  { title: 'PokerStars Casino', url: '#', cat: 'casino', desc: 'Top tier poker rooms and casino games.' },
  { title: 'VegasSlots Online', url: '#', cat: 'casino', desc: 'Play free slots and find real money casinos.' },
  { title: 'Stake Crypto Casino', url: '#', cat: 'crypto', desc: 'Premier cryptocurrency casino and sportsbook.' },
  { title: 'BitStarz', url: '#', cat: 'crypto', desc: 'Bitcoin casino with fast withdrawals.' }
];

function GiftIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect width="20" height="5" x="2" y="7" />
      <line x1="12" x2="12" y1="22" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

export default function Rewards() {
  const [query, setQuery] = useState('');

  const activeCategories = new Set<string>();
  const qLower = query.toLowerCase();

  if (qLower) {
    Object.entries(categories).forEach(([key, cat]) => {
      if (cat.keywords.some(kw => qLower.includes(kw))) {
        activeCategories.add(key);
      }
    });
  }

  const filteredLinks = ALL_LINKS.filter(link => {
    if (link.cat === 'general') return true;
    if (!query) return true;
    return activeCategories.has(link.cat);
  });

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Rewards Researcher</h1>
          <p className="text-muted-foreground">
            الباحث عن المكافآت / Promo and Casino link aggregator
          </p>
        </div>

        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords (e.g., crypto, free, كازينو, رياضي)..."
            className="pl-10 py-6 text-lg bg-card border-border shadow-sm focus-visible:ring-primary"
            dir="auto"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              Discovered Links
            </h2>
            
            <div className="grid gap-4">
              {filteredLinks.map((link, i) => {
                const isGeneral = link.cat === 'general';
                const catInfo = !isGeneral ? categories[link.cat as keyof typeof categories] : null;
                
                return (
                  <Card key={i} className="hover:border-primary/30 transition-colors bg-card/50">
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <a href={link.url} target="_blank" rel="noreferrer" className="text-lg font-medium text-foreground hover:text-primary flex items-center gap-1 group">
                            {link.title}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                          {isGeneral ? (
                            <Badge variant="outline" className="text-[10px] bg-background">General</Badge>
                          ) : (
                            <Badge variant="outline" className={`text-[10px] border ${catInfo?.color}`}>
                              {catInfo?.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{link.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-primary/5 border-primary/20 sticky top-8">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <Lightbulb className="w-5 h-5" />
                  Golden Tips (نصائح ذهبية)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                  <div>
                    <h4 className="text-sm font-semibold">Wagering Requirements</h4>
                    <p className="text-xs text-muted-foreground mt-1">Always check the playthrough multiplier (e.g. 30x) before claiming a no-deposit bonus.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                  <div>
                    <h4 className="text-sm font-semibold">Verify Licenses</h4>
                    <p className="text-xs text-muted-foreground mt-1">Scroll to the footer to ensure Curacao, MGA, or UKGC licensing is present and valid.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                  <div>
                    <h4 className="text-sm font-semibold">Reddit Recon</h4>
                    <p className="text-xs text-muted-foreground mt-1">Search `site:reddit.com [casino name]` to find real player withdrawal experiences.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
                  <div>
                    <h4 className="text-sm font-semibold">HTTPS & Security</h4>
                    <p className="text-xs text-muted-foreground mt-1">Never input crypto keys or card details on non-HTTPS sites.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
