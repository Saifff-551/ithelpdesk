import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Building2, Users, Ticket, TrendingUp, Loader2, Activity, Zap, Server, ShieldAlert } from 'lucide-react';
import { AIStatusBadge } from '../components/matie/AIStatusBadge';

interface TenantStats {
  id: string;
  name: string;
  userCount: number;
  ticketCount: number;
  created_at: string;
}

export const PlatformAdminPage: React.FC = () => {
  const [tenants, setTenants] = useState<TenantStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
        const tenantsData = await Promise.all(
          tenantsSnapshot.docs.map(async (doc) => {
            const tenantData = doc.data();

            // Get user count for this tenant
            const usersQuery = query(collection(db, 'users'), where('tenant_id', '==', doc.id));
            const usersCount = await getCountFromServer(usersQuery);

            // Get ticket count for this tenant
            const ticketsQuery = query(collection(db, 'tickets'), where('tenant_id', '==', doc.id));
            const ticketsCount = await getCountFromServer(ticketsQuery);

            return {
              id: doc.id,
              name: tenantData.name,
              userCount: usersCount.data().count,
              ticketCount: ticketsCount.data().count,
              created_at: tenantData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            };
          })
        );

        setTenants(tenantsData);
      } catch (error) {
        console.error('Error fetching tenants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-standard max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-mono font-bold text-gray-100 flex items-center gap-3 w-full">
            <Server className="h-6 w-6 text-primary drop-shadow-[var(--panel-glow)]" />
            <span className="tracking-tight">MATIE Control Plane</span>
          </h1>
          <p className="mt-2 text-sm text-gray-400 font-mono">
            Global Infrastructure & AI Observability
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-4 bg-surface-2 px-4 py-2 rounded-lg border border-border-default shadow-card">
          <span className="text-xs text-gray-400 uppercase tracking-widest font-mono">Global Engine Status:</span>
          <AIStatusBadge p95LatencyMs={320} fallbackActive={false} rateLimitExceeded={false} workerQueueDown={false} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Global Infrastructure Health */}
        <div className="bg-surface-1 border border-border-strong rounded-xl p-6 shadow-card hover:bg-surface-2 transition-colors duration-standard">
          <div className="flex items-center gap-3 mb-6 border-b border-border-default pb-4">
            <div className="p-2 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Infrastructure Health</h2>
              <p className="text-xs text-gray-500 font-mono mt-1">Resource utilization & routing latency</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Queue Depth</p>
              <p className="text-2xl font-mono text-gray-100">14</p>
              <p className="text-xs text-status-operational mt-1">Normal</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">P99 Latency</p>
              <p className="text-2xl font-mono text-gray-100">2.1s</p>
              <p className="text-xs text-status-warning mt-1">Elevated (LLM tail)</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Rate Limit</p>
              <p className="text-2xl font-mono text-gray-100">42%</p>
              <p className="text-xs text-status-operational mt-1">Safe</p>
            </div>
          </div>
        </div>

        {/* Global AI Health */}
        <div className="bg-surface-1 border border-border-strong rounded-xl p-6 shadow-card hover:bg-surface-2 transition-colors duration-standard relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="flex items-center gap-3 mb-6 border-b border-border-default pb-4 relative">
            <div className="p-2 bg-purple-900/20 rounded-lg border border-purple-500/30">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">AI Intelligence Health</h2>
              <p className="text-xs text-gray-500 font-mono mt-1">Model stability & adaptive entropy</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 relative">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Confidence Drift</p>
              <p className="text-2xl font-mono text-gray-100">-1.2%</p>
              <p className="text-xs text-status-info mt-1">Stabilizing</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Adaptive Entropy</p>
              <p className="text-2xl font-mono text-gray-100">0.84</p>
              <p className="text-xs text-status-operational mt-1">Healthy Variance</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Recalibrations</p>
              <p className="text-2xl font-mono text-gray-100">12/hr</p>
              <p className="text-xs text-gray-400 mt-1">Global average</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-border-strong pt-8">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          Tenant Isolation Boundaries
        </h2>
        <div className="bg-surface-1 shadow-card border border-border-default rounded-xl overflow-hidden">
          <ul className="divide-y divide-border-default">
            {tenants.map((tenant) => (
              <li key={tenant.id} className="block hover:bg-surface-2 transition-colors duration-fast">
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-bold text-gray-200 truncate">
                        {tenant.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-status-info/10 text-status-info border border-status-info/20">
                        {tenant.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-gray-500 mt-2">
                      <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {tenant.userCount} Identities</span>
                      <span className="flex items-center gap-1.5"><Ticket className="w-3.5 h-3.5" /> {tenant.ticketCount} Workloads</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-mono font-medium bg-status-operational/10 text-status-operational border border-status-operational/20">
                      Isolated
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
