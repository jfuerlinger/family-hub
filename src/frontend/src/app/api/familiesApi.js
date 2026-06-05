import { apiClient } from './client';
export async function getFamilies() {
    const response = await apiClient.get('/families');
    return response.data;
}
export async function createFamily(request) {
    const response = await apiClient.post('/families', request);
    return response.data;
}
export async function getFamily(familyId) {
    const response = await apiClient.get(`/families/${familyId}`);
    return response.data;
}
export async function addFamilyMember(familyId, request) {
    await apiClient.post(`/families/${familyId}/members`, request);
}
export async function updateFamily(familyId, request) {
    const response = await apiClient.put(`/families/${familyId}`, request);
    return response.data;
}
export async function updateFamilyMember(familyId, memberId, request) {
    await apiClient.put(`/families/${familyId}/members/${memberId}`, request);
}
