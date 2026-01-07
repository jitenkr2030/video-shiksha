import { openai } from '@/lib/ai';
import { SlideExtractionResult } from './document-ingestion.service';

export interface ScriptGenerationOptions {
  tone: 'teacher' | 'conversational' | 'corporate' | 'exam-oriented';
  level: 'beginner' | 'intermediate' | 'advanced';
  length: 'short' | 'medium' | 'long';
  language: string;
  useExistingNotes: boolean;
  customInstructions?: string;
}

export interface GeneratedScript {
  slideId: string;
  title: string;
  script: string;
  duration: number;
  keyPoints: string[];
  vocabulary: Array<{
    word: string;
    definition: string;
    pronunciation?: string;
  }>;
  engagementTips: string[];
}

export class ScriptGenerationService {
  private tonePrompts = {
    teacher: "You are an experienced teacher explaining concepts clearly and engagingly. Use examples, analogies, and questions to maintain student interest.",
    conversational: "You are having a friendly conversation with the learner. Use casual language, humor, and relatable examples.",
    corporate: "You are presenting to business professionals. Use formal language, focus on practical applications, and maintain a professional tone.",
    'exam-oriented': "You are preparing students for exams. Focus on key concepts, definitions, and important points that are likely to appear in tests."
  };

  private levelPrompts = {
    beginner: "Explain concepts from scratch. Assume the learner has no prior knowledge. Use simple language and step-by-step explanations.",
    intermediate: "Assume the learner has basic understanding. Focus on deeper insights, connections, and practical applications.",
    advanced: "Discuss complex aspects, nuances, and advanced topics. Challenge the learner with sophisticated concepts and critical thinking."
  };

  private lengthGuidelines = {
    short: "Keep explanations concise. Focus on the most important points. Aim for 30-45 seconds per slide.",
    medium: "Provide balanced explanations with some details. Aim for 60-90 seconds per slide.",
    long: "Give comprehensive explanations with examples and details. Aim for 2-3 minutes per slide."
  };

  async generateScripts(
    slides: SlideExtractionResult['slides'],
    options: ScriptGenerationOptions
  ): Promise<GeneratedScript[]> {
    const scripts: GeneratedScript[] = [];

    for (const slide of slides) {
      const script = await this.generateSlideScript(slide, options);
      scripts.push(script);
    }

    return scripts;
  }

  private async generateSlideScript(
    slide: SlideExtractionResult['slides'][0],
    options: ScriptGenerationOptions
  ): Promise<GeneratedScript> {
    const systemPrompt = this.buildSystemPrompt(options);
    const userPrompt = this.buildUserPrompt(slide, options);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const generatedContent = response.choices[0]?.message?.content;
      if (!generatedContent) {
        throw new Error('Failed to generate script content');
      }

      return this.parseGeneratedScript(slide.id, slide.title, generatedContent);
    } catch (error) {
      console.error('Script generation failed:', error);
      // Fallback to basic script generation
      return this.generateFallbackScript(slide, options);
    }
  }

  private buildSystemPrompt(options: ScriptGenerationOptions): string {
    const tonePrompt = this.tonePrompts[options.tone];
    const levelPrompt = this.levelPrompts[options.level];
    const lengthPrompt = this.lengthGuidelines[options.length];
    const languagePrompt = this.getLanguagePrompt(options.language);

    return `${tonePrompt} ${levelPrompt} ${lengthPrompt} ${languagePrompt}

You are creating educational video scripts for an AI-powered learning platform. Your scripts should be:
- Clear and easy to understand
- Engaging and interesting
- Educational and accurate
- Suitable for text-to-speech conversion

Always respond in JSON format with the following structure:
{
  "script": "The main narration script for this slide",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "vocabulary": [{"word": "term", "definition": "explanation"}],
  "engagementTips": ["Tip 1", "Tip 2"],
  "estimatedDuration": 60
}`;
  }

  private buildUserPrompt(
    slide: SlideExtractionResult['slides'][0],
    options: ScriptGenerationOptions
  ): string {
    let prompt = `Generate a script for this slide:\n\n`;
    prompt += `Title: ${slide.title}\n`;
    prompt += `Content: ${slide.content}\n`;
    
    if (options.useExistingNotes && slide.notes) {
      prompt += `Speaker Notes: ${slide.notes}\n`;
    }

    if (options.customInstructions) {
      prompt += `Special Instructions: ${options.customInstructions}\n`;
    }

    prompt += `\nCreate an engaging educational script that explains this content effectively.`;

    return prompt;
  }

  private getLanguagePrompt(language: string): string {
    const languagePrompts = {
      en: 'Generate the script in English.',
      hi: 'Generate the script in Hindi (mix of Hindi and English is acceptable - Hinglish).',
      ta: 'Generate the script in Tamil.',
      te: 'Generate the script in Telugu.',
      bn: 'Generate the script in Bengali.',
      mr: 'Generate the script in Marathi.'
    };

    return languagePrompts[language] || languagePrompts.en;
  }

  private parseGeneratedScript(
    slideId: string,
    slideTitle: string,
    content: string
  ): GeneratedScript {
    try {
      const parsed = JSON.parse(content);
      return {
        slideId,
        title: slideTitle,
        script: parsed.script || content,
        duration: parsed.estimatedDuration || this.estimateDuration(parsed.script || content),
        keyPoints: parsed.keyPoints || [],
        vocabulary: parsed.vocabulary || [],
        engagementTips: parsed.engagementTips || []
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        slideId,
        title: slideTitle,
        script: content,
        duration: this.estimateDuration(content),
        keyPoints: [],
        vocabulary: [],
        engagementTips: []
      };
    }
  }

  private generateFallbackScript(
    slide: SlideExtractionResult['slides'][0],
    options: ScriptGenerationOptions
  ): GeneratedScript {
    let script = `Welcome to ${slide.title}. `;
    
    if (slide.content) {
      script += `In this slide, we'll explore ${slide.title}. `;
      script += slide.content.substring(0, 200) + '. ';
    }

    script += 'Let me explain this concept in detail.';

    return {
      slideId: slide.id,
      title: slide.title,
      script,
      duration: this.estimateDuration(script),
      keyPoints: [slide.title],
      vocabulary: [],
      engagementTips: ['Use visual aids', 'Ask questions']
    };
  }

  private estimateDuration(script: string): number {
    // Average reading speed: 150 words per minute
    const words = script.split(' ').length;
    return Math.ceil((words / 150) * 60); // Convert to seconds
  }

  async optimizeScriptForEngagement(script: GeneratedScript): Promise<GeneratedScript> {
    const prompt = `Optimize this educational script for better engagement:

Original Script:
${script.script}

Current Key Points:
${script.keyPoints.join(', ')}

Please enhance the script to:
1. Add engaging questions or hooks
2. Include relatable examples or analogies
3. Improve clarity and flow
4. Add transitions between concepts
5. Maintain the educational value

Respond in JSON format with the enhanced script and any new engagement tips.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator specializing in engaging video scripts.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const optimized = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      return {
        ...script,
        script: optimized.script || script.script,
        engagementTips: [
          ...script.engagementTips,
          ...(optimized.engagementTips || [])
        ]
      };
    } catch (error) {
      console.error('Script optimization failed:', error);
      return script;
    }
  }

  async translateScript(
    script: GeneratedScript,
    targetLanguage: string
  ): Promise<GeneratedScript> {
    const prompt = `Translate this educational script to ${targetLanguage} while maintaining the educational tone and meaning:

Original Script:
${script.script}

Key Points to preserve:
${script.keyPoints.join(', ')}

Ensure the translation:
1. Maintains educational accuracy
2. Uses natural language in the target language
3. Preserves key terminology
4. Flows well for text-to-speech

Respond in JSON format with the translated script and translated key points.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator specializing in educational content.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const translated = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      return {
        ...script,
        script: translated.script || script.script,
        keyPoints: translated.keyPoints || script.keyPoints
      };
    } catch (error) {
      console.error('Script translation failed:', error);
      return script;
    }
  }
}

export const scriptGenerationService = new ScriptGenerationService();