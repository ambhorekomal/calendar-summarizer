import React from 'react';
import { Calendar, Clock, Lightbulb, Sparkles } from 'lucide-react';

interface EventCardProps {
  title: string;
  startTime: string;
  endTime?: string;
  description?: string;
  summary?: string;
  suggestions?: string;
  loading?: boolean;
}

export function EventCard({ 
  title, 
  startTime, 
  endTime, 
  description, 
  summary, 
  suggestions, 
  loading 
}: EventCardProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
            <div className="flex items-center text-gray-600 text-sm mt-1">
              <Clock className="w-4 h-4 mr-1" />
              {formatTime(startTime)}
              {endTime && ` - ${formatTime(endTime)}`}
            </div>
          </div>
        </div>
      </div>

      {description && (
        <div className="mb-4">
          <p className="text-gray-700 text-sm leading-relaxed">{description}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ) : (
        <>
          {summary && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center mb-2">
                <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
                <h4 className="font-medium text-blue-900">AI Summary</h4>
              </div>
              <p className="text-blue-800 text-sm leading-relaxed">{summary}</p>
            </div>
          )}

          {suggestions && (
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="flex items-center mb-2">
                <Lightbulb className="w-4 h-4 text-emerald-600 mr-2" />
                <h4 className="font-medium text-emerald-900">Suggestions</h4>
              </div>
              <p className="text-emerald-800 text-sm leading-relaxed">{suggestions}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}