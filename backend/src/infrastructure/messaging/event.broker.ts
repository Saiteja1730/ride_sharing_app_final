import { redisService } from '../redis/redis.service';
import { logger } from '../../utils/logger';

export interface DomainEvent<T = any> {
  eventId: string;
  eventType: string;
  timestamp: string;
  correlationId?: string;
  payload: T;
}

export type EventConsumerHandler<T = any> = (event: DomainEvent<T>) => Promise<void>;

export class EventBrokerService {
  private static instance: EventBrokerService;

  private constructor() {}

  public static getInstance(): EventBrokerService {
    if (!EventBrokerService.instance) {
      EventBrokerService.instance = new EventBrokerService();
    }
    return EventBrokerService.instance;
  }

  public async publish<T>(streamName: string, eventType: string, payload: T, correlationId?: string): Promise<string> {
    const client = redisService.getRawClient();
    if (client.status !== 'ready') {
      throw new Error('Event Broker requires Redis to be online. Failing closed.');
    }

    const event: DomainEvent<T> = {
      eventId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventType,
      timestamp: new Date().toISOString(),
      correlationId,
      payload,
    };

    const messageId = await client.xadd(
      `events:${streamName}`,
      '*',
      'event',
      JSON.stringify(event)
    );
    logger.info(`📢 Event Published [${streamName}:${eventType}] ID: ${messageId}`);
    return messageId || '';
  }

  public async subscribe<T>(
    streamName: string,
    groupName: string,
    consumerName: string,
    handler: EventConsumerHandler<T>
  ): Promise<void> {
    const client = redisService.getRawClient();
    const streamKey = `events:${streamName}`;

    // Ensure Consumer Group exists
    try {
      await client.xgroup('CREATE', streamKey, groupName, '$', 'MKSTREAM');
    } catch (err: any) {
      if (!err.message.includes('BUSYGROUP')) {
        logger.error(`Error creating consumer group ${groupName}: ${err.message}`);
      }
    }

    // Consumer polling loop
    const poll = async () => {
      try {
        const response: any = await (client as any).xreadgroup(
          'GROUP',
          groupName,
          consumerName,
          'BLOCK',
          2000,
          'COUNT',
          10,
          'STREAMS',
          streamKey,
          '>'
        );


        if (response && response.length > 0) {
          const [_, messages] = response[0] as [string, any[]];
          for (const [msgId, fields] of messages) {
            const rawEvent = fields[1];
            const event: DomainEvent<T> = JSON.parse(rawEvent);
            try {
              // Deduplicate event processing using eventId key in Redis
              const processedKey = `event:processed:${event.eventId}`;
              const isProcessed = await redisService.get(processedKey);
              if (isProcessed) {
                await client.xack(streamKey, groupName, msgId);
                continue;
              }

              await handler(event);
              await redisService.setex(processedKey, 86400, '1');
              await client.xack(streamKey, groupName, msgId);
            } catch (handlerErr: any) {
              logger.error(`Error processing event ${event.eventId}: ${handlerErr.message}`);
              const retryKey = `event:retry:${event.eventId}`;
              const retries = (await client.incr(retryKey));
              if (retries > 3) {
                // Route to Dead Letter Queue (DLQ) Stream
                await client.xadd(`events:${streamName}:dlq`, '*', 'event', JSON.stringify(event), 'error', handlerErr.message);
                await client.xack(streamKey, groupName, msgId);
                logger.warn(`🚨 Event ${event.eventId} exceeded 3 retries. Forwarded to DLQ events:${streamName}:dlq`);
              }
            }

          }
        }
      } catch (err: any) {
        logger.warn(`Consumer read warning [${streamName}]: ${err.message}`);
      }
      setImmediate(poll);
    };

    poll();
  }
}

export const eventBroker = EventBrokerService.getInstance();
