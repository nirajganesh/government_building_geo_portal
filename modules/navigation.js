// ============================================================================
// NAVIGATION SYSTEM - ES6 MODULE FORMAT
// ============================================================================
import GeoJSON from 'ol/format/GeoJSON';

import {
    getMap,
    VECTOR_SOURCES,
    SIMPLE_STORAGE,
    API_CONFIG,
    fastPopulateDropdown,
    showNotification
} from '../main.js';

// Module-level state
let districtData = null;
let selectedDistrict = null;
let selectedTehsil = null;
let selectedVillage = null;
let loadingPromise = null;

// ============================================================================
// DISTRICT FUNCTIONS
// ============================================================================

export async function loadDistricts() {
    // Return cached data if available
    if (districtData) {
        return districtData;
    }

    // Return existing promise if already loading
    if (loadingPromise) {
        return loadingPromise;
    }

    // Check simple storage first
    if (SIMPLE_STORAGE.districts) {
        districtData = SIMPLE_STORAGE.districts;
        return SIMPLE_STORAGE.districts;
    }

    // Load from API
    loadingPromise = fetchDistrictsFromAPI();
    
    try {
        districtData = await loadingPromise;
        SIMPLE_STORAGE.districts = districtData;
        return districtData;
    } catch (error) {
        console.error('Error loading districts:', error);
        throw error;
    } finally {
        loadingPromise = null;
    }
}

export async function fetchDistrictsFromAPI() {
    try {
        const response = await fetch(API_CONFIG.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_CONFIG.authKey
            },
            body: JSON.stringify({ layerName: 'cg_district_boundary' })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        return await response.json();
    } catch (error) {
        console.error('Error loading districts:', error);
        throw error;
    }
}

export function populateDistrictDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown || !districtData) {
        console.warn('Cannot populate district dropdown:', { dropdown: !!dropdown, districtData: !!districtData });
        return;
    }

    // Show loading state
    dropdown.innerHTML = '<option value="">Loading districts...</option>';
    dropdown.disabled = true;

    // Use requestIdleCallback for non-blocking population
    const populateWhenIdle = () => {
        try {
            const options = districtData.features.map(feature => ({
                value: feature.properties.dist_cod,
                text: feature.properties.dist_e
            }));

            fastPopulateDropdown(dropdown, options, '------Select a District------');
            dropdown.disabled = false;
        } catch (error) {
            console.error('Error populating district dropdown:', error);
            dropdown.innerHTML = '<option value="">Error loading districts</option>';
            dropdown.disabled = false;
        }
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if (window.requestIdleCallback) {
        requestIdleCallback(populateWhenIdle);
    } else {
        setTimeout(populateWhenIdle, 10);
    }
}

export function navigateToDistrict(districtCode, clearOthers = true) {
    const map = getMap();
    if (!map || !districtData) {
        console.warn('Cannot navigate to district - map or data not available');
        return;
    }

    const selectedFeature = districtData.features.find(
        feature => feature.properties.dist_cod === districtCode
    );

    if (selectedFeature) {
        try {
            const geojsonFormat = new GeoJSON();
            const distFeatures = geojsonFormat.readFeatures(selectedFeature, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });

            if (clearOthers) {
                VECTOR_SOURCES.navDistrict.clear();
                VECTOR_SOURCES.navTehsil.clear();
                VECTOR_SOURCES.navVillage.clear();
            }

            VECTOR_SOURCES.navDistrict.addFeatures(distFeatures);

            const extent = VECTOR_SOURCES.navDistrict.getExtent();
            map.getView().fit(extent, { size: map.getSize(), duration: 1000, padding: [50, 50, 50, 50] });

            selectedDistrict = { code: districtCode, feature: selectedFeature };
            
            showNotification(`Navigated to ${selectedFeature.properties.dist_e}`, 'success');
        } catch (error) {
            console.error('Error navigating to district:', error);
            showNotification('Failed to navigate to district', 'error');
        }
    } else {
        console.warn('District not found:', districtCode);
        showNotification('District not found', 'warning');
    }
}

export function getSelectedDistrict() {
    return selectedDistrict;
}

export function setSelectedDistrict(district) {
    selectedDistrict = district;
}

// ============================================================================
// TEHSIL FUNCTIONS
// ============================================================================

export async function loadTehsils(districtCode) {
    // Check simple storage first
    if (SIMPLE_STORAGE.tehsils[districtCode]) {
        return SIMPLE_STORAGE.tehsils[districtCode];
    }

    try {
        const response = await fetch(`${API_CONFIG.baseUrl}/block`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_CONFIG.authKey
            },
            body: JSON.stringify({
                layerName: 'cg_tehsil_boundary',
                filter: `dist_cod = ${districtCode}`
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        const data = await response.json();
        SIMPLE_STORAGE.tehsils[districtCode] = data;
        return data;
    } catch (error) {
        console.error('Error loading tehsils:', error);
        throw error;
    }
}

export function populateTehsilDropdown(dropdownId, tehsilData) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown || !tehsilData) {
        console.warn('Cannot populate tehsil dropdown');
        return;
    }

    try {
        const options = tehsilData.features.map(feature => ({
            value: feature.properties.teh_cod,
            text: feature.properties.teh_e
        }));

        fastPopulateDropdown(dropdown, options, '------Select a Tehsil------');
    } catch (error) {
        console.error('Error populating tehsil dropdown:', error);
        dropdown.innerHTML = '<option value="">Error loading tehsils</option>';
    }
}

export function navigateToTehsil(tehsilData, tehsilCode) {
    const map = getMap();
    if (!map || !tehsilData) {
        console.warn('Cannot navigate to tehsil - map or data not available');
        return;
    }

    const selectedFeature = tehsilData.features.find(
        feature => feature.properties.teh_cod === tehsilCode
    );

    if (selectedFeature) {
        try {
            const geojsonFormat = new GeoJSON();
            const tehsilFeatures = geojsonFormat.readFeatures(selectedFeature, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });

            VECTOR_SOURCES.navDistrict.clear();
            VECTOR_SOURCES.navTehsil.clear();
            VECTOR_SOURCES.navVillage.clear();
            VECTOR_SOURCES.navTehsil.addFeatures(tehsilFeatures);

            const extent = VECTOR_SOURCES.navTehsil.getExtent();
            map.getView().fit(extent, { size: map.getSize(), duration: 1000, padding: [50, 50, 50, 50] });

            selectedTehsil = { code: tehsilCode, feature: selectedFeature };
            
            showNotification(`Navigated to ${selectedFeature.properties.teh_e}`, 'success');
        } catch (error) {
            console.error('Error navigating to tehsil:', error);
            showNotification('Failed to navigate to tehsil', 'error');
        }
    } else {
        console.warn('Tehsil not found:', tehsilCode);
        showNotification('Tehsil not found', 'warning');
    }
}

export function getSelectedTehsil() {
    return selectedTehsil;
}

export function setSelectedTehsil(tehsil) {
    selectedTehsil = tehsil;
}

// ============================================================================
// VILLAGE FUNCTIONS
// ============================================================================

export async function loadVillages(tehsilCode) {
    if (SIMPLE_STORAGE.villagesByDistrict[tehsilCode]) {
        return SIMPLE_STORAGE.villagesByDistrict[tehsilCode];
    }

    try {
        const response = await fetch(`${API_CONFIG.baseUrl}/block`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_CONFIG.authKey
            },
            body: JSON.stringify({
                layerName: 'cg_village_boundary',
                filter: `teh_cod = ${tehsilCode}`
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        const data = await response.json();
        SIMPLE_STORAGE.villagesByDistrict[tehsilCode] = data;
        return data;
    } catch (error) {
        console.error('Error loading villages:', error);
        throw error;
    }
}

export function populateVillageDropdown(dropdownId, villageData) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown || !villageData) {
        console.warn('Cannot populate village dropdown');
        return;
    }

    try {
        const options = villageData.features.map(feature => ({
            value: feature.properties.vill_cod,
            text: feature.properties.vill_nam
        }));

        fastPopulateDropdown(dropdown, options, '------Select a Village------');
    } catch (error) {
        console.error('Error populating village dropdown:', error);
        dropdown.innerHTML = '<option value="">Error loading villages</option>';
    }
}

export function navigateToVillage(villageData, villageCode) {
    const map = getMap();
    if (!map || !villageData) {
        console.warn('Cannot navigate to village - map or data not available');
        return;
    }

    const selectedFeature = villageData.features.find(
        feature => feature.properties.vill_cod === villageCode
    );

    if (selectedFeature) {
        try {
            const geojsonFormat = new GeoJSON();
            const villageFeatures = geojsonFormat.readFeatures(selectedFeature, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });

            VECTOR_SOURCES.navDistrict.clear();
            VECTOR_SOURCES.navTehsil.clear();
            VECTOR_SOURCES.navVillage.clear();
            VECTOR_SOURCES.navVillage.addFeatures(villageFeatures);

            const extent = VECTOR_SOURCES.navVillage.getExtent();
            map.getView().fit(extent, { size: map.getSize(), duration: 1000, padding: [50, 50, 50, 50] });

            selectedVillage = { code: villageCode, feature: selectedFeature };
            
            showNotification(`Navigated to ${selectedFeature.properties.vill_nam}`, 'success');
        } catch (error) {
            console.error('Error navigating to village:', error);
            showNotification('Failed to navigate to village', 'error');
        }
    } else {
        console.warn('Village not found:', villageCode);
        showNotification('Village not found', 'warning');
    }
}

export function getSelectedVillage() {
    return selectedVillage;
}

export function setSelectedVillage(village) {
    selectedVillage = village;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function clearDropdown(dropdownId, defaultText) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
        dropdown.innerHTML = `<option value="">${defaultText}</option>`;
    }
}

export function clearAllSelections() {
    VECTOR_SOURCES.navDistrict.clear();
    VECTOR_SOURCES.navTehsil.clear();
    VECTOR_SOURCES.navVillage.clear();
    selectedDistrict = null;
    selectedTehsil = null;
    selectedVillage = null;
}

export function getDistrictData() {
    return districtData;
}