// MFM Corporation Multi-Modal Processor
// Advanced understanding of images, documents, voice, and video

export class MultiModalProcessor {
  constructor(env) {
    this.env = env;
    this.processingConfig = {
      maxImageSize: 10 * 1024 * 1024, // 10MB
      maxDocumentSize: 20 * 1024 * 1024, // 20MB
      maxAudioSize: 50 * 1024 * 1024, // 50MB
      maxVideoSize: 100 * 1024 * 1024, // 100MB
      supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      supportedDocumentFormats: ['pdf', 'doc', 'docx', 'txt', 'md'],
      supportedAudioFormats: ['mp3', 'wav', 'ogg', 'm4a'],
      supportedVideoFormats: ['mp4', 'webm', 'mov']
    };
  }

  async processMessage(message) {
    const modalities = {
      text: message.text || '',
      images: this.extractImages(message),
      documents: this.extractDocuments(message),
      audio: this.extractAudio(message),
      video: this.extractVideo(message),
      location: message.location,
      contact: message.contact,
      venue: message.venue
    };

    const processingResults = {
      textAnalysis: await this.analyzeText(modalities.text),
      visualAnalysis: modalities.images.length > 0 ? await this.analyzeImages(modalities.images) : null,
      documentAnalysis: modalities.documents.length > 0 ? await this.analyzeDocuments(modalities.documents) : null,
      audioAnalysis: modalities.audio.length > 0 ? await this.analyzeAudio(modalities.audio) : null,
      videoAnalysis: modalities.video.length > 0 ? await this.analyzeVideo(modalities.video) : null,
      locationAnalysis: modalities.location ? await this.analyzeLocation(modalities.location) : null,
      contactAnalysis: modalities.contact ? await this.analyzeContact(modalities.contact) : null,
      venueAnalysis: modalities.venue ? await this.analyzeVenue(modalities.venue) : null
    };

    return this.synthesizeMultiModalUnderstanding(processingResults, modalities);
  }

  extractImages(message) {
    const images = [];
    
    if (message.photo) {
      message.photo.forEach(photo => {
        images.push({
          type: 'photo',
          file_id: photo.file_id,
          file_size: photo.file_size,
          width: photo.width,
          height: photo.height
        });
      });
    }

    return images;
  }

  extractDocuments(message) {
    const documents = [];
    
    if (message.document) {
      documents.push({
        type: 'document',
        file_id: message.document.file_id,
        file_name: message.document.file_name,
        mime_type: message.document.mime_type,
        file_size: message.document.file_size
      });
    }

    return documents;
  }

  extractAudio(message) {
    const audio = [];
    
    if (message.voice) {
      audio.push({
        type: 'voice',
        file_id: message.voice.file_id,
        file_size: message.voice.file_size,
        duration: message.voice.duration
      });
    }
    
    if (message.audio) {
      audio.push({
        type: 'audio',
        file_id: message.audio.file_id,
        file_name: message.audio.file_name,
        mime_type: message.audio.mime_type,
        file_size: message.audio.file_size,
        duration: message.audio.duration
      });
    }

    return audio;
  }

  extractVideo(message) {
    const videos = [];
    
    if (message.video) {
      videos.push({
        type: 'video',
        file_id: message.video.file_id,
        file_name: message.video.file_name,
        mime_type: message.video.mime_type,
        file_size: message.video.file_size,
        width: message.video.width,
        height: message.video.height,
        duration: message.video.duration
      });
    }

    return videos;
  }

  async analyzeText(text) {
    if (!text || text.trim().length === 0) {
      return { hasText: false, analysis: null };
    }

    const analysis = {
      hasText: true,
      content: text,
      length: text.length,
      wordCount: text.split(/\s+/).length,
      sentenceCount: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
      language: this.detectLanguage(text),
      sentiment: await this.analyzeSentiment(text),
      entities: await this.extractTextEntities(text),
      intent: await this.classifyTextIntent(text),
      urgency: this.assessTextUrgency(text),
      topics: await this.extractTopics(text),
      keywords: this.extractKeywords(text),
      questions: this.extractQuestions(text),
      commands: this.extractCommands(text)
    };

    return analysis;
  }

  detectLanguage(text) {
    // Simple language detection based on character patterns
    const patterns = {
      english: /^[a-zA-Z\s\d\p{P}]+$/u,
      chinese: /[\u4e00-\u9fff]/,
      arabic: /[\u0600-\u06ff]/,
      russian: /[\u0400-\u04ff]/,
      japanese: /[\u3040-\u309f\u30a0-\u30ff]/
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    return 'unknown';
  }

  async analyzeSentiment(text) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'happy', 'excited', 'successful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'sad', 'angry', 'frustrated', 'failed', 'problem'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    let sentiment = 'neutral';
    let score = 0;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = Math.min(positiveCount / 10, 1);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = Math.min(negativeCount / 10, 1);
    } else {
      score = 0.5;
    }

    return { sentiment, score, confidence: Math.abs(positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1) };
  }

  async extractTextEntities(text) {
    const entities = {
      people: this.extractPeopleNames(text),
      organizations: this.extractOrganizations(text),
      locations: this.extractLocations(text),
      dates: this.extractDates(text),
      times: this.extractTimes(text),
      money: this.extractMoney(text),
      emails: this.extractEmails(text),
      phones: this.extractPhones(text),
      urls: this.extractUrls(text)
    };

    return entities;
  }

  extractPeopleNames(text) {
    // Simple pattern matching for common name patterns
    const namePatterns = [
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // First Last
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){2,}\b/g // Multiple names
    ];

    const names = [];
    for (const pattern of namePatterns) {
      const matches = text.match(pattern);
      if (matches) names.push(...matches);
    }

    return [...new Set(names)]; // Remove duplicates
  }

  extractOrganizations(text) {
    const orgPatterns = [
      /\b[A-Z][a-z]+ (?:Inc|Corp|LLC|Ltd|Company|Corporation)\b/g,
      /\bMFM Corporation\b/gi,
      /\b[A-Z]{2,}\s+(?:Department|Team|Division)\b/g
    ];

    const organizations = [];
    for (const pattern of orgPatterns) {
      const matches = text.match(pattern);
      if (matches) organizations.push(...matches);
    }

    return [...new Set(organizations)];
  }

  extractLocations(text) {
    const locationPatterns = [
      /\b\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)\b/gi,
      /\b[A-Z][a-z]+,\s*[A-Z]{2}\s*\d{5}\b/g, // City, State ZIP
      /\b(?:Office|Building|Floor)\s+\d+/gi
    ];

    const locations = [];
    for (const pattern of locationPatterns) {
      const matches = text.match(pattern);
      if (matches) locations.push(...matches);
    }

    return [...new Set(locations)];
  }

  extractDates(text) {
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}\b/gi,
      /\b(?:today|tomorrow|yesterday|next week|last week)\b/gi
    ];

    const dates = [];
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) dates.push(...matches);
    }

    return [...new Set(dates)];
  }

  extractTimes(text) {
    const timePatterns = [
      /\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\b/g,
      /\b\d{1,2}\s*(?:AM|PM|am|pm)\b/g,
      /\b(?:noon|midnight|morning|afternoon|evening|night)\b/gi
    ];

    const times = [];
    for (const pattern of timePatterns) {
      const matches = text.match(pattern);
      if (matches) times.push(...matches);
    }

    return [...new Set(times)];
  }

  extractMoney(text) {
    const moneyPatterns = [
      /\$\d+(?:,\d{3})*(?:\.\d{2})?/g,
      /\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|dollars|cents)\b/gi,
      /\b(?:cost|price|budget|fee)\s*[:\$]?\s*\d+(?:,\d{3})*(?:\.\d{2})?/gi
    ];

    const money = [];
    for (const pattern of moneyPatterns) {
      const matches = text.match(pattern);
      if (matches) money.push(...matches);
    }

    return [...new Set(money)];
  }

  extractEmails(text) {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailPattern);
    return matches ? [...new Set(matches)] : [];
  }

  extractPhones(text) {
    const phonePatterns = [
      /\b\d{3}-\d{3}-\d{4}\b/g,
      /\b\(\d{3}\)\s*\d{3}-\d{4}\b/g,
      /\b\d{10}\b/g,
      /\b\+\d{1,3}\s*\d{3,}\s*\d{3,}\s*\d{4}\b/g
    ];

    const phones = [];
    for (const pattern of phonePatterns) {
      const matches = text.match(pattern);
      if (matches) phones.push(...matches);
    }

    return [...new Set(phones)];
  }

  extractUrls(text) {
    const urlPattern = /\bhttps?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
    const matches = text.match(urlPattern);
    return matches ? [...new Set(matches)] : [];
  }

  async classifyTextIntent(text) {
    const lowerText = text.toLowerCase();
    
    const intents = {
      question: /\?/.test(text) || lowerText.includes('what') || lowerText.includes('how') || lowerText.includes('why'),
      command: lowerText.includes('please') || lowerText.includes('can you') || lowerText.includes('help me'),
      information: lowerText.includes('tell me') || lowerText.includes('show me') || lowerText.includes('explain'),
      action: lowerText.includes('create') || lowerText.includes('build') || lowerText.includes('make'),
      decision: lowerText.includes('should') || lowerText.includes('recommend') || lowerText.includes('choose'),
      greeting: lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hey'),
      farewell: lowerText.includes('goodbye') || lowerText.includes('bye') || lowerText.includes('see you'),
      thanks: lowerText.includes('thank') || lowerText.includes('thanks') || lowerText.includes('appreciate')
    };

    const detectedIntents = Object.entries(intents)
      .filter(([_, isMatch]) => isMatch)
      .map(([intent, _]) => intent);

    return {
      primary: detectedIntents[0] || 'general',
      all: detectedIntents,
      confidence: detectedIntents.length > 0 ? 0.8 : 0.3
    };
  }

  assessTextUrgency(text) {
    const lowerText = text.toLowerCase();
    const urgencyKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'deadline', 'important'];
    
    const urgencyScore = urgencyKeywords.filter(keyword => lowerText.includes(keyword)).length;
    
    return {
      level: urgencyScore >= 3 ? 'high' : urgencyScore >= 1 ? 'medium' : 'low',
      score: urgencyScore,
      keywords: urgencyKeywords.filter(keyword => lowerText.includes(keyword))
    };
  }

  async extractTopics(text) {
    const topicKeywords = {
      business: ['business', 'company', 'corporation', 'revenue', 'profit', 'market', 'sales'],
      technology: ['technology', 'software', 'development', 'programming', 'code', 'api', 'system'],
      finance: ['finance', 'money', 'budget', 'cost', 'investment', 'financial', 'accounting'],
      marketing: ['marketing', 'advertising', 'campaign', 'brand', 'promotion', 'social media'],
      operations: ['operations', 'process', 'workflow', 'efficiency', 'productivity', 'management'],
      human_resources: ['hr', 'employees', 'staff', 'hiring', 'training', 'team'],
      legal: ['legal', 'contract', 'agreement', 'compliance', 'regulation', 'policy'],
      strategy: ['strategy', 'planning', 'goals', 'objectives', 'vision', 'mission']
    };

    const detectedTopics = {};
    const lowerText = text.toLowerCase();

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const matches = keywords.filter(keyword => lowerText.includes(keyword));
      if (matches.length > 0) {
        detectedTopics[topic] = {
          relevance: matches.length / keywords.length,
          keywords: matches
        };
      }
    }

    return detectedTopics;
  }

  extractKeywords(text) {
    // Remove common stop words and extract important keywords
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they']);
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
    
    const wordFrequency = {};
    words.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });

    return Object.entries(wordFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, frequency]) => ({ word, frequency }));
  }

  extractQuestions(text) {
    const questionPattern = /\b(?:what|who|where|when|why|how|which|whose|whom)\b[^.!?]*[?]/gi;
    const matches = text.match(questionPattern);
    return matches ? matches.map(q => q.trim()) : [];
  }

  extractCommands(text) {
    const commandPatterns = [
      /\b(?:please|can you|could you)\s+(?:create|make|build|generate|send|show|tell|explain|help)\b[^.!?]*/gi,
      /\b(?:create|make|build|generate|send|show|tell|explain|help)\s+(?:me|us)\b[^.!?]*/gi
    ];

    const commands = [];
    for (const pattern of commandPatterns) {
      const matches = text.match(pattern);
      if (matches) commands.push(...matches);
    }

    return [...new Set(commands.map(c => c.trim()))];
  }

  async analyzeImages(images) {
    const analysis = {
      hasImages: true,
      count: images.length,
      images: []
    };

    for (const image of images) {
      const imageAnalysis = {
        fileId: image.file_id,
        fileSize: image.file_size,
        dimensions: {
          width: image.width,
          height: image.height
        },
        aspectRatio: image.width / image.height,
        estimatedType: this.classifyImageType(image),
        contentAnalysis: await this.analyzeImageContent(image),
        quality: this.assessImageQuality(image)
      };

      analysis.images.push(imageAnalysis);
    }

    return analysis;
  }

  classifyImageType(image) {
    const { width, height } = image;
    const aspectRatio = width / height;

    if (Math.abs(aspectRatio - 1) < 0.1) {
      return 'square';
    } else if (aspectRatio > 1.5) {
      return 'landscape';
    } else if (aspectRatio < 0.7) {
      return 'portrait';
    } else {
      return 'standard';
    }
  }

  async analyzeImageContent(image) {
    // In a real implementation, this would use computer vision APIs
    // For now, we'll provide a placeholder analysis
    return {
      objects: ['document', 'chart', 'diagram'], // Placeholder
      text: 'Text detected in image',
      colors: ['blue', 'white', 'gray'],
      confidence: 0.7
    };
  }

  assessImageQuality(image) {
    const { file_size, width, height } = image;
    const megapixels = (width * height) / 1000000;
    
    let quality = 'medium';
    if (megapixels > 2 && file_size > 100000) {
      quality = 'high';
    } else if (megapixels < 0.5 || file_size < 50000) {
      quality = 'low';
    }

    return {
      quality,
      megapixels,
      resolution: `${width}x${height}`,
      estimatedSharpness: quality === 'high' ? 'sharp' : quality === 'low' ? 'soft' : 'moderate'
    };
  }

  async analyzeDocuments(documents) {
    const analysis = {
      hasDocuments: true,
      count: documents.length,
      documents: []
    };

    for (const document of documents) {
      const docAnalysis = {
        fileId: document.file_id,
        fileName: document.file_name,
        fileSize: document.file_size,
        mimeType: document.mime_type,
        fileType: this.classifyDocumentType(document),
        contentAnalysis: await this.analyzeDocumentContent(document),
        sensitivity: this.assessDocumentSensitivity(document)
      };

      analysis.documents.push(docAnalysis);
    }

    return analysis;
  }

  classifyDocumentType(document) {
    const { mime_type, file_name } = document;
    
    if (mime_type.includes('pdf')) return 'PDF';
    if (mime_type.includes('word') || file_name.endsWith('.doc') || file_name.endsWith('.docx')) return 'Word';
    if (mime_type.includes('text') || file_name.endsWith('.txt')) return 'Text';
    if (file_name.endsWith('.md')) return 'Markdown';
    
    return 'Unknown';
  }

  async analyzeDocumentContent(document) {
    // In a real implementation, this would extract and analyze document content
    return {
      pageCount: 5, // Placeholder
      wordCount: 1000, // Placeholder
      hasTables: true,
      hasImages: false,
      language: 'English',
      topics: ['business', 'report'], // Placeholder
      confidence: 0.8
    };
  }

  assessDocumentSensitivity(document) {
    const { file_name, file_size } = document;
    const sensitiveKeywords = ['confidential', 'private', 'secret', 'internal', 'sensitive'];
    const lowerFileName = file_name.toLowerCase();
    
    let sensitivity = 'low';
    let reasons = [];

    if (sensitiveKeywords.some(keyword => lowerFileName.includes(keyword))) {
      sensitivity = 'high';
      reasons.push('Filename contains sensitive keywords');
    } else if (file_size > 5 * 1024 * 1024) { // > 5MB
      sensitivity = 'medium';
      reasons.push('Large file size');
    }

    return { sensitivity, reasons };
  }

  async analyzeAudio(audio) {
    const analysis = {
      hasAudio: true,
      count: audio.length,
      audio: []
    };

    for (const audioFile of audio) {
      const audioAnalysis = {
        fileId: audioFile.file_id,
        fileSize: audioFile.file_size,
        duration: audioFile.duration,
        type: audioFile.type,
        quality: this.assessAudioQuality(audioFile),
        contentAnalysis: await this.analyzeAudioContent(audioFile)
      };

      analysis.audio.push(audioAnalysis);
    }

    return analysis;
  }

  assessAudioQuality(audioFile) {
    const { file_size, duration } = audioFile;
    const bitrate = duration > 0 ? (file_size * 8) / (duration * 1000) : 0; // kbps

    let quality = 'medium';
    if (bitrate > 128) quality = 'high';
    else if (bitrate < 64) quality = 'low';

    return {
      quality,
      bitrate: Math.round(bitrate),
      duration: duration
    };
  }

  async analyzeAudioContent(audioFile) {
    // In a real implementation, this would use speech-to-text and audio analysis
    return {
      hasSpeech: true,
      language: 'English',
      transcription: 'Audio transcription placeholder',
      speakerCount: 1,
      emotion: 'neutral',
      confidence: 0.8
    };
  }

  async analyzeVideo(video) {
    const analysis = {
      hasVideo: true,
      count: video.length,
      video: []
    };

    for (const videoFile of video) {
      const videoAnalysis = {
        fileId: videoFile.file_id,
        fileSize: videoFile.file_size,
        duration: videoFile.duration,
        dimensions: {
          width: videoFile.width,
          height: videoFile.height
        },
        quality: this.assessVideoQuality(videoFile),
        contentAnalysis: await this.analyzeVideoContent(videoFile)
      };

      analysis.video.push(videoAnalysis);
    }

    return analysis;
  }

  assessVideoQuality(videoFile) {
    const { file_size, duration, width, height } = videoFile;
    const megapixels = (width * height) / 1000000;
    const bitrate = duration > 0 ? (file_size * 8) / (duration * 1000) : 0; // kbps

    let quality = 'medium';
    if (megapixels > 2 && bitrate > 2000) quality = 'high';
    else if (megapixels < 0.5 || bitrate < 500) quality = 'low';

    return {
      quality,
      resolution: `${width}x${height}`,
      bitrate: Math.round(bitrate),
      frameRate: 30 // Placeholder
    };
  }

  async analyzeVideoContent(videoFile) {
    // In a real implementation, this would use video analysis APIs
    return {
      hasMotion: true,
      sceneCount: 3,
      hasAudio: true,
      objects: ['person', 'document', 'screen'], // Placeholder
      text: 'Text detected in video',
      confidence: 0.7
    };
  }

  async analyzeLocation(location) {
    return {
      hasLocation: true,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.horizontal_accuracy,
      address: await this.reverseGeocode(location.latitude, location.longitude),
      context: this.analyzeLocationContext(location)
    };
  }

  async reverseGeocode(lat, lon) {
    // In a real implementation, this would use a geocoding service
    return 'Business District, City'; // Placeholder
  }

  analyzeLocationContext(location) {
    const businessHours = this.isBusinessHours();
    const isOfficeLocation = this.isOfficeLocation(location.latitude, location.longitude);
    
    return {
      businessHours,
      isOfficeLocation,
      contextType: isOfficeLocation ? 'work' : 'personal'
    };
  }

  isBusinessHours() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
  }

  isOfficeLocation(lat, lon) {
    // In a real implementation, this would check against known office coordinates
    return false; // Placeholder
  }

  async analyzeContact(contact) {
    return {
      hasContact: true,
      firstName: contact.first_name,
      lastName: contact.last_name,
      phoneNumber: contact.phone_number,
      userId: contact.user_id,
      vcard: contact.vcard,
      context: this.analyzeContactContext(contact)
    };
  }

  analyzeContactContext(contact) {
    const hasBusinessInfo = !!(contact.phone_number && (contact.first_name || contact.last_name));
    
    return {
      isBusiness: hasBusinessInfo,
      completeness: this.calculateContactCompleteness(contact)
    };
  }

  calculateContactCompleteness(contact) {
    const fields = ['first_name', 'last_name', 'phone_number', 'user_id'];
    const completedFields = fields.filter(field => contact[field]).length;
    
    return completedFields / fields.length;
  }

  async analyzeVenue(venue) {
    return {
      hasVenue: true,
      location: venue.location,
      title: venue.title,
      address: venue.address,
      foursquareId: venue.foursquare_id,
      type: venue.type,
      context: this.analyzeVenueContext(venue)
    };
  }

  analyzeVenueContext(venue) {
    const businessTypes = ['restaurant', 'office', 'hotel', 'conference', 'meeting'];
    const isBusinessVenue = businessTypes.some(type => venue.type?.toLowerCase().includes(type));
    
    return {
      isBusinessVenue,
      venueCategory: isBusinessVenue ? 'business' : 'personal'
    };
  }

  synthesizeMultiModalUnderstanding(processingResults, modalities) {
    const synthesis = {
      summary: this.generateSummary(processingResults, modalities),
      primaryModality: this.determinePrimaryModality(modalities),
      combinedIntent: this.combineIntents(processingResults),
      context: this.buildContext(processingResults, modalities),
      recommendations: this.generateRecommendations(processingResults, modalities),
      confidence: this.calculateOverallConfidence(processingResults),
      metadata: {
        processingTime: Date.now(),
        modalitiesPresent: Object.keys(modalities).filter(key => {
          const value = modalities[key];
          return Array.isArray(value) ? value.length > 0 : !!value;
        }),
        totalContentSize: this.calculateTotalContentSize(modalities)
      }
    };

    return synthesis;
  }

  generateSummary(processingResults, modalities) {
    const summaries = [];

    if (processingResults.textAnalysis?.hasText) {
      summaries.push(`Text: ${processingResults.textAnalysis.wordCount} words, ${processingResults.textAnalysis.sentiment.sentiment} sentiment`);
    }

    if (processingResults.visualAnalysis?.hasImages) {
      summaries.push(`${processingResults.visualAnalysis.count} images analyzed`);
    }

    if (processingResults.documentAnalysis?.hasDocuments) {
      summaries.push(`${processingResults.documentAnalysis.count} documents processed`);
    }

    if (processingResults.audioAnalysis?.hasAudio) {
      summaries.push(`${processingResults.audioAnalysis.count} audio files analyzed`);
    }

    if (processingResults.videoAnalysis?.hasVideo) {
      summaries.push(`${processingResults.videoAnalysis.count} video files analyzed`);
    }

    return summaries.join('; ') || 'No content analyzed';
  }

  determinePrimaryModality(modalities) {
    const modalityWeights = {
      text: modalities.text.length > 100 ? 3 : modalities.text.length > 0 ? 1 : 0,
      images: modalities.images.length * 2,
      documents: modalities.documents.length * 3,
      audio: modalities.audio.length * 2,
      video: modalities.video.length * 4,
      location: modalities.location ? 2 : 0,
      contact: modalities.contact ? 1 : 0,
      venue: modalities.venue ? 1 : 0
    };

    let maxWeight = 0;
    let primaryModality = 'text';

    for (const [modality, weight] of Object.entries(modalityWeights)) {
      if (weight > maxWeight) {
        maxWeight = weight;
        primaryModality = modality;
      }
    }

    return primaryModality;
  }

  combineIntents(processingResults) {
    const intents = [];

    if (processingResults.textAnalysis?.intent) {
      intents.push(processingResults.textAnalysis.intent);
    }

    if (processingResults.visualAnalysis?.hasImages) {
      intents.push({ primary: 'visual_analysis', all: ['visual'], confidence: 0.8 });
    }

    if (processingResults.documentAnalysis?.hasDocuments) {
      intents.push({ primary: 'document_review', all: ['document', 'review'], confidence: 0.9 });
    }

    return {
      primary: intents.length > 0 ? intents[0].primary : 'general',
      all: intents.flatMap(i => i.all),
      confidence: intents.length > 0 ? Math.max(...intents.map(i => i.confidence)) : 0.5
    };
  }

  buildContext(processingResults, modalities) {
    const context = {
      contentTypes: [],
      topics: [],
      entities: [],
      urgency: 'low',
      businessContext: false
    };

    // Extract topics from text analysis
    if (processingResults.textAnalysis?.topics) {
      context.topics = Object.keys(processingResults.textAnalysis.topics);
    }

    // Extract entities from text analysis
    if (processingResults.textAnalysis?.entities) {
      context.entities = Object.entries(processingResults.textAnalysis.entities)
        .filter(([_, entities]) => entities.length > 0)
        .map(([type, entities]) => ({ type, entities }));
    }

    // Determine urgency
    if (processingResults.textAnalysis?.urgency) {
      context.urgency = processingResults.textAnalysis.urgency.level;
    }

    // Determine business context
    const businessIndicators = [
      processingResults.textAnalysis?.entities?.organizations?.length > 0,
      processingResults.documentAnalysis?.hasDocuments,
      modalities.location && modalities.location.businessHours
    ];

    context.businessContext = businessIndicators.some(indicator => indicator);

    // Add content types
    if (processingResults.textAnalysis?.hasText) context.contentTypes.push('text');
    if (processingResults.visualAnalysis?.hasImages) context.contentTypes.push('images');
    if (processingResults.documentAnalysis?.hasDocuments) context.contentTypes.push('documents');
    if (processingResults.audioAnalysis?.hasAudio) context.contentTypes.push('audio');
    if (processingResults.videoAnalysis?.hasVideo) context.contentTypes.push('video');

    return context;
  }

  generateRecommendations(processingResults, modalities) {
    const recommendations = [];

    // Text-based recommendations
    if (processingResults.textAnalysis?.questions?.length > 0) {
      recommendations.push('Answer the questions in the message');
    }

    if (processingResults.textAnalysis?.commands?.length > 0) {
      recommendations.push('Execute the requested commands');
    }

    // Visual content recommendations
    if (processingResults.visualAnalysis?.hasImages) {
      recommendations.push('Review and analyze the provided images');
    }

    // Document recommendations
    if (processingResults.documentAnalysis?.hasDocuments) {
      recommendations.push('Process and extract information from documents');
    }

    // Urgency-based recommendations
    if (processingResults.textAnalysis?.urgency?.level === 'high') {
      recommendations.unshift('Handle with high priority - urgent content detected');
    }

    return recommendations;
  }

  calculateOverallConfidence(processingResults) {
    const confidences = [];

    if (processingResults.textAnalysis?.sentiment?.confidence) {
      confidences.push(processingResults.textAnalysis.sentiment.confidence);
    }

    if (processingResults.textAnalysis?.intent?.confidence) {
      confidences.push(processingResults.textAnalysis.intent.confidence);
    }

    if (processingResults.visualAnalysis?.images?.length > 0) {
      confidences.push(0.7); // Placeholder for visual analysis confidence
    }

    if (processingResults.documentAnalysis?.documents?.length > 0) {
      confidences.push(0.8); // Placeholder for document analysis confidence
    }

    if (confidences.length === 0) return 0.5;

    const average = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    return Math.round(average * 100) / 100;
  }

  calculateTotalContentSize(modalities) {
    let totalSize = 0;

    totalSize += modalities.text.length;
    totalSize += modalities.images.reduce((sum, img) => sum + (img.file_size || 0), 0);
    totalSize += modalities.documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
    totalSize += modalities.audio.reduce((sum, audio) => sum + (audio.file_size || 0), 0);
    totalSize += modalities.video.reduce((sum, video) => sum + (video.file_size || 0), 0);

    return totalSize;
  }
}
