import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { addFamilyMember, createFamily, getFamilies, updateFamily, updateFamilyMember, } from '../api/familiesApi';
export const useFamilyStore = defineStore('family', () => {
    const families = ref([]);
    const selectedFamilyId = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const selectedFamily = computed(() => families.value.find(f => f.id === selectedFamilyId.value) ?? null);
    async function loadFamilies() {
        loading.value = true;
        error.value = null;
        try {
            families.value = await getFamilies();
            if (!selectedFamilyId.value && families.value.length > 0) {
                selectedFamilyId.value = families.value[0].id;
            }
        }
        catch {
            error.value = 'Familien konnten nicht geladen werden.';
        }
        finally {
            loading.value = false;
        }
    }
    async function createNewFamily(name) {
        loading.value = true;
        error.value = null;
        try {
            const family = await createFamily({ name });
            families.value.push(family);
            selectedFamilyId.value = family.id;
        }
        catch {
            error.value = 'Familie konnte nicht erstellt werden.';
        }
        finally {
            loading.value = false;
        }
    }
    async function renameFamily(familyId, name) {
        loading.value = true;
        error.value = null;
        try {
            const updatedFamily = await updateFamily(familyId, { name });
            const targetIndex = families.value.findIndex(family => family.id === familyId);
            if (targetIndex >= 0) {
                families.value.splice(targetIndex, 1, updatedFamily);
            }
            else {
                families.value.push(updatedFamily);
            }
            selectedFamilyId.value = updatedFamily.id;
        }
        catch {
            error.value = 'Familienname konnte nicht gespeichert werden.';
        }
        finally {
            loading.value = false;
        }
    }
    async function addMember(familyId, request) {
        loading.value = true;
        error.value = null;
        try {
            await addFamilyMember(familyId, request);
            await loadFamilies();
        }
        catch {
            error.value = 'Mitglied konnte nicht hinzugefügt werden.';
        }
        finally {
            loading.value = false;
        }
    }
    async function editMember(familyId, memberId, request) {
        loading.value = true;
        error.value = null;
        try {
            await updateFamilyMember(familyId, memberId, request);
            await loadFamilies();
        }
        catch {
            error.value = 'Mitglied konnte nicht aktualisiert werden.';
        }
        finally {
            loading.value = false;
        }
    }
    function selectFamily(id) {
        selectedFamilyId.value = id;
    }
    return {
        families,
        selectedFamilyId,
        loading,
        error,
        selectedFamily,
        loadFamilies,
        createNewFamily,
        renameFamily,
        addMember,
        editMember,
        selectFamily,
    };
});
