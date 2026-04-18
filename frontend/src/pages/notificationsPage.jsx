import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, CheckCheck, Loader2, BellOff } from 'lucide-react';
import { notificationService } from '../services/notification.service';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [markingAll,     setMarkingAll]      = useState(false);

  useEffect(() => {
    notificationService.getAll()
      .then(data => setNotifications(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unread = notifications.filter(n => !n.lu).length;

  const handleMarkOne = async (id) => {
    await notificationService.markAsRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, lu: true } : n));
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    await notificationService.markAllAsRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
    setMarkingAll(false);
  };

  const fmt = (dateStr) =>
    new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')}
              className="p-2 bg-white hover:bg-slate-100 rounded-full shadow-sm transition-colors">
              <ChevronLeft className="w-6 h-6 text-slate-500" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-6 h-6 text-blue-600" />
                Notifications
              </h2>
              {unread > 0 && (
                <p className="text-sm text-slate-500 mt-0.5">
                  {unread} non lue{unread > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {unread > 0 && (
            <button onClick={handleMarkAll} disabled={markingAll}
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 transition-colors disabled:opacity-50">
              {markingAll
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCheck className="w-4 h-4" />}
              Tout marquer lu
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-20 gap-4">
            <BellOff className="w-12 h-12 text-slate-300" />
            <p className="text-slate-500 font-medium">Aucune notification pour le moment</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
            {notifications.map(n => (
              <div
                key={n._id}
                onClick={() => !n.lu && handleMarkOne(n._id)}
                className={`flex items-start gap-4 p-5 transition-colors ${
                  !n.lu
                    ? 'bg-blue-50/40 hover:bg-blue-50 cursor-pointer'
                    : 'bg-white'
                }`}
              >
                {/* Dot */}
                <div className="shrink-0 mt-1.5">
                  {n.lu
                    ? <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    : <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-300" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${n.lu ? 'text-slate-500' : 'text-slate-800 font-medium'}`}>
                    {n.contenu}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{fmt(n.dateEnvoi)}</p>
                </div>

                {!n.lu && (
                  <span className="shrink-0 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                    Nouveau
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}