import { newsletterRepository } from './newsletter.repository.js';

export class NewsletterService {
  constructor(repository = newsletterRepository) {
    this.repository = repository;
  }

  async subscribe(email, source = 'footer') {
    const subscriber = await this.repository.subscribe(email, source);

    return {
      email: subscriber.email,
      source: subscriber.source,
      subscribedAt: subscriber.subscribedAt,
      isActive: subscriber.isActive
    };
  }
}

export const newsletterService = new NewsletterService();
