import { DomainEventInterface } from 'domain-event-typeorm';

export interface EntityAndEventInterface<EN> {
  /** The domain entity */
  entity: EN;
  /** The domain event */
  event: DomainEventInterface;
}
