'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import Link from 'next/link';
import { ArrowLeft, Clock, ShieldAlert } from 'lucide-react';

export default function ActivityLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLogs(fetchedLogs);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-4 sm:p-8 text-stone-800 dark:text-stone-100">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-orange-500" />
                Admin Activity Logs
              </h1>
              <p className="text-stone-500 text-sm font-medium">Permanent record of all administrative actions. Cannot be deleted.</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-stone-400 font-bold">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-10 text-center text-stone-400 font-bold">No activity recorded yet.</div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
              {logs.map((log) => (
                <div key={log.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  <div>
                    <p className="font-bold text-stone-800 dark:text-white">
                      <span className="text-orange-500">{log.admin}</span> {log.action}: <span className="text-stone-500 dark:text-stone-400">{log.target}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-400 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-lg w-fit shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
