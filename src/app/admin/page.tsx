'use client';

import React, { useState } from 'react';
import { Position } from '@/types';
import { dataManager } from '@/lib/dataManager';
import { motion } from 'framer-motion';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MorphButton } from '@/components/ui/MorphButton';
import { IconLogout } from "@tabler/icons-react";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin?callbackUrl=/admin");
    }
  }, [session, status, router]);
  const [selectedPosition, setSelectedPosition] = useState<Position>('QB');
  const [selectedScoringFormat, setSelectedScoringFormat] = useState<'standard' | 'ppr' | 'half-ppr'>('ppr');
  const [importType, setImportType] = useState<'csv' | 'url' | 'text' | 'scrape' | 'api' | 'session' | 'free'>('csv');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST'];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setMessage('');
    
    try {
      console.log('Starting CSV import for file:', file.name);
      const players = await dataManager.importFromCSV(file, selectedPosition);
      console.log('Imported players:', players);
      
      if (players.length === 0) {
        setMessage('No players found in CSV. Check format: name,team,position,rank');
      } else {
        setMessage(`✅ Successfully imported ${players.length} ${selectedPosition} players`);
        
        // Show first few players for verification
        const preview = players.slice(0, 3).map(p => `${p.name} (${p.team})`).join(', ');
        setMessage(prev => prev + `\n\nPreview: ${preview}`);
      }
    } catch (error) {
      console.error('CSV import error:', error);
      setMessage(`❌ Error importing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setIsLoading(false);
  };

  const handleURLImport = async () => {
    if (!urlInput) return;

    setIsLoading(true);
    try {
      const players = await dataManager.importFromURL(urlInput, selectedPosition);
      setMessage(`Successfully imported ${players.length} ${selectedPosition} players from URL`);
    } catch (error) {
      setMessage(`Error importing from URL: ${error}`);
    }
    setIsLoading(false);
  };

  const handleTextImport = () => {
    if (!textInput) return;

    setIsLoading(true);
    try {
      const players = dataManager.parseRankingsText(textInput, selectedPosition);
      setMessage(`Successfully parsed ${players.length} ${selectedPosition} players from text`);
    } catch (error) {
      setMessage(`Error parsing text: ${error}`);
    }
    setIsLoading(false);
  };

  const handleScrape = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      console.log('Starting scrape for position:', selectedPosition);
      const players = await dataManager.scrapeFantasyPros(selectedPosition.toLowerCase());
      console.log('Scraped players:', players);
      
      if (players.length === 0) {
        setMessage('⚠️ No players found from scraping. This might be due to CORS restrictions or website changes.');
      } else {
        setMessage(`✅ Successfully scraped ${players.length} ${selectedPosition} players from FantasyPros`);
        
        // Show first few players for verification
        const preview = players.slice(0, 3).map(p => `${p.name} (${p.team})`).join(', ');
        setMessage(prev => prev + `\n\nPreview: ${preview}`);
      }
    } catch (error) {
      console.error('Scraping error:', error);
      setMessage(`❌ Error scraping data: ${error instanceof Error ? error.message : 'Unknown error'}\n\nNote: Web scraping may be blocked by CORS policies.`);
    }
    setIsLoading(false);
  };

  const handleExport = () => {
    const csv = dataManager.exportToCSV(selectedPosition);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPosition}_rankings.csv`;
    a.click();
  };

  const handleExportTypeScript = () => {
    const ts = dataManager.exportToTypeScript();
    const blob = new Blob([ts], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sampleData.ts';
    a.click();
  };

  const handleAPIFetch = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      // First validate API key if provided
      if (apiKey) {
        const validateResponse = await fetch('/api/fantasy-pros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey })
        });
        
        const validateResult = await validateResponse.json();
        if (!validateResult.success) {
          setMessage(`❌ ${validateResult.error}`);
          setIsLoading(false);
          return;
        }
      }

      // Fetch rankings for selected position
      const response = await fetch(`/api/fantasy-pros?position=${selectedPosition}`);
      const result = await response.json();

      if (result.success) {
        setMessage(`✅ Successfully fetched ${result.players.length} ${selectedPosition} players from FantasyPros API\n\nTop 5:\n${result.players.slice(0, 5).map((p: any) => `${p.averageRank}. ${p.name} (${p.team})`).join('\n')}`);
      } else {
        setMessage(`⚠️ ${result.error}\n\nUsing ${result.players.length} cached players instead.`);
      }
    } catch (error) {
      setMessage(`❌ Error fetching from API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setIsLoading(false);
  };

  const handleSessionFetch = async () => {
    setIsLoading(true);
    setMessage('');

    if (!username || !password) {
      setMessage('❌ Please enter both username and password');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/fantasy-pros-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          position: selectedPosition,
          scoringFormat: selectedScoringFormat
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`✅ Successfully fetched ${result.players.length} ${selectedPosition} players from FantasyPros (${selectedScoringFormat.toUpperCase()})\n\nWeek: ${result.week}\nTop 5:\n${result.players.slice(0, 5).map((p: any) => `${p.averageRank}. ${p.name} (${p.team})`).join('\n')}`);
      } else {
        setMessage(`❌ ${result.error}\n\n${result.note || ''}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setIsLoading(false);
  };

  const handleSessionFetchAll = async () => {
    setIsLoading(true);
    setMessage('');

    if (!username || !password) {
      setMessage('❌ Please enter both username and password');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/fantasy-pros-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          scoringFormat: selectedScoringFormat
          // No position = fetch all
        })
      });

      const result = await response.json();

      if (result.success) {
        const summary = Object.entries(result.allRankings as Record<string, any[]>)
          .map(([pos, players]) => `${pos}: ${players.length} players`)
          .join('\n');
        setMessage(`✅ Successfully fetched all positions from FantasyPros (${selectedScoringFormat.toUpperCase()})\n\nWeek: ${result.week}\nTotal Players: ${result.totalPlayers}\n\n${summary}`);
      } else {
        setMessage(`❌ ${result.error}\n\n${result.note || ''}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setIsLoading(false);
  };

  const handleFreeFetch = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/fantasy-pros-free?position=${selectedPosition}&scoringFormat=${selectedScoringFormat}`);
      const result = await response.json();

      if (result.success) {
        setMessage(`✅ ${result.message}\n\nTop 5:\n${result.players.slice(0, 5).map((p: any) => `${p.averageRank}. ${p.name} (${p.team})`).join('\n')}`);
      } else {
        setMessage(`⚠️ ${result.error}\n\n${result.note || ''}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setIsLoading(false);
  };

  const handleFreeFetchAll = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/fantasy-pros-free?scoringFormat=${selectedScoringFormat}`);
      const result = await response.json();

      if (result.success) {
        const summary = Object.entries(result.allRankings as Record<string, any[]>)
          .map(([pos, players]) => `${pos}: ${players.length} players`)
          .join('\n');
        setMessage(`✅ ${result.message}\n\n${summary}`);
      } else {
        setMessage(`⚠️ ${result.error}\n\n${result.note || ''}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setIsLoading(false);
  };

  const handleDebugFantasyPros = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/debug-fantasypros');
      const result = await response.json();

      if (result.success) {
        const csrfResults = result.csrfPatternResults
          .map((r: any) => `${r.pattern}: ${r.found ? '✅ ' + r.token : '❌'}`)
          .join('\n');
        
        setMessage(`🔍 FantasyPros Debug Results:\n\nLogin page length: ${result.loginPageLength}\nHas cookies: ${result.hasCookies}\n\nCSRF Token Patterns:\n${csrfResults}\n\nToken-like strings found: ${result.tokenLikeStrings.length}\nInput fields with 'csrf': ${result.inputFields.length}\nForms found: ${result.forms.length}`);
      } else {
        setMessage(`❌ Debug failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Debug error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setIsLoading(false);
  };

  // Show loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-electric-blue mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render if authenticated
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with sign out */}
        <div className="flex justify-between items-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-center bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text"
          >
            Fantasy Football Data Manager
          </motion.h1>
          <MorphButton
            onClick={() => signOut({ callbackUrl: "/" })}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <IconLogout className="w-4 h-4" />
            Sign Out
          </MorphButton>
        </div>

        {/* Position Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Select Position
          </label>
          <div className="flex gap-2">
            {positions.map(pos => (
              <button
                key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={`px-4 py-2 rounded-md transition-all ${
                  selectedPosition === pos
                    ? 'bg-cyan-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Scoring Format Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Scoring Format
          </label>
          <select 
            value={selectedScoringFormat}
            onChange={(e) => setSelectedScoringFormat(e.target.value as 'standard' | 'ppr' | 'half-ppr')}
            className="w-full max-w-xs px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          >
            <option value="standard">Standard</option>
            <option value="ppr">PPR</option>
            <option value="half-ppr">Half PPR</option>
          </select>
        </div>

        {/* Import Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Import Method
          </label>
          <div className="flex gap-2">
            {[
              { value: 'csv', label: 'CSV File' },
              { value: 'url', label: 'CSV URL' },
              { value: 'text', label: 'Text Rankings' },
              { value: 'scrape', label: 'Scrape Web' },
              { value: 'free', label: 'Free Rankings' },
              { value: 'api', label: 'FantasyPros API' },
              { value: 'session', label: 'FantasyPros Login' }
            ].map(type => (
              <button
                key={type.value}
                onClick={() => setImportType(type.value as any)}
                className={`px-4 py-2 rounded-md transition-all ${
                  importType === type.value
                    ? 'bg-green-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Import Interface */}
        <motion.div 
          key={importType}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-lg p-6 mb-6"
        >
          {importType === 'csv' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
                disabled={isLoading}
              />
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-500">
                  Expected format: name, team, position, rank, projected_points
                </p>
                <p className="text-sm text-blue-400">
                  <a href="/sample-qb-rankings.csv" download className="underline">
                    Download sample CSV file
                  </a>
                </p>
              </div>
            </div>
          )}

          {importType === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                CSV URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/rankings.csv"
                  className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
                  disabled={isLoading}
                />
                <button
                  onClick={handleURLImport}
                  disabled={isLoading || !urlInput}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 rounded-md transition-colors"
                >
                  Import
                </button>
              </div>
            </div>
          )}

          {importType === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Paste Rankings Text
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="1. Player Name (TEAM)&#10;2. Another Player (TEAM)&#10;..."
                rows={10}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-white font-mono text-sm"
                disabled={isLoading}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleTextImport}
                  disabled={isLoading || !textInput}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 rounded-md transition-colors"
                >
                  Parse Text
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Supports formats: "1. Player Name (TEAM)", "Player Name - TEAM", etc.
              </p>
            </div>
          )}

          {importType === 'scrape' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Scrape FantasyPros
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleScrape}
                  disabled={isLoading}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 rounded-md transition-colors"
                >
                  Scrape {selectedPosition} Rankings
                </button>
                <button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const response = await fetch('/api/test-scrape');
                      const result = await response.json();
                      setMessage(`🔍 Test Results:\n\nURL: ${result.url}\nHTML Length: ${result.htmlLength}\nHas Content: ${result.hasContent}\nHas JS: ${result.hasJavaScript}\nHas Table: ${result.hasTable}\n\nSample Players Found: ${result.samplePlayers?.length || 0}\n${result.samplePlayers?.map((p: any) => `${p.rank}. ${p.name} (${p.team})`).join('\n') || 'None'}`);
                    } catch (error) {
                      setMessage(`❌ Test failed: ${error}`);
                    }
                    setIsLoading(false);
                  }}
                  disabled={isLoading}
                  className="px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 rounded-md transition-colors text-sm"
                >
                  Test Scrape
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Note: FantasyPros uses JavaScript to load rankings. Test scrape first to see what data is available.
              </p>
              <p className="text-sm text-blue-400 mt-1">
                Target URL: https://www.fantasypros.com/nfl/rankings/half-point-ppr-rb-cheatsheets.php
              </p>
            </div>
          )}

          {importType === 'api' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                FantasyPros API
              </label>
              <div className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your FantasyPros API key (optional)"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
                    disabled={isLoading}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    API key will be used for this session only. Get your key from FantasyPros.
                  </p>
                </div>
                <button
                  onClick={handleAPIFetch}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 rounded-md transition-colors font-medium"
                >
                  Fetch {selectedPosition} Rankings from API
                </button>
                <div className="text-sm text-blue-400 space-y-1">
                  <p>✨ This uses the official FantasyPros API v2</p>
                  <p>📊 Returns expert consensus rankings with tiers</p>
                  <p>🔄 Updates automatically with latest data</p>
                </div>
              </div>
            </div>
          )}

          {importType === 'free' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Free FantasyPros Rankings
              </label>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={handleFreeFetch}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 rounded-md transition-colors font-medium"
                  >
                    Get {selectedPosition} Rankings
                  </button>
                  <button
                    onClick={handleFreeFetchAll}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 rounded-md transition-colors font-medium"
                  >
                    Get All Positions
                  </button>
                </div>
                <button
                  onClick={handleDebugFantasyPros}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 rounded-md transition-colors text-sm"
                >
                  🔍 Debug FantasyPros Structure
                </button>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>🆓 Attempts to access public rankings without login</p>
                  <p>⚡ Fastest method - no authentication required</p>
                  <p>📊 May have limited data compared to premium access</p>
                  <p className="text-yellow-400">💡 Try this first before using login methods</p>
                </div>
              </div>
            </div>
          )}

          {importType === 'session' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                FantasyPros Login
              </label>
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="FantasyPros username"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="FantasyPros password"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSessionFetch}
                    disabled={isLoading || !username || !password}
                    className="flex-1 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 rounded-md transition-colors font-medium"
                  >
                    Fetch {selectedPosition} Rankings
                  </button>
                  <button
                    onClick={handleSessionFetchAll}
                    disabled={isLoading || !username || !password}
                    className="flex-1 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 rounded-md transition-colors font-medium"
                  >
                    Fetch All Positions
                  </button>
                </div>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>🔐 Uses your FantasyPros account to download official data</p>
                  <p>📊 Downloads XLS files and parses expert consensus rankings</p>
                  <p>🚀 No API key needed - just your regular login</p>
                  <p className="text-yellow-400">⚠️ Credentials are used for this session only</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Export Section */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-white mb-4">Export Data</h3>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black rounded-md transition-colors"
            >
              Export {selectedPosition} CSV
            </button>
            <button
              onClick={handleExportTypeScript}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-black rounded-md transition-colors"
            >
              Export TypeScript
            </button>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-md ${
              message.includes('❌') || message.includes('Error')
                ? 'bg-red-900 border border-red-700 text-red-200'
                : message.includes('⚠️')
                ? 'bg-yellow-900 border border-yellow-700 text-yellow-200'
                : 'bg-green-900 border border-green-700 text-green-200'
            }`}
          >
            <pre className="whitespace-pre-wrap text-sm">{message}</pre>
          </motion.div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-6 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
              <p className="text-white mt-2">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}