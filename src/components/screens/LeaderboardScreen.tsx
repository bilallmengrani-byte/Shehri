import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  Users 
} from 'lucide-react';
import { Card } from '../ui/Card';
import { gamificationStore } from '../../services/userStore';
import { useTranslation } from '../../contexts/LanguageContext';
import { CitizenRank, NeighborhoodLeaderboardEntry, UserProfile } from '../../types';

export const LeaderboardScreen: React.FC = () => {
  const { locale, isRTL, t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'individual' | 'neighborhood'>('individual');
  const [citizens, setCitizens] = useState<CitizenRank[]>(gamificationStore.getIndividualLeaderboard());
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodLeaderboardEntry[]>(
    gamificationStore.getNeighborhoodLeaderboard()
  );
  const [user, setUser] = useState<UserProfile>(gamificationStore.getUser());

  useEffect(() => {
    const unsub = gamificationStore.subscribe(() => {
      setCitizens(gamificationStore.getIndividualLeaderboard());
      setNeighborhoods(gamificationStore.getNeighborhoodLeaderboard());
      setUser(gamificationStore.getUser());
    });
    return () => unsub();
  }, []);

  const topThree = citizens.slice(0, 3);
  const remainingCitizens = citizens.slice(3);

  return (
    <div className="p-4 flex flex-col gap-4 animate-fade-in">
      {/* Top Title Banner */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            {t('leaderboard.title')}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {t('leaderboard.subtitle')}
          </p>
        </div>
        <span className="p-2.5 rounded-2xl bg-amber-100 text-amber-900 shadow-2xs border border-amber-200 shrink-0">
          <Trophy className="w-5 h-5 text-amber-600" />
        </span>
      </div>

      {/* Two Switchable Tabs: Individual vs Neighborhood */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 rounded-2xl">
        <button
          onClick={() => setActiveTab('individual')}
          className={`flex-1 py-2 text-xs font-medium rounded-xl transition cursor-pointer text-center ${
            activeTab === 'individual'
              ? 'bg-white text-stone-900 shadow-xs font-bold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          {t('leaderboard.individual')}
        </button>
        <button
          onClick={() => setActiveTab('neighborhood')}
          className={`flex-1 py-2 text-xs font-medium rounded-xl transition cursor-pointer text-center ${
            activeTab === 'neighborhood'
              ? 'bg-white text-[#0F5132] shadow-xs font-bold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          {t('leaderboard.neighborhoods')}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. INDIVIDUAL LEADERBOARD                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'individual' && (
        <div className="flex flex-col gap-3.5">
          {/* Top 3 Podium Cards */}
          {topThree.length >= 3 && (
            <div className="pt-4 pb-1 grid grid-cols-3 gap-2 items-end">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-stone-200 flex items-center justify-center font-bold text-stone-700 text-sm shadow-xs border-2 border-stone-300">
                    {topThree[1].avatarSeed}
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-stone-400 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                    🥈
                  </span>
                </div>
                <p className="text-xs font-bold text-stone-800 text-center truncate w-full mt-1">
                  {topThree[1].name.split(' ')[0]}
                </p>
                <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                  {topThree[1].points.toLocaleString()}
                </span>
                <div className="w-full h-16 bg-gradient-to-t from-stone-200 to-stone-100 rounded-t-2xl mt-2 border border-stone-200/80 flex items-center justify-center text-[10px] font-bold text-stone-400">
                  #2
                </div>
              </div>

              {/* 1st Place (Gold / Crown) */}
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="w-16 h-16 rounded-2xl bg-amber-400/25 flex items-center justify-center font-extrabold text-[#0F5132] text-base shadow-sm border-2 border-amber-400 ring-4 ring-amber-300/30">
                    {topThree[0].avatarSeed}
                  </div>
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-base">
                    👑
                  </span>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-black text-[11px] flex items-center justify-center shadow-xs">
                    🥇
                  </span>
                </div>
                <p className="text-xs font-black text-[#0F5132] text-center truncate w-full mt-1">
                  {topThree[0].name.split(' ')[0]}
                </p>
                <span className="text-xs font-extrabold text-amber-800 flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3 fill-amber-500 text-amber-600" />
                  {topThree[0].points.toLocaleString()}
                </span>
                <div className="w-full h-24 bg-gradient-to-t from-amber-200/80 via-amber-100/60 to-amber-50 rounded-t-2xl mt-2 border border-amber-300 flex items-center justify-center text-xs font-extrabold text-amber-700">
                  #1
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100/60 flex items-center justify-center font-bold text-amber-900 text-sm shadow-xs border-2 border-amber-300">
                    {topThree[2].avatarSeed}
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-amber-700 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                    🥉
                  </span>
                </div>
                <p className="text-xs font-bold text-stone-800 text-center truncate w-full mt-1">
                  {topThree[2].name.split(' ')[0]}
                </p>
                <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                  {topThree[2].points.toLocaleString()}
                </span>
                <div className="w-full h-12 bg-gradient-to-t from-amber-200/40 to-stone-100 rounded-t-2xl mt-2 border border-stone-200/80 flex items-center justify-center text-[10px] font-bold text-stone-400">
                  #3
                </div>
              </div>
            </div>
          )}

          {/* User's Floating Rank Sticky Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-100 via-emerald-50 to-stone-50 border-2 border-[#0F5132]/30 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-[#0F5132] text-white text-xs font-bold flex items-center justify-center shrink-0">
                #{user.rank}
              </span>
              <div>
                <p className="text-xs font-bold text-stone-900">
                  {t('leaderboard.yourRanking')}: #{user.rank}
                </p>
                <p className="text-[11px] text-[#0F5132] font-medium">
                  {user.cleanPoints.toLocaleString()} {t('common.cleanPoints')} • {t('common.sahiwalPunjab')}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-white px-2 py-1 rounded-xl border border-amber-200 shadow-2xs">
              Live
            </span>
          </div>

          {/* Remaining Ranked Citizens List */}
          <div className="flex flex-col gap-2">
            {remainingCitizens.map((citizen) => (
              <div
                key={citizen.id}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                  citizen.isCurrentUser
                    ? 'bg-emerald-50/90 border-[#0F5132] shadow-xs ring-2 ring-[#0F5132]/20'
                    : 'bg-white border-stone-200/80 hover:bg-stone-50/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-center text-xs font-black text-stone-400 shrink-0">
                    #{citizen.rank}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      citizen.isCurrentUser
                        ? 'bg-[#0F5132] text-white'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {citizen.avatarSeed}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {citizen.name}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">
                      {citizen.neighborhood}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end text-end shrink-0">
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-amber-500 text-amber-600" />
                    {citizen.points.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {citizen.reportsResolved} {t('leaderboard.cleanups')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. NEIGHBORHOOD LEADERBOARD                                               */}
      {/* ========================================================================= */}
      {activeTab === 'neighborhood' && (
        <div className="flex flex-col gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-stone-700 flex items-center justify-between">
            <span className="font-semibold text-[#0F5132]">
              {t('leaderboard.cleanestNeighborhoods')}
            </span>
            <span className="text-[10px] text-stone-500">{t('common.sahiwalPunjab')}</span>
          </div>

          {neighborhoods.map((n, idx) => {
            const isTop1 = idx === 0;
            const isTop2 = idx === 1;
            const isTop3 = idx === 2;

            return (
              <Card
                key={n.id}
                variant="default"
                className={`p-3.5 transition ${
                  n.isUserNeighborhood
                    ? 'border-[#0F5132] bg-emerald-50/50 ring-2 ring-[#0F5132]/20'
                    : 'border-stone-200/80 hover:bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        isTop1
                          ? 'bg-amber-400 text-stone-950 shadow-xs'
                          : isTop2
                          ? 'bg-stone-300 text-stone-800'
                          : isTop3
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : `#${idx + 1}`}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-stone-900 truncate">
                          {n.name}
                        </h4>
                        {n.isUserNeighborhood && (
                          <span className="text-[9px] font-bold text-[#0F5132] bg-emerald-100 px-1.5 py-0.2 rounded shrink-0">
                            {locale === 'ur' ? 'آپ کا علاقہ' : 'Your Area'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-2">
                        <span>{n.activeVolunteers} {t('leaderboard.activeVolunteers')}</span>
                        <span>•</span>
                        <span>{n.cleanupsCount} {t('leaderboard.cleanups')}</span>
                      </p>
                    </div>
                  </div>

                  {/* Points using logical text-end */}
                  <div className="text-end shrink-0">
                    <span className="text-xs font-extrabold text-[#0F5132] block">
                      {n.points.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-stone-400">{t('common.points')}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
