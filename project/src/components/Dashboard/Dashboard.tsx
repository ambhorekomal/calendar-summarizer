import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { GoogleCalendarService, initializeGoogleAuth } from '../../services/googleCalendar';
import { summarizeWithHuggingFace } from '../../services/huggingface';
import { EventCard } from './EventCard';
import { LogOut, RefreshCw, Calendar, Zap } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  gpt_summary?: string;
  gpt_suggestions?: string;
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [processingEvents, setProcessingEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadStoredEvents();
  }, [user]);

  const loadStoredEvents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('events1')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      setLoading(true);
      const accessToken = await initializeGoogleAuth();

      const { error } = await supabase
        .from('users1')
        .update({ google_access_token: accessToken })
        .eq('email', user?.email);

      if (error) throw error;

      setGoogleConnected(true);
      await fetchCalendarEvents(accessToken);
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      alert('Failed to connect to Google Calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarEvents = async (accessToken?: string) => {
    if (!user) return;

    try {
      setLoading(true);

      if (!accessToken) {
        const { data: userData, error } = await supabase
          .from('users1')
          .select('google_access_token')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        accessToken = userData?.google_access_token ?? '';
      }

      if (!accessToken) {
        alert('Please connect your Google Calendar first.');
        return;
      }

      const calendarService = new GoogleCalendarService(accessToken);
      const calendarEvents = await calendarService.getEvents(10);
      const processedEvents = [];

      for (const event of calendarEvents) {
        const eventData = {
          user_id: user.id,
          event_id: event.id,
          title: event.summary || 'Untitled Event',
          description: event.description || '',
          start_time: event.start.dateTime || event.start.date || new Date().toISOString(),
          end_time: event.end?.dateTime || event.end?.date || null,
        };

        const { data: existingEvent } = await supabase
          .from('events1')
          .select('id, gpt_summary, gpt_suggestions')
          .eq('event_id', event.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!existingEvent) {
          const { data: insertedEvent, error } = await supabase
            .from('events1')
            .insert([eventData])
            .select()
            .maybeSingle();

          if (!error && insertedEvent) {
            processedEvents.push(insertedEvent);
          }
        } else if (!existingEvent.gpt_summary || !existingEvent.gpt_suggestions) {
          processedEvents.push({ ...eventData, id: existingEvent.id });
        }
      }

      await loadStoredEvents();
      setGoogleConnected(true);

      for (const event of processedEvents) {
  await generateAISummary(event.id, event.title, event.description || '', event.start_time);
}

// ✅ Re-fetch updated events after AI summaries are stored
await loadStoredEvents();


    } catch (error) {
      console.error('Error fetching calendar events:', error);
      alert('Failed to fetch calendar events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateAISummary = async (
    eventId: string,
    title: string,
    description: string,
    startTime: string
  ) => {
    setProcessingEvents(prev => new Set(prev).add(eventId));

    try {
      const { summary, suggestions } = await summarizeWithHuggingFace(title, description, startTime);

if (
  summary.includes('Unable to') ||
  suggestions.includes('Unable to')
) {
  console.warn('⚠️ Skipping update due to fallback summary.');
  return;
}


      const { error } = await supabase
        .from('events1')
        .update({
          gpt_summary: summary,
          gpt_suggestions: suggestions,
        })
        .eq('id', eventId);

      if (error) throw error;

      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId
            ? { ...event, gpt_summary: summary, gpt_suggestions: suggestions }
            : event
        )
      );
    } catch (error) {
      console.error('Error generating AI summary:', error);
    } finally {
      setProcessingEvents(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calendar AI</h1>
                <p className="text-gray-600">Welcome back, {user?.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-4 mb-8">
          {!googleConnected ? (
            <button
              onClick={connectGoogleCalendar}
              disabled={loading}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
            >
              <Calendar className="w-5 h-5" />
              <span>{loading ? 'Connecting...' : 'Connect Google Calendar'}</span>
            </button>
          ) : (
            <button
              onClick={() => fetchCalendarEvents()}
              disabled={loading}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Syncing...' : 'Sync Events'}</span>
            </button>
          )}
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                title={event.title}
                startTime={event.start_time}
                endTime={event.end_time}
                description={event.description}
                summary={event.gpt_summary}
                suggestions={event.gpt_suggestions}
                loading={processingEvents.has(event.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Events Yet</h2>
            <p className="text-gray-600 mb-6">
              Connect your Google Calendar to start getting AI-powered insights for your events.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
