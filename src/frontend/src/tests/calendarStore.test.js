import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCalendarStore } from '../app/stores/calendarStore';
import * as calendarApi from '../app/api/calendarApi';
const mockEvent = {
    id: 'ev-1',
    userId: 'user-1',
    title: 'Meeting',
    description: null,
    startUtc: '2024-06-01T10:00:00Z',
    endUtc: '2024-06-01T11:00:00Z',
    allDay: false,
    createdAtUtc: '2024-01-01T00:00:00Z',
};
const mockFamilyEvent = {
    ...mockEvent,
    memberColor: '#4f46e5',
    memberName: 'Max Muster',
};
describe('calendarStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.restoreAllMocks();
    });
    it('loads personal events', async () => {
        vi.spyOn(calendarApi, 'getMyEvents').mockResolvedValue([mockEvent]);
        const store = useCalendarStore();
        await store.loadMyEvents();
        expect(store.myEvents).toHaveLength(1);
        expect(store.myEvents[0].title).toBe('Meeting');
    });
    it('toggles member visibility', () => {
        const store = useCalendarStore();
        expect(store.isMemberVisible('user-1')).toBe(true);
        store.toggleMemberVisibility('user-1');
        expect(store.isMemberVisible('user-1')).toBe(false);
        store.toggleMemberVisibility('user-1');
        expect(store.isMemberVisible('user-1')).toBe(true);
    });
    it('filters family events by member visibility', async () => {
        vi.spyOn(calendarApi, 'getFamilyEvents').mockResolvedValue([mockFamilyEvent]);
        const store = useCalendarStore();
        await store.loadFamilyEvents('fam-1');
        expect(store.visibleFamilyEvents()).toHaveLength(1);
        store.toggleMemberVisibility('user-1');
        expect(store.visibleFamilyEvents()).toHaveLength(0);
    });
    it('reloads my events after creating an event', async () => {
        const createdEvent = { ...mockEvent, id: 'ev-2' };
        vi.spyOn(calendarApi, 'createEvent').mockResolvedValue(createdEvent);
        vi.spyOn(calendarApi, 'getMyEvents').mockResolvedValue([mockEvent, createdEvent]);
        const store = useCalendarStore();
        await store.addEvent({
            title: 'Neue Serie',
            startUtc: '2024-06-01T10:00:00Z',
            endUtc: '2024-06-01T11:00:00Z',
            recurrence: 'weekly',
            recurrenceInterval: 1,
            recurrenceCount: 2,
        });
        expect(store.myEvents).toHaveLength(2);
        expect(store.myEvents[1].id).toBe('ev-2');
    });
});
