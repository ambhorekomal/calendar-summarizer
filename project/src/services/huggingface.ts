export interface EventSummary {
  summary: string;
  suggestions: string;
}

export async function summarizeWithHuggingFace(
  title: string,
  description: string = '',
  startTime: string
): Promise<EventSummary> {
  try {
    console.log('🤖 Generating AI summary using Hugging Face for event:', title);

    const eventDate = new Date(startTime);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    // Check if this is a birthday event
    const isBirthday = detectBirthdayEvent(title, description);
    
    // Create a more focused prompt for better results
    let eventText = '';
    if (isBirthday) {
      eventText = `Birthday Event: ${title}
Date: ${formattedDate}
Description: ${description || 'Birthday celebration'}
Context: This is a birthday celebration that requires special attention and preparation.`;
    } else {
      eventText = `Event: ${title}
Date: ${formattedDate}
Description: ${description || 'No additional details provided'}`;
    }

    const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;

    if (!HUGGINGFACE_API_KEY || HUGGINGFACE_API_KEY === 'your_huggingface_api_key_here') {
      console.log('⚠️ Hugging Face API key not configured, using smart fallback');
      return getGuaranteedSummary(title, description, startTime);
    }

    // Try multiple models for better results
    const models = [
      "facebook/bart-large-cnn",
      "microsoft/DialoGPT-medium",
      "google/flan-t5-base"
    ];

    for (const model of models) {
      try {
        console.log(`🔄 Trying model: ${model}`);
        const API_URL = `https://api-inference.huggingface.co/models/${model}`;

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: eventText,
            parameters: {
              max_length: 150,
              min_length: 30,
              do_sample: true,
              temperature: 0.7,
              top_p: 0.9,
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Hugging Face API response received from', model);
          
          let generatedText = '';
          if (Array.isArray(result) && result.length > 0) {
            generatedText = result[0].summary_text || result[0].generated_text || '';
          } else if (result.summary_text) {
            generatedText = result.summary_text;
          } else if (result.generated_text) {
            generatedText = result.generated_text;
          }

          if (generatedText && generatedText.length > 20) {
            const summary = cleanAndValidateSummary(generatedText.trim(), title, startTime, isBirthday);
            const suggestions = generateSmartSuggestions(title, description, startTime);
            
            console.log('✅ Successfully generated AI content');
            return { 
              summary: summary,
              suggestions: suggestions
            };
          }
        } else {
          console.log(`❌ Model ${model} failed:`, response.status);
        }
      } catch (modelError) {
        console.log(`❌ Error with model ${model}:`, modelError);
        continue;
      }
    }

    // If all models fail, use guaranteed fallback
    console.log('🔄 All models failed, using guaranteed fallback');
    return getGuaranteedSummary(title, description, startTime);

  } catch (error: any) {
    console.error('❌ Error in summarizeWithHuggingFace:', error);
    return getGuaranteedSummary(title, description, startTime);
  }
}

// Main function that Dashboard expects - this is the guaranteed AI summary generator
export async function generateGuaranteedAISummary(
  title: string,
  description: string = '',
  startTime: string
): Promise<EventSummary> {
  try {
    console.log('🤖 Generating guaranteed AI summary for:', title);
    
    // First try Hugging Face API
    const result = await summarizeWithHuggingFace(title, description, startTime);
    
    // Validate that we got meaningful content
    if (result.summary && result.summary.length > 20 && result.suggestions && result.suggestions.length > 20) {
      console.log('✅ Hugging Face API provided quality results');
      return result;
    }
    
    // If Hugging Face didn't provide quality results, use guaranteed fallback
    console.log('🔄 Hugging Face results insufficient, using guaranteed fallback');
    return getGuaranteedSummary(title, description, startTime);
    
  } catch (error) {
    console.error('❌ Error in generateGuaranteedAISummary:', error);
    // Always return something meaningful
    return getGuaranteedSummary(title, description, startTime);
  }
}

function detectBirthdayEvent(title: string, description: string = ''): boolean {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  
  // Comprehensive birthday detection patterns
  const birthdayPatterns = [
    // Direct birthday mentions
    'birthday',
    'bday',
    'b-day',
    'born',
    'birth day',
    
    // Birthday variations with possessive
    "'s birthday",
    "'s bday",
    "'s b-day",
    
    // Birthday celebration terms
    'birthday party',
    'birthday celebration',
    'birthday dinner',
    'birthday lunch',
    'birthday cake',
    
    // Age-related patterns
    'turns ',
    'turning ',
    ' years old',
    'th birthday',
    'st birthday',
    'nd birthday',
    'rd birthday',
    
    // Anniversary patterns (often used for birthdays)
    'anniversary',
    'annual celebration',
    
    // Common birthday phrases
    'celebrate',
    'special day',
    'big day',
    
    // Family member patterns
    'mom birthday',
    'dad birthday',
    'mother birthday',
    'father birthday',
    'sister birthday',
    'brother birthday',
    'grandma birthday',
    'grandpa birthday',
    'wife birthday',
    'husband birthday',
    'friend birthday',
  ];
  
  // Check title and description for birthday patterns
  const textToCheck = `${titleLower} ${descLower}`;
  
  for (const pattern of birthdayPatterns) {
    if (textToCheck.indexOf(pattern) !== -1) {
      console.log(`🎂 Birthday detected with pattern: "${pattern}" in event: ${title}`);
      return true;
    }
  }
  
  // Additional pattern: Name followed by birthday-related words
  // Matches patterns like "Mom Birthday", "John Birthday", "Sarah's Day"
  const namePatterns = [
    /\b\w+('s)?\s+(birthday|bday|day|celebration)\b/i,
    /\b(birthday|bday)\s+\w+\b/i,
    /\b\w+\s+turns?\s+\d+/i,
    /\b\w+\s+is\s+\d+/i,
  ];
  
  for (const pattern of namePatterns) {
    if (pattern.test(textToCheck)) {
      console.log(`🎂 Birthday detected with regex pattern in event: ${title}`);
      return true;
    }
  }
  
  return false;
}

function cleanAndValidateSummary(generatedText: string, title: string, startTime: string, isBirthday: boolean = false): string {
  // Clean up the generated text
  let summary = generatedText
    .replace(/^(Summary:|Event:|Description:|Birthday Event:)/i, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Ensure it's not too long
  if (summary.length > 200) {
    summary = summary.substring(0, 197) + '...';
  }

  // If the summary is too short or doesn't make sense, create a guaranteed one
  if (summary.length < 20 || summary.indexOf(' ') === -1) {
    return createGuaranteedOneLiner(title, startTime, isBirthday);
  }

  // Ensure it ends with proper punctuation
  if (!/[.!?]$/.test(summary)) {
    summary += '.';
  }

  return summary;
}

function createGuaranteedOneLiner(title: string, startTime: string, isBirthday: boolean = false): string {
  const eventDate = new Date(startTime);
  const dateStr = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  
  const titleLower = title.toLowerCase();
  
  // Special handling for birthday events
  if (isBirthday || detectBirthdayEvent(title)) {
    const personName = extractPersonNameFromBirthday(title);
    if (personName) {
      return `🎂 ${personName}'s birthday celebration on ${dateStr} at ${timeStr} - a special day to show love, bring joy, and create lasting memories together.`;
    } else {
      return `🎂 Birthday celebration "${title}" on ${dateStr} at ${timeStr} - a wonderful opportunity to celebrate life, share happiness, and make someone feel truly special.`;
    }
  }
  
  // Create contextual one-liners based on event type
  if (titleLower.indexOf('meeting') !== -1 || titleLower.indexOf('call') !== -1) {
    return `Professional meeting "${title}" scheduled for ${dateStr} at ${timeStr} - prepare agenda and materials.`;
  } else if (titleLower.indexOf('interview') !== -1) {
    return `Important interview "${title}" on ${dateStr} at ${timeStr} - research company and practice responses.`;
  } else if (titleLower.indexOf('presentation') !== -1 || titleLower.indexOf('demo') !== -1) {
    return `Presentation event "${title}" happening ${dateStr} at ${timeStr} - rehearse content and test equipment.`;
  } else if (titleLower.indexOf('appointment') !== -1 || titleLower.indexOf('doctor') !== -1 || titleLower.indexOf('dentist') !== -1) {
    return `Healthcare appointment "${title}" scheduled for ${dateStr} at ${timeStr} - bring documents and insurance.`;
  } else if (titleLower.indexOf('workout') !== -1 || titleLower.indexOf('gym') !== -1 || titleLower.indexOf('exercise') !== -1) {
    return `Fitness activity "${title}" planned for ${dateStr} at ${timeStr} - stay hydrated and bring gear.`;
  } else if (titleLower.indexOf('party') !== -1 || titleLower.indexOf('celebration') !== -1) {
    return `Social celebration "${title}" on ${dateStr} at ${timeStr} - bring positive energy and enjoy the moment.`;
  } else if (titleLower.indexOf('travel') !== -1 || titleLower.indexOf('flight') !== -1 || titleLower.indexOf('trip') !== -1) {
    return `Travel event "${title}" departing ${dateStr} at ${timeStr} - check documents and arrive early.`;
  } else if (titleLower.indexOf('deadline') !== -1 || titleLower.indexOf('due') !== -1) {
    return `Important deadline "${title}" on ${dateStr} at ${timeStr} - prioritize completion and quality.`;
  } else if (titleLower.indexOf('lunch') !== -1 || titleLower.indexOf('dinner') !== -1 || titleLower.indexOf('meal') !== -1) {
    return `Dining event "${title}" scheduled for ${dateStr} at ${timeStr} - enjoy good food and company.`;
  } else {
    return `Event "${title}" taking place on ${dateStr} at ${timeStr} - allocate time and prepare accordingly.`;
  }
}

function extractPersonNameFromBirthday(title: string): string | null {
  // Try to extract person's name from birthday title
  const titleLower = title.toLowerCase();
  
  // Pattern: "Name's Birthday" or "Name Birthday"
  const patterns = [
    /^([a-zA-Z]+)'s\s+(birthday|bday)/i,
    /^([a-zA-Z]+)\s+(birthday|bday)/i,
    /(birthday|bday)\s+([a-zA-Z]+)$/i,
    /^([a-zA-Z]+)\s+turns?\s+\d+/i,
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      const name = match[1] || match[2];
      if (name && name.length > 1 && name.toLowerCase() !== 'birthday' && name.toLowerCase() !== 'bday') {
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      }
    }
  }
  
  return null;
}

function generateSmartSuggestions(title: string, description: string, startTime: string): string {
  const titleLower = title.toLowerCase();
  const descLower = (description || '').toLowerCase();
  const eventDate = new Date(startTime);
  const isToday = eventDate.toDateString() === new Date().toDateString();
  const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
  const isBirthday = detectBirthdayEvent(title, description);
  
  let suggestions = [];

  // Time-based suggestions
  if (isToday) {
    suggestions.push("📅 This event is today - make sure you're prepared and ready!");
  } else if (isTomorrow) {
    suggestions.push("⏰ This event is tomorrow - set a reminder and prepare tonight.");
  } else {
    suggestions.push("🔔 Set a reminder 15-30 minutes before the event starts.");
  }

  // Special birthday suggestions
  if (isBirthday) {
    const personName = extractPersonNameFromBirthday(title);
    if (personName) {
      suggestions.push(`🎁 Don't forget to get a thoughtful gift for ${personName} - consider their interests and hobbies.`);
      suggestions.push(`🎂 Plan something special to make ${personName} feel celebrated - maybe their favorite cake or activity.`);
      suggestions.push(`📱 Reach out to other friends/family to coordinate the celebration and make it memorable.`);
    } else {
      suggestions.push("🎁 Prepare a thoughtful gift that shows you care about this special person.");
      suggestions.push("🎂 Consider bringing a birthday cake, flowers, or planning a surprise element.");
      suggestions.push("📸 Capture the special moments - birthdays are perfect for creating lasting memories.");
    }
    
    // Add birthday-specific timing suggestions
    if (isToday) {
      suggestions.push("🎉 It's birthday day! Make sure to wish them well and bring your positive energy.");
    } else if (isTomorrow) {
      suggestions.push("🛍️ Last chance to get a gift if you haven't already - consider online delivery or local stores.");
    }
    
    return suggestions.slice(0, 3).join(' ');
  }

  // Event type specific suggestions (non-birthday)
  if (titleLower.indexOf('meeting') !== -1 || titleLower.indexOf('call') !== -1 || titleLower.indexOf('zoom') !== -1) {
    suggestions.push("💻 Test your audio/video setup and prepare an agenda beforehand.");
    suggestions.push("📋 Review any shared documents or materials in advance.");
  } else if (titleLower.indexOf('interview') !== -1) {
    suggestions.push("🎯 Research the company and prepare answers to common questions.");
    suggestions.push("👔 Plan your outfit and arrive 10 minutes early for best impression.");
  } else if (titleLower.indexOf('presentation') !== -1 || titleLower.indexOf('demo') !== -1) {
    suggestions.push("🎤 Practice your presentation and test all technical equipment.");
    suggestions.push("❓ Prepare for potential questions from the audience.");
  } else if (titleLower.indexOf('appointment') !== -1 || titleLower.indexOf('doctor') !== -1 || titleLower.indexOf('dentist') !== -1) {
    suggestions.push("📄 Bring necessary documents, insurance cards, and valid ID.");
    suggestions.push("📝 Prepare a list of questions or concerns to discuss.");
  } else if (titleLower.indexOf('workout') !== -1 || titleLower.indexOf('gym') !== -1 || titleLower.indexOf('exercise') !== -1) {
    suggestions.push("👟 Pack your workout clothes, water bottle, and towel.");
    suggestions.push("🍎 Have a light snack 30 minutes before if needed.");
  } else if (titleLower.indexOf('party') !== -1 || titleLower.indexOf('celebration') !== -1) {
    suggestions.push("🎁 Don't forget to bring a gift if appropriate for the occasion.");
    suggestions.push("📸 Charge your phone for photos and create lasting memories.");
  } else if (titleLower.indexOf('travel') !== -1 || titleLower.indexOf('flight') !== -1 || titleLower.indexOf('trip') !== -1) {
    suggestions.push("✈️ Check in online and verify your travel documents are current.");
    suggestions.push("🧳 Pack essentials and arrive at the airport with plenty of time.");
  } else if (titleLower.indexOf('deadline') !== -1 || titleLower.indexOf('due') !== -1) {
    suggestions.push("⏱️ Break down remaining tasks and prioritize the most critical ones.");
    suggestions.push("✅ Double-check your work for quality and completeness.");
  } else {
    suggestions.push("📖 Review the event details and prepare any necessary materials.");
    suggestions.push("🗺️ Confirm the location and plan your route in advance.");
  }

  // Always ensure we have at least 2 suggestions
  if (suggestions.length < 2) {
    suggestions.push("💡 Take a moment to mentally prepare and set positive intentions.");
    suggestions.push("📱 Add this event to your phone's calendar with notifications enabled.");
  }

  return suggestions.slice(0, 3).join(' ');
}

function getGuaranteedSummary(title: string, description: string, startTime: string): EventSummary {
  // This function ALWAYS returns a meaningful summary - no exceptions
  const isBirthday = detectBirthdayEvent(title, description);
  const summary = createGuaranteedOneLiner(title, startTime, isBirthday);
  const suggestions = generateSmartSuggestions(title, description, startTime);
  
  return {
    summary: summary,
    suggestions: suggestions,
  };
}