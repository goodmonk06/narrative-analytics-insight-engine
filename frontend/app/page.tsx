'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ThemePerformance {
  theme: string;
  count: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgEngagementScore: number;
}

interface DashboardStats {
  totalContent: number;
  totalAnalyses: number;
  totalEngagement: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  avgEngagementPerContent: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  } | null;
}

export default function Home() {
  const { data: themesData } = useSWR<{ themes: ThemePerformance[] }>(
    `${API_URL}/api/insights/themes?limit=10`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: tonesData } = useSWR<{ tones: any[] }>(
    `${API_URL}/api/insights/tones?limit=8`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: archetypesData } = useSWR<{ archetypes: any[] }>(
    `${API_URL}/api/insights/archetypes?limit=8`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: dashboardData } = useSWR<{ stats: DashboardStats }>(
    `${API_URL}/api/insights/dashboard`,
    fetcher,
    { refreshInterval: 10000 }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Narrative Analytics Dashboard
          </h1>
          <p className="text-purple-200 text-lg">
            Discover which themes, tones, and archetypes drive the highest engagement
          </p>
        </header>

        {/* Stats Overview */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <div className="text-purple-200 text-sm uppercase mb-2">Total Content</div>
              <div className="text-4xl font-bold text-white">
                {dashboardData.stats.totalContent}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <div className="text-purple-200 text-sm uppercase mb-2">Analyses</div>
              <div className="text-4xl font-bold text-white">
                {dashboardData.stats.totalAnalyses}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <div className="text-purple-200 text-sm uppercase mb-2">Total Views</div>
              <div className="text-4xl font-bold text-white">
                {dashboardData.stats.totalEngagement.views.toLocaleString()}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <div className="text-purple-200 text-sm uppercase mb-2">Total Engagement</div>
              <div className="text-4xl font-bold text-white">
                {(
                  dashboardData.stats.totalEngagement.likes +
                  dashboardData.stats.totalEngagement.comments +
                  dashboardData.stats.totalEngagement.shares
                ).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Top Performing Themes */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 mb-8 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-6">
            Top Performing Themes
          </h2>
          {themesData && themesData.themes.length > 0 ? (
            <>
              <div className="mb-8">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={themesData.themes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis
                      dataKey="theme"
                      stroke="#e9d5ff"
                      angle={-45}
                      textAnchor="end"
                      height={120}
                    />
                    <YAxis stroke="#e9d5ff" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e1b4b',
                        border: '1px solid #a78bfa',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="avgEngagementScore" fill="#a78bfa" name="Engagement Score" />
                    <Bar dataKey="avgViews" fill="#60a5fa" name="Avg Views" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {themesData.themes.slice(0, 5).map((theme, idx) => (
                  <div
                    key={theme.theme}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-purple-300">#{idx + 1}</div>
                      <div>
                        <div className="text-lg font-semibold text-white">{theme.theme}</div>
                        <div className="text-sm text-purple-200">
                          {theme.count} pieces of content
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {theme.avgEngagementScore.toLocaleString()}
                      </div>
                      <div className="text-sm text-purple-200">engagement score</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-purple-200 text-center py-12">
              No theme data available yet. Add content and analyses to see insights.
            </div>
          )}
        </div>

        {/* Tones and Archetypes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performing Tones */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">
              Top Performing Tones
            </h2>
            {tonesData && tonesData.tones.length > 0 ? (
              <div className="space-y-3">
                {tonesData.tones.map((tone, idx) => (
                  <div
                    key={tone.tone}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-bold text-purple-300">#{idx + 1}</div>
                      <div>
                        <div className="font-semibold text-white">{tone.tone}</div>
                        <div className="text-xs text-purple-200">{tone.count} uses</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">
                        {tone.avgEngagementScore.toLocaleString()}
                      </div>
                      <div className="text-xs text-purple-200">score</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-purple-200 text-center py-8">
                No tone data available
              </div>
            )}
          </div>

          {/* Top Performing Archetypes */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">
              Top Performing Archetypes
            </h2>
            {archetypesData && archetypesData.archetypes.length > 0 ? (
              <div className="space-y-3">
                {archetypesData.archetypes.map((archetype, idx) => (
                  <div
                    key={archetype.archetype}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-bold text-purple-300">#{idx + 1}</div>
                      <div>
                        <div className="font-semibold text-white">{archetype.archetype}</div>
                        <div className="text-xs text-purple-200">{archetype.count} uses</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">
                        {archetype.avgEngagementScore.toLocaleString()}
                      </div>
                      <div className="text-xs text-purple-200">score</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-purple-200 text-center py-8">
                No archetype data available
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 text-center text-purple-200 text-sm">
          <p>Narrative Analytics Engine - Powered by AI-driven insights</p>
        </footer>
      </div>
    </div>
  );
}
