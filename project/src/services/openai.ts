import OpenAI from 'openai';

export interface EventSummary {
  summary: string;
  suggestions: string;
}

export async function summarizeEvent(
  title: string,
  description: string = '',
  startTime: string,
  eventType?: string
): Promise<EventSummary> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  // Validate API key
  if (!apiKey || !apiKey.startsWith('sk-')) {
    console.error('OpenAI API key not configured or invalid format');
    return getFallbackContent(title, description, startTime, eventType);
  }

  try {
    console.log('Making OpenAI API request for event:', title);

    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });

    const eventDate = new Date(startTime);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    let prompt = '';
    
    if (eventType === 'birthday') {
      prompt = `Analyze this birthday event and provide insights:

Event Title: ${title}
Date & Time: ${formattedDate}
Description: ${description || 'Birthday celebration'}

This is a birthday event. Please provide:
1. A warm and celebratory summary (2-3 sentences) about the birthday
2. 2-3 thoughtful suggestions for celebrating or preparing for this birthday

Format your response as:
SUMMARY: [your summary here]

SUGGESTIONS: [your suggestions here]`;
    } else {
      prompt = `Analyze this calendar event and provide insights:

Event Title: ${title}
Date & Time: ${formattedDate}
Description: ${description || 'No description provided'}

Please provide:
1. A concise summary (2-3 sentences) highlighting the key purpose and importance
2. 2-3 actionable preparation tips or suggestions

Format your response as:
SUMMARY: [your summary here]

SUGGESTIONS: [your suggestions here]`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: eventType === 'birthday' 
            ? 'You are a helpful AI assistant that provides warm, celebratory insights for birthdays and special occasions. Be thoughtful, caring, and suggest meaningful ways to celebrate.'
            : 'You are a helpful AI assistant that analyzes calendar events and provides actionable insights. Be concise, practical, and professional.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '';
    console.log('OpenAI API response received:', response);
    
    const summaryMatch = response.match(/SUMMARY:\s*(.*?)(?=SUGGESTIONS:|$)/s);
    const suggestionsMatch = response.match(/SUGGESTIONS:\s*(.*?)$/s);

    const summary = summaryMatch?.[1]?.trim() || 'This event appears to be important for your schedule.';
    const suggestions = suggestionsMatch?.[1]?.trim() || 'Consider preparing in advance and setting reminders.';

    return { 
      summary: summary.replace(/\n+/g, ' ').trim(),
      suggestions: suggestions.replace(/\n+/g, ' ').trim()
    };
  } catch (error: any) {
    console.error('Error in summarizeEvent:', error);
    return getFallbackContent(title, description, startTime, eventType);
  }
}

function getFallbackContent(title: string, description: string, startTime: string, eventType?: string): EventSummary {
  const eventDate = new Date(startTime);
  const dateStr = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  
  let summary = `${title} is scheduled for ${dateStr}.`;
  let suggestions = 'Set a reminder 15 minutes before the event.';
  
  if (eventType === 'birthday') {
    const name = title.replace(/birthday|bday|'s birthday|'s bday/gi, '').trim();
    summary = `🎉 It's ${name ? name + "'s" : "someone's"} birthday on ${dateStr}! This is a special day to celebrate and show appreciation.`;
    suggestions = 'Consider sending a heartfelt message, planning a small celebration, or choosing a thoughtful gift. Don\'t forget to reach out and make their day special!';
  } else {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('meeting') || titleLower.includes('call')) {
      summary += ' This appears to be a meeting or call that may require preparation.';
      suggestions = 'Prepare an agenda, test your audio/video setup, and review any relevant documents beforehand.';
    } else if (titleLower.includes('interview')) {
      summary += ' This is an interview that will require thorough preparation.';
      suggestions = 'Research the company, prepare answers to common questions, and plan your outfit in advance.';
    } else if (titleLower.includes('presentation') || titleLower.includes('demo')) {
      summary += ' This event involves presenting, which requires preparation and practice.';
      suggestions = 'Test your presentation slides, practice your delivery, and prepare for potential questions.';
    } else if (titleLower.includes('appointment') || titleLower.includes('doctor')) {
      summary += ' This is an appointment that may require specific preparation.';
      suggestions = 'Arrive 10 minutes early, bring necessary documents or insurance cards, and prepare any questions you want to ask.';
    } else if (titleLower.includes('deadline') || titleLower.includes('due')) {
      summary += ' This appears to be a deadline or due date for important work.';
      suggestions = 'Review your progress, allocate sufficient time to complete the task, and consider any dependencies or requirements.';
    } else if (description) {
      summary += ' Review the event details to ensure you\'re properly prepared.';
      suggestions = 'Read through the event description, prepare any necessary materials, and confirm the location or meeting details.';
    }
  }
  
  return {
    summary: summary.trim(),
    suggestions: suggestions.trim(),
  };
}