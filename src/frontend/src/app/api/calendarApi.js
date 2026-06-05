import { apiClient } from './client';
export async function getMyEvents() {
    const response = await apiClient.get('/events');
    return response.data;
}
export async function createEvent(request) {
    const response = await apiClient.post('/events', request);
    return response.data;
}
export async function getFamilyEvents(familyId) {
    const response = await apiClient.get(`/families/${familyId}/events`);
    return response.data;
}
