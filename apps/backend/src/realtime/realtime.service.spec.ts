import { ChatThreadType } from '@prisma/client';
import { Server } from 'socket.io';
import { RealtimeService } from './realtime.service';

describe('RealtimeService', () => {
  const emit = jest.fn();
  const to = jest.fn(() => ({ emit }));
  const service = new RealtimeService();

  beforeEach(() => {
    jest.clearAllMocks();
    service.attach({ to } as unknown as Server);
  });

  it('publishes member events only to that member room', () => {
    service.publishToMember('member_1', 'notification:new', { id: 'note_1' });

    expect(to).toHaveBeenCalledWith('member:member_1');
    expect(emit).toHaveBeenCalledWith('notification:new', { id: 'note_1' });
  });

  it('publishes cohort events only to the scoped cohort room', () => {
    service.publishToCohort(ChatThreadType.EVENT, 'event_1', 'cohort:message', {
      message: { id: 'message_1' },
    });

    expect(to).toHaveBeenCalledWith('cohort:EVENT:event_1');
    expect(emit).toHaveBeenCalledWith('cohort:message', {
      message: { id: 'message_1' },
    });
  });
});
