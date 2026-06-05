import { apiClient } from './client';
export async function getTodos(familyId) {
    const response = await apiClient.get(`/families/${familyId}/todos`);
    return response.data;
}
export async function createTodo(familyId, request) {
    const response = await apiClient.post(`/families/${familyId}/todos`, request);
    return response.data;
}
export async function markTodoDone(familyId, todoId) {
    const response = await apiClient.patch(`/families/${familyId}/todos/${todoId}/done`);
    return response.data;
}
export async function markTodoPending(familyId, todoId) {
    const response = await apiClient.patch(`/families/${familyId}/todos/${todoId}/pending`);
    return response.data;
}
