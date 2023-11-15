import { QueryRunner } from 'typeorm';
import { TypeOrmTransactionInterface } from 'transaction-typeorm';
import { DomainEventPublisherFactoryInterface, TypeOrmEventPublisherFactoryOptionsInterface } from 'domain-event-typeorm';
import { EntityAndEventInterface } from '../interface';

export abstract class AbstractTypeOrmDomainMutationEventService<EN, D> {
  /**
   * Constructor.
   * 
   * @param eventPublisherFactory - The domain event publisher factory, creates instance of the domain event publisher which contains the current query runner.
   * @param transactionService - The instance of transactional service.
   */
  constructor(
    protected readonly eventPublisherFactory: DomainEventPublisherFactoryInterface<TypeOrmEventPublisherFactoryOptionsInterface>,
    protected readonly transactionService: TypeOrmTransactionInterface,
  ) {}

  /**
   * Creates the entity based on the data input and emits the domain event for this action.
   * 
   * @param data - The input data (DTO).
   * 
   * @returns - Resolved promise with saved entity.
   */
  async create(data: D): Promise<EN> {
    const result = await this.transactionService.transaction<EN>(
      async (queryRunner: QueryRunner) => {
        const { entity, event } = await this.getEntityForCreateAndEvent(
          queryRunner,
          data,
        );
        const eventPublisher = this.eventPublisherFactory.create({
          queryRunner,
        });

        await eventPublisher.publish(event);

        return queryRunner.manager.save(entity);
      },
    );

    return result;
  }

  /**
   * Updates the entity by the id based on the data input and emits the domain event for this action.
   * 
   * @param id - The primary identifier.
   * @param data  - The input data (DTO).
   * 
   * @returns - Resolved promise with updated entity.
   */
  async update(id: string, data: D): Promise<EN> {
    const result = await this.transactionService.transaction<EN>(
      async (queryRunner: QueryRunner) => {
        const { entity, event } = await this.getEntityForUpdateAndEvent(
          queryRunner,
          id,
          data,
        );
        const eventPublisher = this.eventPublisherFactory.create({
          queryRunner: queryRunner,
        });

        const update = await queryRunner.manager.save(entity);

        console.log(update);

        await eventPublisher.publish(event);

        return update;
      },
    );

    return result;
  }

  /**
   * Deletes the entity by the id and emits the domain event for this action.
   * 
   * @param id - The primary identifier.
   */
  async delete(id: string): Promise<void> {
    this.transactionService.transaction<EN>(async (queryRunner: QueryRunner) => {
      const { entity, event } = await this.getEntityForDeleteAndEvent(
        queryRunner,
        id,
      );
      const eventPublisher = this.eventPublisherFactory.create({
        queryRunner: queryRunner,
      });

      await eventPublisher.publish(event);

      return queryRunner.manager.remove(entity);
    });
  }

  /**
   * Creates the entity and the event for this action.
   * 
   * @param queryRunner - The instance of the TypeOrm QueryRunner.
   * @param data - The input data (DTO).
   * 
   * @returns - Resolved promise with entity and event.
   */
  abstract getEntityForCreateAndEvent(
    queryRunner: QueryRunner,
    data: D,
  ): Promise<EntityAndEventInterface<EN>>;

  /**
   * Provides the entity for update and the event for this action.
   * 
   * @param queryRunner - The instance of the TypeOrm QueryRunner.
   * @param id - The primary identifier.
   * @param data - The input data (DTO).
   * 
   * @returns - Resolved promise with entity and event.
   */
  abstract getEntityForUpdateAndEvent(
    queryRunner: QueryRunner,
    id: string,
    data: D,
  ): Promise<EntityAndEventInterface<EN>>;

  /**
   * Provides the entity for delete and the event for this action.
   * 
   * @param queryRunner - The instance of the TypeOrm QueryRunner.
   * @param id - The primary identifier.
   * 
   * @returns - Resolved promise with entity and event.
   */
  abstract getEntityForDeleteAndEvent(
    queryRunner: QueryRunner,
    id: string,
  ): Promise<EntityAndEventInterface<EN>>;
}
