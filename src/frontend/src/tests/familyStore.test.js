import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useFamilyStore } from '../app/stores/familyStore';
import * as familiesApi from '../app/api/familiesApi';
const mockFamily = {
    id: 'fam-1',
    name: 'Muster Familie',
    createdByUserId: 'user-1',
    createdAtUtc: '2024-01-01T00:00:00Z',
    members: [
        {
            id: 'mem-1',
            familyId: 'fam-1',
            userId: 'user-1',
            firstName: 'Max',
            lastName: 'Muster',
            email: 'max@example.com',
            phoneNumber: null,
            isAdmin: true,
            color: '#4f46e5',
            joinedAtUtc: '2024-01-01T00:00:00Z',
        },
    ],
};
describe('familyStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.restoreAllMocks();
    });
    it('loads families and selects the first', async () => {
        vi.spyOn(familiesApi, 'getFamilies').mockResolvedValue([mockFamily]);
        const store = useFamilyStore();
        await store.loadFamilies();
        expect(store.families).toHaveLength(1);
        expect(store.selectedFamilyId).toBe('fam-1');
        expect(store.selectedFamily?.name).toBe('Muster Familie');
    });
    it('adds new family to the list', async () => {
        vi.spyOn(familiesApi, 'getFamilies').mockResolvedValue([]);
        vi.spyOn(familiesApi, 'createFamily').mockResolvedValue(mockFamily);
        const store = useFamilyStore();
        await store.loadFamilies();
        await store.createNewFamily('Muster Familie');
        expect(store.families).toHaveLength(1);
        expect(store.selectedFamilyId).toBe('fam-1');
    });
    it('renames family and updates local state', async () => {
        const renamedFamily = { ...mockFamily, name: 'Neue Familie' };
        vi.spyOn(familiesApi, 'getFamilies').mockResolvedValue([mockFamily]);
        vi.spyOn(familiesApi, 'updateFamily').mockResolvedValue(renamedFamily);
        const store = useFamilyStore();
        await store.loadFamilies();
        await store.renameFamily('fam-1', 'Neue Familie');
        expect(store.selectedFamily?.name).toBe('Neue Familie');
    });
    it('adds member and reloads families', async () => {
        const updatedFamily = {
            ...mockFamily,
            members: [
                ...mockFamily.members,
                {
                    id: 'mem-2',
                    familyId: 'fam-1',
                    userId: 'user-2',
                    firstName: 'Lisa',
                    lastName: 'Muster',
                    email: 'lisa@example.com',
                    phoneNumber: '1234',
                    isAdmin: false,
                    color: '#4f46e5',
                    joinedAtUtc: '2024-01-02T00:00:00Z',
                },
            ],
        };
        vi.spyOn(familiesApi, 'getFamilies').mockResolvedValueOnce([mockFamily]).mockResolvedValueOnce([updatedFamily]);
        vi.spyOn(familiesApi, 'addFamilyMember').mockResolvedValue();
        const store = useFamilyStore();
        await store.loadFamilies();
        await store.addMember('fam-1', { firstName: 'Lisa', lastName: 'Muster', email: 'lisa@example.com' });
        expect(store.selectedFamily?.members).toHaveLength(2);
    });
});
