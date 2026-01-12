import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Languages, RefreshCw, Check, AlertCircle, Copy, Download, Globe } from 'lucide-react';
import { translations, languageNames, Language } from '@/i18n/translations';

interface TranslationStats {
  language: Language;
  totalKeys: number;
  translatedKeys: number;
  percentage: number;
}

const TARGET_LANGUAGES: Language[] = ['hu', 'zh', 'vi', 'fr', 'it', 'es', 'de', 'ko'];

// Count all string keys in a translation object recursively
const countTranslationKeys = (obj: Record<string, unknown>, count = 0): number => {
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'string') {
      count++;
    } else if (Array.isArray(value)) {
      count += value.filter(v => typeof v === 'string').length;
    } else if (typeof value === 'object' && value !== null) {
      count = countTranslationKeys(value as Record<string, unknown>, count);
    }
  }
  return count;
};

// Check if a value is non-empty
const isTranslated = (value: unknown): boolean => {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(v => typeof v === 'string' && v.trim().length > 0);
  return false;
};

// Count translated keys in a translation object
const countTranslatedKeys = (obj: Record<string, unknown>, count = 0): number => {
  for (const key in obj) {
    const value = obj[key];
    if (isTranslated(value)) {
      if (typeof value === 'string') count++;
      else if (Array.isArray(value)) count += value.filter(v => typeof v === 'string' && v.trim().length > 0).length;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      count = countTranslatedKeys(value as Record<string, unknown>, count);
    }
  }
  return count;
};

const AdminTranslations: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);
  const [stats, setStats] = useState<TranslationStats[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState<string | null>(null);
  const [translationResults, setTranslationResults] = useState<Record<string, unknown> | null>(null);

  // Check admin access
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      });
      if (error || !data) {
        navigate('/');
        return;
      }

      setIsAdmin(true);
      calculateStats();
      setLoading(false);
    };

    checkAdminAccess();
  }, [user, navigate]);

  // Calculate translation stats for all languages
  const calculateStats = () => {
    const englishKeys = countTranslationKeys(translations.en);
    
    const langStats: TranslationStats[] = TARGET_LANGUAGES.map(lang => {
      const langTranslations = (translations as Record<string, Record<string, unknown>>)[lang];
      const translatedKeys = langTranslations ? countTranslatedKeys(langTranslations) : 0;
      const percentage = Math.round((translatedKeys / englishKeys) * 100);
      
      return {
        language: lang,
        totalKeys: englishKeys,
        translatedKeys,
        percentage,
      };
    });

    setStats(langStats);
  };

  const handleLanguageToggle = (lang: Language) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) 
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  const selectAllLanguages = () => {
    setSelectedLanguages(TARGET_LANGUAGES);
  };

  const deselectAllLanguages = () => {
    setSelectedLanguages([]);
  };

  const handleTranslate = async () => {
    if (selectedLanguages.length === 0) {
      toast.error('Please select at least one language');
      return;
    }

    setTranslating(true);
    setProgress(0);
    setTranslationResults(null);

    try {
      // Get English translations to translate
      const englishTranslations = translations.en;
      
      setCurrentLanguage('Preparing...');
      
      const { data, error } = await supabase.functions.invoke('translate-i18n', {
        body: {
          englishTranslations,
          targetLanguages: selectedLanguages,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setTranslationResults(data.translations);
        setProgress(100);
        toast.success(`Translated to ${data.stats.languagesCompleted} languages (${data.stats.stringsTranslated} strings each)`);
      } else {
        throw new Error(data?.error || 'Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(error instanceof Error ? error.message : 'Translation failed');
    } finally {
      setTranslating(false);
      setCurrentLanguage(null);
    }
  };

  const copyTranslations = async () => {
    if (!translationResults) return;
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(translationResults, null, 2));
      toast.success('Translations copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy translations');
    }
  };

  const downloadTranslations = () => {
    if (!translationResults) return;
    
    const blob = new Blob([JSON.stringify(translationResults, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translations-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Translations downloaded');
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Languages className="h-6 w-6 text-primary" />
              Translation Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Auto-translate app content to all supported languages using Google Cloud Translation API
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {TARGET_LANGUAGES.length + 1} Languages
          </Badge>
        </div>

        {/* Translation Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Translation Coverage</CardTitle>
            <CardDescription>
              Based on {countTranslationKeys(translations.en)} translatable strings in English
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.map(stat => (
                <div key={stat.language} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{languageNames[stat.language].flag}</span>
                      <span className="font-medium">{languageNames[stat.language].name}</span>
                    </div>
                    <span className={`text-sm font-bold ${getStatusColor(stat.percentage)}`}>
                      {stat.percentage}%
                    </span>
                  </div>
                  <Progress 
                    value={stat.percentage} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {stat.translatedKeys} / {stat.totalKeys} strings
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Translation Tool */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generate Translations</CardTitle>
            <CardDescription>
              Select languages to translate and generate new translations using AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Language Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Select Target Languages</label>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={selectAllLanguages}
                    disabled={translating}
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={deselectAllLanguages}
                    disabled={translating}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TARGET_LANGUAGES.map(lang => (
                  <div
                    key={lang}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedLanguages.includes(lang) 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => !translating && handleLanguageToggle(lang)}
                  >
                    <Checkbox
                      checked={selectedLanguages.includes(lang)}
                      disabled={translating}
                      onCheckedChange={() => handleLanguageToggle(lang)}
                    />
                    <span className="text-lg">{languageNames[lang].flag}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{languageNames[lang].name}</p>
                      <p className="text-xs text-muted-foreground">{languageNames[lang].nativeName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress */}
            {translating && (
              <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {currentLanguage || 'Translating...'}
                  </span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleTranslate}
                disabled={translating || selectedLanguages.length === 0}
                className="gap-2"
              >
                {translating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <Languages className="h-4 w-4" />
                    Translate {selectedLanguages.length > 0 ? `(${selectedLanguages.length} languages)` : ''}
                  </>
                )}
              </Button>

              {translationResults && (
                <>
                  <Button variant="outline" onClick={copyTranslations} className="gap-2">
                    <Copy className="h-4 w-4" />
                    Copy JSON
                  </Button>
                  <Button variant="outline" onClick={downloadTranslations} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Translation Results */}
        {translationResults && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Translation Results
              </CardTitle>
              <CardDescription>
                Copy this JSON and update src/i18n/translations.ts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] rounded-lg border bg-muted/30 p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(translationResults, null, 2)}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              How to Use
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal list-inside space-y-2">
              <li>Select the languages you want to translate to</li>
              <li>Click "Translate" to generate translations using Google Cloud Translation API</li>
              <li>Review the generated JSON output</li>
              <li>Copy or download the translations</li>
              <li>
                Update <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">src/i18n/translations.ts</code> 
                {" "}by merging the new translations into the existing file
              </li>
              <li>Test the translations in the app by switching languages</li>
            </ol>
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-600 dark:text-amber-400 text-xs">
                <strong>Note:</strong> Machine translations may need manual review for accuracy. 
                Consider having native speakers review critical user-facing content.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminTranslations;
