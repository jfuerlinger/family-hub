import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getMyEvents, createEvent, getFamilyEvents } from '../api/calendarApi';
export const useCalendarStore = defineStore('calendar', () => {
    const myEvents = ref([]);
    const familyEvents = ref([]);
    const hiddenMemberIds = ref(new Set());
    const loading = ref(false);
    const error = ref(null);
    async function loadMyEvents() {
        loading.value = true;
        error.value = null;
        try {
            myEvents.value = await getMyEvents();
        }
        catch {
            error.value = 'Ereignisse konnten nicht geladen werden.';
        }
        finally {
            loading.value = false;
        }
    }
    async function addEvent(request) {
        loading.value = true;
        error.value = null;
        try {
            await createEvent(request);
            myEvents.value = await getMyEvents();
        }
        catch {
            error.value = 'Ereignis konnte nicht erstellt werden.';
        }
        finally {
            loading.value = false;
        }
    }
    async function loadFamilyEvents(familyId) {
        loading.value = true;
        error.value = null;
        try {
            familyEvents.value = await getFamilyEvents(familyId);
        }
        catch {
            error.value = 'Familienereignisse konnten nicht geladen werden.';
        }
        finally {
            loading.value = false;
        }
    }
    function toggleMemberVisibility(userId) {
        if (hiddenMemberIds.value.has(userId)) {
            hiddenMemberIds.value.delete(userId);
        }
        else {
            hiddenMemberIds.value.add(userId);
        }
    }
    function isMemberVisible(userId) {
        return !hiddenMemberIds.value.has(userId);
    }
    const visibleFamilyEvents = () => familyEvents.value.filter(e => !hiddenMemberIds.value.has(e.userId));
    return {
        myEvents, familyEvents, hiddenMemberIds, loading, error,
        loadMyEvents, addEvent, loadFamilyEvents, toggleMemberVisibility, isMemberVisible, visibleFamilyEvents,
    };
});
