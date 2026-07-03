const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a professional education consultant writing personalized outreach messages for prospective students. 

Write a warm but professional message under 80 words that:
- References the lead's specific course interest, city, and qualification
- Uses a friendly, encouraging tone
- Ends with a soft call-to-action (e.g., "Would you like to learn more?" or "Let me know if you have questions")
- Adapts style for the channel: WhatsApp (casual, brief), Email (professional, structured), SMS (very concise)

Do not use placeholders. Write the actual personalized message.`;

const FALLBACK_TEMPLATES = {
  whatsapp: (lead) => `Hi ${lead.name}! 👋 I noticed you're interested in ${lead.course_interest || 'our courses'} in ${lead.city || 'your city'}. With your ${lead.qualification || 'background'}, you'd be a great fit! Would you like me to share more details?`,
  email: (lead) => `Dear ${lead.name},\n\nI hope you're doing well! I saw your interest in ${lead.course_interest || 'our programs'} and wanted to reach out. Given your background in ${lead.qualification || 'your field'} and location in ${lead.city || 'your area'}, I think you'd find our offerings valuable.\n\nWould you like to schedule a quick call to discuss? Let me know!\n\nBest regards`,
  sms: (lead) => `Hi ${lead.name}, interested in ${lead.course_interest || 'our courses'}? With your ${lead.qualification || 'background'}, you'd be a great fit. Reply YES for info!`,
};

async function generateMessage(lead, channel) {
  const validChannels = ['whatsapp', 'email', 'sms'];
  if (!validChannels.includes(channel)) {
    throw new Error(`Invalid channel: ${channel}. Must be one of: ${validChannels.join(', ')}`);
  }

  const userPrompt = `Lead details:
- Name: ${lead.name}
- Course Interest: ${lead.course_interest || 'Not specified'}
- City: ${lead.city || 'Not specified'}
- Qualification: ${lead.qualification || 'Not specified'}
- Channel: ${channel}

Write a personalized message for this lead.`;

  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      const message = completion.choices[0]?.message?.content?.trim();
      if (message) {
        return message;
      }
      throw new Error('Empty response from OpenAI');
    } catch (error) {
      lastError = error;
      console.warn(`OpenAI attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error('OpenAI API failed after retries, using fallback template:', lastError);
  return FALLBACK_TEMPLATES[channel](lead);
}

module.exports = { generateMessage };