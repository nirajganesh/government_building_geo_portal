import './style.css';
import { Map, View } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { defaults as defaultControls, Attribution } from 'ol/control';
import { fromLonLat, toLonLat } from 'ol/proj';
import { createEmpty, extend as olExtend, isEmpty as olIsEmpty } from 'ol/extent';

import { 
    initializeBasemaps, 
    initializeWMSLayers, 
    toggleLayer,
    switchBasemap,
    restoreActiveLayerState,
    toggleLegend,
    updateLegend
} from './modules/layers.js';

import { 
    setupAnalysisListeners
} from './modules/analysis.js';

import {
    initializeMeasurementSystem,
    startMeasurement,
    stopMeasurement,
    clearAllMeasurements,
    exportMeasurements
} from './modules/measurement.js';

import {
    loadDistricts,
    populateDistrictDropdown,
    navigateToDistrict,
    loadTehsils,
    populateTehsilDropdown,
    navigateToTehsil,
    loadVillages,
    populateVillageDropdown,
    navigateToVillage,
    clearAllSelections
} from './modules/navigation.js';

import {
    initializePrintModule,
    updatePrintSettings,
    getPrintSettings,
    resetPrintSettings,
    updatePrintPreview,
    generatePrintMap,
    exportAsPDF,
    exportAsJPEG,
    getAvailableFormats
} from './modules/print.js';

import {
    populateDepartmentDropdown,
    searchBuildings,
    clearBuildingResults,
    exportBuildingAsExcel,
    exportBuildingAsPDF,
    getGPCoverageData,
    toggleBuildingLayer,
    createBuildingWMSLayer,
    createBuildingVectorLayer,
    setupBuildingClickListener,
    buildingState
} from './modules/building.js';

// ==================== CONFIGURATION ====================
export const API_CONFIG = {
    baseUrl: 'https://cggis.cgstate.gov.in/giscg',
    adminUrl: 'https://cggis.cgstate.gov.in/giscg/wmscgcog',
    wfsUrl: 'https://cggis.cgstate.gov.in/giscg/wmscgcog',
    authKey: 'd01de439-448c-4b48-ac5b-5700ab0274b8',
    apiUrl: 'https://cggis.cgstate.gov.in/bisaglayerstatus/api/geoportal',
    apiAuthKey: '106fb8fd-ace3-4d63-8eed-d7eb2f338e274'
};

export const LAYER_CONFIGS = [
    { id: 'cg_division', wms: 'cg_division_boundary', name: 'Division Boundaries' },
    { id: 'cg_dist', wms: 'cg_district_boundary', name: 'District Boundaries' },
    { id: 'cg_tehsil', wms: 'cg_tehsil_boundary', name: 'Tehsil Boundaries', minZoom: 8.5 },
    { id: 'cg_grampanchayat', wms: 'cg_gp', name: 'Gram Panchayat', minZoom: 9 },
    { id: 'cg_village', wms: 'cg_village_boundary', name: 'Village Boundaries' },
    { id: 'cg_assembly_bound', wms: 'cg_assembly_boundary', name: 'Assembly Boundaries' },
    { id: 'cg_ls_bound', wms: 'cg_lagislative_constituency_boundary', name: 'Legislative Constituency' },
    { id: 'cg_municipal_bound', wms: 'cg_municipal_boundary', name: 'Municipal Boundaries', minZoom: 8.5 },
    { id: 'nrda_villages', wms: 'NRDA_VILLAGE_BOUNDARY', name: 'NRDA Villages' },
    { id: 'nrda_sector_boundary', wms: 'NRDA_SECTOR_BOUNDARY', name: 'NRDA Sector Boundary' },
    { id: 'nrda_sector21_cbd', wms: 'NRDA_SECTOR-21_CBD', name: 'NRDA CBD Sector 21' },
    { id: 'nrda_planning_boundary', wms: 'NRDA_PLANNING_BOUNDARY', name: 'NRDA Planning Boundary' },
    { id: 'nrda_landuse', wms: 'NRDA_LANDUSE', name: 'NRDA Land Use' },
    { id: 'nrda_cluster', wms: 'NRDA_CLUSTER_BOUNDARY', name: 'NRDA Cluster Boundary' },
    { id: 'nrda_sector22', wms: 'NRDA_INDUSTRIAL_SECTOR-22', name: 'NRDA Industrial Sector 22' },
    { id: 'nrda_sector5', wms: 'NRDA_INDUSTRIAL_SECTOR-5', name: 'NRDA Industrial Sector 5' },
    { id: 'nrda_road', wms: 'NRDA_ROAD', name: 'NRDA Roads' },
    { id: 'pds_locations', wms: 'cg_pds_locations', name: 'PDS Locations' },
    { id: 'cg_mandi', wms: 'cg_mandi', name: 'Mandis' },
    { id: 'swc_godown', wms: 'CG_SWC_Godown', name: 'SWC Godowns' },
    { id: 'private_godowns', wms: 'CG_private_godowns', name: 'Private Godowns' },
    { id: 'weigh_bridge', wms: 'cg_weigh_bridge', name: 'Weigh Bridges' },
    { id: 'cg_aanganwadi_center', wms: 'CG_AWC_Locations', name: 'Anganwadi Centers' },
    { id: 'cg_school', wms: 'cg_school', name: 'Schools' },
    { id: 'cg_primary_school', wms: 'cg_school', name: 'Primary Schools' },
    { id: 'iti_institution', wms: 'CG_ITI_Institution', name: 'ITI Institutions' },
    { id: 'engineering_college', wms: 'cg_eng_colleges', name: 'Engineering Colleges' },
    { id: 'cg_university_location', wms: 'cg_university_location', name: 'Universities' },
    { id: 'cgpharmacyinstitute', wms: 'cg_pharmacy_institute', name: 'Pharmacy Institutes' },
    { id: 'polytechnic_college', wms: 'cg_polytechnic_college', name: 'Polytechnic Colleges' },
    { id: 'district_hospitals', wms: 'district_hospitals', name: 'District Hospitals' },
    { id: 'medical_colleges', wms: 'medical_colleges', name: 'Medical Colleges' },
    { id: 'cg_aadhar_center', wms: 'cg_Adhar_kendra', name: 'Aadhar Centers' },
    { id: 'sakhi_one_stop', wms: 'cg_sakhi_one_stop', name: 'Sakhi One Stop Centers' },
    { id: 'cg_airport', wms: 'cg_airport', name: 'Airports' },
    { id: 'cg_habitation', wms: 'cg_habitation', name: 'Habitations' },
    { id: 'cg_headquarter', wms: 'cg_hq', name: 'Headquarters' },
    { id: 'government_buildings', wms: 'Government_Buildings', name: 'Government Buildings' },
    { id: 'electric_poles', wms: 'cg_cspgcl_electric_pole', name: 'Electric Poles' },
    { id: 'ehv_line', wms: 'CG_EHV_LINE', name: 'EHV Lines' },
    { id: 'ehv_point', wms: 'CG_EHV_LINE_POINT', name: 'EHV Points' },
    { id: 'cg_street_light', wms: 'cg_city_street_light', name: 'Street Lights' },
    { id: 'traffic_light', wms: 'cg_traffic_light', name: 'Traffic Lights' },
    { id: 'cg_rail_line', wms: 'cg_rail_line', name: 'Railway Lines' },
    { id: 'cg_nhhighway', wms: 'cg_nh_road', name: 'National Highways' },
    { id: 'cg_statehighway', wms: 'cg_state_highway', name: 'State Highways' },
    { id: 'cg_mdr_roads', wms: 'CG_MDR_Roads', name: 'MDR Roads' },
    { id: 'cg_pmgsy_roads', wms: 'cg_pmgsy_roads', name: 'PMGSY Roads' },
    { id: 'cg_major_road', wms: 'cg_city_major_minor_road_part', name: 'Major City Roads' },
    { id: 'cg_river', wms: 'cg_river_poly', name: 'Rivers' },
    { id: 'cg_reservoir', wms: 'cg_reservoir', name: 'Reservoirs' },
    { id: 'cg_canal', wms: 'cg_canal', name: 'Canals' },
    { id: 'cg_drainage', wms: 'cg_drainage', name: 'Drainage' },
    { id: 'dug_well', wms: 'dug_well', name: 'Dug/Open Wells' },
    { id: 'watershed', wms: 'cg_watershed', name: 'Watersheds' },
    { id: 'wrd_reservoir', wms: 'CG_WRD_Reservoir', name: 'WRD Reservoirs' },
    { id: 'cg_agricrop', wms: 'agri_crop_data', name: 'Agricultural Crops' },
    { id: 'cg_soil_irri', wms: 'cg_soil_irrigation_f', name: 'Soil Irrigation' },
    { id: 'cg_soil_texture', wms: 'cg_soil_texure_84_f', name: 'Soil Texture' },
    { id: 'cg_hydrosoil', wms: 'cg_hydrosoil', name: 'Hydro Soil' },
    { id: 'cg_geomorphology', wms: 'cg_geomorphology', name: 'Geomorphology' },
    { id: 'cg_groundwater', wms: 'cg_groundwater', name: 'Groundwater' },
    { id: 'cg_lithology', wms: 'cg_lithology', name: 'Lithology' },
    { id: 'cg_mineral', wms: 'cg_mineral', name: 'Minerals' },
    { id: 'cg_forest_beat', wms: 'cg_forest_beat', name: 'Forest Beats' },
    { id: 'forest_checkpost', wms: 'cg_forest_checkpost', name: 'Forest Checkposts' },
    { id: 'forest_wood_depot', wms: 'cg_wood_depot', name: 'Wood Depots' },
    { id: 'saw_mill', wms: 'cg_sawmil', name: 'Saw Mills' },
    { id: 'sand_mine', wms: 'cg_sand_mines', name: 'Sand Mines' },
    { id: 'cg_policest', wms: 'cg_police_station', name: 'Police Stations' },
    { id: 'rto_checkpost', wms: 'cg_rto_checkpost', name: 'RTO Checkposts' },
    { id: 'cg_tourism', wms: 'cg_tourism_location', name: 'Tourism Locations' },
    { id: 'CG_monument', wms: 'CG_monument', name: 'Monuments' },
    { id: 'Government_Buildings', wms: 'Government_Buildings', name: 'Government Building' },
    { id: 'sports_infrastructure', wms: 'cg_sports_infrastrcture', name: 'Sports Infrastructure' },
    { id: 'CG_Bank_Branches', wms: 'CG_Bank_Branches', name: 'CG Bank Branches' },
    { id: 'ippb_centers', wms: 'ippb_centers', name: 'IPPB Centers' },
    { id: 'cg_atm', wms: 'cg_atm', name: 'ATM' },
    { id: 'cg_cssda', wms: 'CSSDAFINAL', name: 'CSSDA' },
    { id: 'minor_forest_produce', wms: 'cg_mfp_lac', name: 'Minor Forest Produce' },
    { id: 'liquor_shop', wms: 'cgs_liquor_shop', name: 'Liquor Shops' },
    { id: 'cg_mfp_cold_storage', wms: 'cg_mfp_cold_storage', name: 'Cold Storage Units' },
    { id: 'cg_mfp_godown', wms: 'cg_mfp_godown', name: 'Warehouses' },
    { id: 'cg_mfp_tendupatta', wms: 'cg_mfp_tendupatta', name: 'Tendupatta' },
    { id: 'cg_mfp_tamarind', wms: 'cg_mfp_tamarind', name: 'Tamarind' },
    { id: 'cg_mfp_saal_seed', wms: 'cg_mfp_saal_Seed', name: 'Saal Seed' },
    { id: 'cg_mfp_rangeeni_lac', wms: 'cg_mfp_rangeeni_lac', name: 'Rangeeni Lac' },
    { id: 'cg_mfp_kusumi_lac', wms: 'cg_mfp_kusumi_lac', name: 'Kusumi Lac' },
];

// ==================== STATE MANAGEMENT ====================
export const mapState = {
    instance: null,
    basemapLayers: {},
    currentBasemap: 'osm',
    legendOpen: false,
    currentPanel: null
};

export function getMap() {
    return mapState.instance;
}

export const layerState = {
    active: new Set(),
    storage: {},
    names: {},
    wmsMapping: {}
};

export const vectorSources = {
    marker: new VectorSource(),
    navDistrict: new VectorSource(),
    navTehsil: new VectorSource(),
    navVillage: new VectorSource(),
    analysisBuffer: new VectorSource(),
    analysisProximity: new VectorSource()
};

export const VECTOR_SOURCES = vectorSources;

export const SIMPLE_STORAGE = {
    districts: null,
    tehsils: {},
    villagesByDistrict: {}
};

export const vectorLayers = {
    navDistrict: null,
    navTehsil: null,
    navVillage: null,
    analysisBuffer: null,
    analysisProximity: null
};

export const panelState = {
    currentPanel: null,
    layers: {
        activeTab: 'departments',
        activeLayers: [],
        searchTerm: ''
    },
    navigation: {
        selectedDistrict: '',
        selectedTehsil: '',
        selectedVillage: '',
        districtName: '',
        tehsilName: '',
        villageName: ''
    },
    measurement: {
        currentType: 'distance',
        currentUnits: 'km'
    },
    print: {
        format: 'A4',
        orientation: 'landscape',
        resolution: 150
    },
    analysis: {
        currentTool: 'buffer',
        bufferDistance: 1000,
        bufferUnits: 'm'
    }
};

export const selectedCoords = {
    lat: null,
    lon: null
};

// Extent handling helpers
export function createEmptyExtent() {
    return createEmpty();
}

export function extendExtent(targetExtent, extentToAdd) {
    try {
        olExtend(targetExtent, extentToAdd);
    } catch (err) {
        console.warn('Failed to extend extent', err);
    }
}

export function isEmptyExtent(extent) {
    try {
        return olIsEmpty(extent);
    } catch (err) {
        return true;
    }
}

// State save/restore functions
export function savePanelState() {
    try {
        const state = {
            currentPanel: mapState.currentPanel,
            legendOpen: mapState.legendOpen,
            panelStates: {
                layers: {
                    activeTab: panelState.layers.activeTab,
                    activeLayers: Array.from(layerState.active),
                    searchTerm: panelState.layers.searchTerm
                },
                navigation: { ...panelState.navigation },
                measurement: { ...panelState.measurement },
                print: { ...panelState.print },
                analysis: { ...panelState.analysis }
            }
        };
        
        sessionStorage.setItem('panelState', JSON.stringify(state));
    } catch (error) {
        console.warn('Could not save panel state:', error);
    }
}

function restorePanelState() {
    try {
        const saved = sessionStorage.getItem('panelState');
        if (saved) {
            const state = JSON.parse(saved);
            
            if (state.currentPanel) {
                mapState.currentPanel = state.currentPanel;
            }
            
            if (state.legendOpen !== undefined) {
                mapState.legendOpen = state.legendOpen;
            }
            
            if (state.panelStates) {
                if (state.panelStates.layers) {
                    panelState.layers = { ...panelState.layers, ...state.panelStates.layers };
                }
                if (state.panelStates.navigation) {
                    panelState.navigation = { ...panelState.navigation, ...state.panelStates.navigation };
                }
                if (state.panelStates.measurement) {
                    panelState.measurement = { ...panelState.measurement, ...state.panelStates.measurement };
                }
                if (state.panelStates.print) {
                    panelState.print = { ...panelState.print, ...state.panelStates.print };
                }
                if (state.panelStates.analysis) {
                    panelState.analysis = { ...panelState.analysis, ...state.panelStates.analysis };
                }
            }
        }
    } catch (error) {
        console.warn('Could not restore panel state:', error);
    }
}

export function saveActiveLayerState() {
    try {
        const activeLayersArray = Array.from(layerState.active);
        
        sessionStorage.setItem('activeMapLayers', JSON.stringify(activeLayersArray));
        localStorage.setItem('activeMapLayers', JSON.stringify(activeLayersArray));
        
        panelState.layers.activeLayers = activeLayersArray;
        savePanelState();
        
    } catch (error) {
        console.warn('Could not save active layer state:', error);
    }
}

export function saveNavigationState(district, tehsil, village, districtName, tehsilName, villageName) {
    panelState.navigation = {
        selectedDistrict: district || '',
        selectedTehsil: tehsil || '',
        selectedVillage: village || '',
        districtName: districtName || '',
        tehsilName: tehsilName || '',
        villageName: villageName || ''
    };
    savePanelState();
}

export function saveLayerTabState(activeTab) {
    panelState.layers.activeTab = activeTab;
    savePanelState();
}

export function saveMeasurementState(type, units) {
    panelState.measurement = {
        currentType: type || 'distance',
        currentUnits: units || 'km'
    };
    savePanelState();
}

export function savePrintState(format, orientation, resolution) {
    panelState.print = {
        format: format || 'A4',
        orientation: orientation || 'landscape',
        resolution: resolution || 150
    };
    savePanelState();
}

export function saveAnalysisState(tool, distance, units) {
    panelState.analysis = {
        currentTool: tool || 'buffer',
        bufferDistance: distance || 1000,
        bufferUnits: units || 'm'
    };
    savePanelState();
}

// ==================== MAP CONTROLS ====================
export function setupMapControls() {
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const resetViewBtn = document.getElementById('reset-view-btn');
    const myLocationBtn = document.getElementById('my-location-btn');

    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullScreen);
    if (resetViewBtn) resetViewBtn.addEventListener('click', resetView);
    if (myLocationBtn) myLocationBtn.addEventListener('click', findMyLocation);
}

export function toggleFullScreen() {
    try {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
                showNotification('Fullscreen not supported', 'error');
            });
        } else {
            document.exitFullscreen();
        }
    } catch (error) {
        console.error('Fullscreen toggle error:', error);
        showNotification('Fullscreen functionality not supported', 'error');
    }
}

export function resetView() {
    if (mapState.instance?.getView) {
        mapState.instance.getView().animate({
            center: fromLonLat([82.15, 21.25]),
            zoom: 7.1,
            duration: 1000
        });
    }
}

export function findMyLocation() {
    if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by this browser', 'error');
        return;
    }

    showNotification('Finding your location...', 'info');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            try {
                const coords = [position.coords.longitude, position.coords.latitude];

                if (mapState.instance?.getView) {
                    mapState.instance.getView().animate({
                        center: fromLonLat(coords),
                        zoom: 15,
                        duration: 1000
                    });

                    const userFeature = new Feature({
                        geometry: new Point(fromLonLat(coords)),
                        name: 'Your Location'
                    });

                    const userStyle = new Style({
                        image: new CircleStyle({
                            radius: 12,
                            fill: new Fill({ color: '#ef4444' }),
                            stroke: new Stroke({
                                color: '#ffffff',
                                width: 3
                            })
                        })
                    });

                    const existingUserLayer = mapState.instance.getLayers().getArray().find(layer =>
                        layer.get('name') === 'userLocation'
                    );
                    if (existingUserLayer) {
                        mapState.instance.removeLayer(existingUserLayer);
                    }

                    const userLayer = new VectorLayer({
                        name: 'userLocation',
                        source: new VectorSource({
                            features: [userFeature]
                        }),
                        style: userStyle
                    });

                    mapState.instance.addLayer(userLayer);
                    showNotification(`Location found: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`, 'success');
                }
            } catch (error) {
                console.error('Error processing location:', error);
                showNotification('Failed to process your location', 'error');
            }
        },
        (error) => {
            let errorMessage = 'Unable to get your location: ';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Permission denied';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Location unavailable';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'Request timed out';
                    break;
                default:
                    errorMessage += error.message;
                    break;
            }
            showNotification(errorMessage, 'error');
        }
    );
}

export function setupBaseMapControls() {
    const baseMapMainToggle = document.getElementById('basemap-main-toggle');
    if (baseMapMainToggle) {
        baseMapMainToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const changer = document.getElementById('basemap-changer');
            if (changer) {
                changer.classList.toggle('collapsed');
            }
        });
    }

    document.querySelectorAll('[data-basemap]').forEach(toggle => {
        toggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const basemapType = toggle.getAttribute('data-basemap');

            document.querySelectorAll('.basemap-toggle').forEach(t => t.classList.remove('active'));
            toggle.classList.add('active');

            const mainToggle = document.querySelector('.basemap-changer > .basemap-toggle');
            if (mainToggle) {
                const newThumbnail = toggle.querySelector('.basemap-thumbnail');
                const newLabel = toggle.querySelector('.basemap-label');

                if (newThumbnail && newLabel) {
                    const mainThumbnail = mainToggle.querySelector('.basemap-thumbnail');
                    const mainLabel = mainToggle.querySelector('.basemap-label');

                    if (mainThumbnail && mainLabel) {
                        mainThumbnail.className = newThumbnail.className;
                        mainLabel.textContent = newLabel.textContent;
                        mainToggle.classList.add('active');
                    }
                }
            }

            const changer = document.getElementById('basemap-changer');
            if (changer) changer.classList.add('collapsed');

            switchBasemap(basemapType);
        });
    });

    document.addEventListener('click', (event) => {
        const basemapChanger = document.getElementById('basemap-changer');
        const basemapMainToggle = document.getElementById('basemap-main-toggle');

        if (basemapChanger &&
            !basemapChanger.contains(event.target) &&
            !basemapMainToggle.contains(event.target)) {
            basemapChanger.classList.add('collapsed');
        }
    });
}

export function addLegendToggleButton() {
    const mapControls = document.querySelector('.map-controls');
    if (mapControls && !document.getElementById('legend-toggle')) {
        const legendToggleBtn = document.createElement('div');
        legendToggleBtn.id = 'legend-toggle';
        legendToggleBtn.className = 'map-control legend-toggle';
        legendToggleBtn.title = 'Toggle Legend';
        legendToggleBtn.innerHTML = `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
        `;
        legendToggleBtn.addEventListener('click', toggleLegend);
        mapControls.appendChild(legendToggleBtn);
    }
}

// ==================== MOBILE NAVIGATION ====================
const PANEL_TEMPLATE_MAP = {
    'layers': 'layers-panel-template',
    'measurement': 'measurement-panel-template',
    'navigation': 'navigation-panel-template',
    'print': 'print-panel-template',
    'analysis': 'analysis-panel-template',
    'building': 'building-panel-template'
};

const PANEL_TITLES = {
    'layers': 'Layers',
    'measurement': 'Measurement Tools',
    'navigation': 'Navigation',
    'print': 'Print Map',
    'analysis': 'Spatial Analysis',
    'building': 'Building Analysis'
};

const PANEL_ICONS = {
    'layers': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                </svg>`,
    'measurement': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 3L3 21"/>
                        <path d="M21 9L9 21"/>
                        <path d="M21 15L15 21"/>
                    </svg>`,
    'navigation': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                    </svg>`,
    'print': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
            </svg>`,
    'analysis': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>`,
    'building': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 21h18M3 7v14M21 7v14M9 7h6M9 11h6M9 15h6M9 19h6M5 3h14l2 4H3l2-4z"/>
                </svg>`
};

function initMobileNavigation() {
    const isMobile = () => window.innerWidth <= 768;
    
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavItems.forEach(item => {
        item.addEventListener('click', function() {
            const panelId = this.dataset.panel;
            
            if (isMobile()) {
                handleMobileNavClick(panelId, this);
            } else {
                openPanel(panelId);
            }
        });
    });
    
    window.addEventListener('resize', function() {
        if (!isMobile()) {
            closeMobileDialog();
        }
    });
}

function handleMobileNavClick(panelId, navItem) {
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    navItem.classList.add('active');
    openMobileDialog(panelId);
}

function openMobileDialog(panelId) {
    closeMobileDialog();
    
    const templateId = PANEL_TEMPLATE_MAP[panelId];
    if (!templateId) {
        console.warn(`No template mapping found for panel: ${panelId}`);
        return;
    }
    
    const panelTemplate = document.getElementById(templateId);
    if (!panelTemplate) {
        console.warn(`Panel template #${templateId} not found`);
        return;
    }
    
    const dialog = document.createElement('div');
    dialog.className = 'mobile-dialog';
    dialog.id = 'mobile-dialog-active';
    
    const dialogContent = document.createElement('div');
    dialogContent.className = 'mobile-dialog-content';
    
    const dialogHeader = document.createElement('div');
    dialogHeader.className = 'mobile-dialog-header';
    
    const dialogTitle = document.createElement('div');
    dialogTitle.className = 'mobile-dialog-title';
    
    const dialogIcon = document.createElement('div');
    dialogIcon.className = 'mobile-dialog-icon';
    dialogIcon.innerHTML = PANEL_ICONS[panelId] || '';
    
    const titleText = document.createElement('h3');
    titleText.textContent = PANEL_TITLES[panelId] || 'Panel';
    
    dialogTitle.appendChild(dialogIcon);
    dialogTitle.appendChild(titleText);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'mobile-dialog-close';
    closeBtn.innerHTML = `
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
    `;
    closeBtn.addEventListener('click', closeMobileDialog);
    
    dialogHeader.appendChild(dialogTitle);
    dialogHeader.appendChild(closeBtn);
    
    const dialogBody = document.createElement('div');
    dialogBody.className = 'mobile-dialog-body';
    
    const templateContent = panelTemplate.content.cloneNode(true);
    dialogBody.appendChild(templateContent);
    
    dialogContent.appendChild(dialogHeader);
    dialogContent.appendChild(dialogBody);
    dialog.appendChild(dialogContent);
    
    document.body.appendChild(dialog);
    
    if (panelId === 'layers') {
        const allLayersList = dialog.querySelector('#all-layers-list');
        if (allLayersList) {
            allLayersList.innerHTML = generateAllLayersList();
        }
    }
    
    setTimeout(() => {
        dialog.classList.add('show');
    }, 10);
    
    dialog.addEventListener('click', function(e) {
        if (e.target === dialog) {
            closeMobileDialog();
        }
    });
    
    setupPanelEventListeners(panelId);
}

function closeMobileDialog() {
    const dialog = document.getElementById('mobile-dialog-active');
    if (dialog) {
        dialog.classList.remove('show');
        setTimeout(() => {
            dialog.remove();
        }, 300);
    }
    
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.remove('active');
    });
}

// ==================== PANEL MANAGEMENT ====================
export function openPanel(panelType) {
    const panel = document.getElementById('slide-panel');
    const panelTitle = document.getElementById('panel-title');
    const panelContentEl = document.getElementById('panel-content');
    const panelIcon = document.getElementById('panel-icon');

    const icons = {
        'layers': `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>`,
        'measurement': `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>`,
        'navigation': `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
        </svg>`,
        'print': `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
        </svg>`,
        'analysis': `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>`
    };

    const titles = {
        'layers': 'Layers',
        'measurement': 'Measurement Tools',
        'navigation': 'Navigation',
        'print': 'Print Map',
        'analysis': 'Spatial Analysis',
        'building': 'Building Analysis'
    };

    panelTitle.textContent = titles[panelType] || 'Panel';

    if (panelIcon && icons[panelType]) {
        panelIcon.innerHTML = icons[panelType];
    }

    const content = getPanelContent(panelType);
    panelContentEl.innerHTML = content;

    panel.classList.add('open');
    updateMapContainerClasses();
    mapState.currentPanel = panelType;

    document.querySelectorAll('.tool-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-panel') === panelType) {
            item.classList.add('active');
        }
    });

    savePanelState();

    setTimeout(() => {
        setupPanelEventListeners(panelType);
    }, 100);
}

export function closePanel() {
    if (mapState.currentPanel) {
        savePanelState();
    }
    
    const panel = document.getElementById('slide-panel');
    panel.classList.remove('open');
    updateMapContainerClasses();

    document.querySelectorAll('.tool-item').forEach(item => {
        item.classList.remove('active');
    });

    mapState.currentPanel = null;
    savePanelState();
}

function getPanelContent(panelType) {
    const template = document.getElementById(`${panelType}-panel-template`);
    
    if (template) {
        const content = template.content.cloneNode(true);
        const tempContainer = document.createElement('div');
        tempContainer.appendChild(content);
        
        if (panelType === 'layers') {
            const allLayersList = tempContainer.querySelector('#all-layers-list');
            if (allLayersList) {
                allLayersList.innerHTML = generateAllLayersList();
            }
        }
        
        return tempContainer.innerHTML;
    }
    
    return '<p>Content for this tool is coming soon...</p>';
}


const generateAllLayersList = () => {
    const categories = [
        {
            title: 'Administrative Boundaries',
            layers: [
                { id: 'cg_dist', name: 'District Boundaries' },
                { id: 'cg_division', name: 'Division Boundaries' },
                { id: 'cg_tehsil', name: 'Tehsil Boundaries' },
                { id: 'cg_grampanchayat', name: 'Gram Panchayat' },
                { id: 'cg_village', name: 'Village Boundaries' },
                { id: 'cg_assembly_bound', name: 'Assembly Boundaries' },
                { id: 'cg_ls_bound', name: 'Legislative Constituency' },
                { id: 'cg_municipal_bound', name: 'Municipal Boundaries' }
            ]
        },
        {
            title: 'NRDA Development',
            layers: [
                { id: 'nrda_villages', name: 'NRDA Villages' },
                { id: 'nrda_sector_boundary', name: 'NRDA Sector Boundary' },
                { id: 'nrda_sector21_cbd', name: 'NRDA CBD Sector 21' },
                { id: 'nrda_planning_boundary', name: 'NRDA Planning Boundary' },
                { id: 'nrda_landuse', name: 'NRDA Land Use' },
                { id: 'nrda_cluster', name: 'NRDA Cluster Boundary' },
                { id: 'nrda_sector22', name: 'NRDA Industrial Sector 22' },
                { id: 'nrda_sector5', name: 'NRDA Industrial Sector 5' },
                { id: 'nrda_road', name: 'NRDA Roads' }
            ]
        },
        {
            title: 'PDS & Supply Chain',
            layers: [
                { id: 'pds_locations', name: 'PDS Locations' },
                { id: 'cg_mandi', name: 'Mandis' },
                { id: 'swc_godown', name: 'SWC Godowns' },
                { id: 'private_godowns', name: 'Private Godowns' },
                { id: 'weigh_bridge', name: 'Weigh Bridges' }
            ]
        },
        {
            title: 'Anganwadi & Child Development',
            layers: [
                { id: 'cg_aanganwadi_center', name: 'Anganwadi Centers' }
            ]
        },
        {
            title: 'Education & Training',
            layers: [
                { id: 'cg_school', name: 'Schools' },
                { id: 'cg_primary_school', name: 'Primary Schools' },
                { id: 'iti_institution', name: 'ITI Institutions' },
                { id: 'engineering_college', name: 'Engineering Colleges' },
                { id: 'cg_university_location', name: 'Universities' },
                { id: 'cgpharmacyinstitute', name: 'Pharmacy Institutes' },
                { id: 'polytechnic_college', name: 'Polytechnic Colleges' }
            ]
        },
        {
            title: 'Health & Social Services',
            layers: [
                { id: 'district_hospitals', name: 'District Hospitals' },
                { id: 'medical_colleges', name: 'Medical Colleges' },
                { id: 'cg_aadhar_center', name: 'Aadhar Centers' },
                { id: 'sakhi_one_stop', name: 'Sakhi One Stop Centers' }
            ]
        },
        {
            title: 'Infrastructure & Utilities',
            layers: [
                { id: 'cg_airport', name: 'Airports' },
                { id: 'cg_habitation', name: 'Habitations' },
                { id: 'cg_headquarter', name: 'Headquarters' },
                { id: 'government_buildings', name: 'Government Buildings' },
                { id: 'electric_poles', name: 'Electric Poles' },
                { id: 'ehv_line', name: 'EHV Lines' },
                { id: 'ehv_point', name: 'EHV Points' },
                { id: 'cg_street_light', name: 'Street Lights' },
                { id: 'traffic_light', name: 'Traffic Lights' }
            ]
        },
        {
            title: 'Transportation Network',
            layers: [
                { id: 'cg_nhhighway', name: 'National Highways' },
                { id: 'cg_statehighway', name: 'State Highways' },
                { id: 'cg_mdr_roads', name: 'MDR Roads' },
                { id: 'cg_pmgsy_roads', name: 'PMGSY Roads' },
                { id: 'cg_major_road', name: 'Major City Roads' },
                { id: 'cg_rail_line', name: 'Railway Lines' }
            ]
        },
        {
            title: 'Water Resources',
            layers: [
                { id: 'cg_river', name: 'Rivers' },
                { id: 'cg_reservoir', name: 'Reservoirs' },
                { id: 'cg_canal', name: 'Canals' },
                { id: 'cg_drainage', name: 'Drainage' },
                { id: 'dug_well', name: 'Dug/Open Wells' },
                { id: 'watershed', name: 'Watersheds' },
                { id: 'wrd_reservoir', name: 'WRD Reservoirs' }
            ]
        },
        {
            title: 'Agriculture & Soil',
            layers: [
                { id: 'cg_agricrop', name: 'Agricultural Crops' },
                { id: 'cg_soil_irri', name: 'Soil Irrigation' },
                { id: 'cg_soil_texture', name: 'Soil Texture' },
                { id: 'cg_hydrosoil', name: 'Hydro Soil' }
            ]
        },
        {
            title: 'Geology & Environment',
            layers: [
                { id: 'cg_geomorphology', name: 'Geomorphology' },
                { id: 'cg_groundwater', name: 'Groundwater' },
                { id: 'cg_lithology', name: 'Lithology' },
                { id: 'cg_mineral', name: 'Minerals' }
            ]
        },
        {
            title: 'Forest & Natural Resources',
            layers: [
                { id: 'cg_forest_beat', name: 'Forest Beats' },
                { id: 'forest_checkpost', name: 'Forest Checkposts' },
                { id: 'forest_wood_depot', name: 'Wood Depots' },
                { id: 'saw_mill', name: 'Saw Mills' },
                { id: 'sand_mine', name: 'Sand Mines' }
            ]
        },
        {
            title: 'Minor Forest Produce',
            layers: [
                { id: 'minor_forest_produce', name: 'Minor Forest Produce' },
                { id: 'cg_mfp_cold_storage', name: 'Cold Storage Units' },
                { id: 'cg_mfp_godown', name: 'Warehouses' },
                { id: 'cg_mfp_tendupatta', name: 'Tendupatta' },
                { id: 'cg_mfp_tamarind', name: 'Tamarind' },
                { id: 'cg_mfp_saal_seed', name: 'Saal Seed' },
                { id: 'cg_mfp_rangeeni_lac', name: 'Rangeeni Lac' },
                { id: 'cg_mfp_kusumi_lac', name: 'Kusumi Lac' }
            ]
        },
        {
            title: 'Safety & Security',
            layers: [
                { id: 'cg_policest', name: 'Police Stations' },
                { id: 'rto_checkpost', name: 'RTO Checkposts' }
            ]
        },
        {
            title: 'Tourism & Recreation',
            layers: [
                { id: 'cg_tourism', name: 'Tourism Locations' },
                { id: 'CG_monument', name: 'Monuments' },
                { id: 'sports_infrastructure', name: 'Sports Infrastructure' }
            ]
        },
        {
            title: 'Banking & Finance',
            layers: [
                { id: 'CG_Bank_Branches', name: 'CG Bank Branches' },
                { id: 'ippb_centers', name: 'IPPB Centers' },
                { id: 'cg_atm', name: 'ATM' }
            ]
        },
        {
            title: 'Other Services',
            layers: [
                { id: 'cg_cssda', name: 'CSSDA' },
                { id: 'liquor_shop', name: 'Liquor Shops' }
            ]
        }
    ];

    let html = '';
    categories.forEach(category => {
        html += `
            <div class="feature-group">
                <h4 class="layer-group-header collapsed">
                    ${category.title}
                    <svg class="dropdown-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </h4>
                <div class="feature-items collapsed">
                    ${category.layers.map(layer => `
                        <div class="feature-item">
                            <div class="feature-info"><h5>${layer.name}</h5></div>
                            <div class="toggle-switch" data-layer="${layer.id}"><span class="toggle-knob"></span></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    return html;
};

// ==================== EVENT LISTENERS ====================
export function initializeEventListeners() {
    document.querySelectorAll('.tool-item').forEach(item => {
        item.addEventListener('click', function () {
            const panelType = this.getAttribute('data-panel');
            if (panelType) {
                openPanel(panelType);
            }
        });
    });

    const closePanelBtn = document.getElementById('close-panel-btn');
    if (closePanelBtn) {
        closePanelBtn.addEventListener('click', closePanel);
    }

    const legendCloseBtn = document.getElementById('legend-close-btn');
    if (legendCloseBtn) {
        legendCloseBtn.addEventListener('click', toggleLegend);
    }

    document.addEventListener('keydown', function (e) {        
        if (e.key === 'Escape') {
            const mobileDialog = document.getElementById('mobile-dialog-active');
            if (mobileDialog) {
                closeMobileDialog();
                return;
            }
            
            if (mapState.currentPanel) {
                closePanel();
            }
            if (mapState.legendOpen) {
                toggleLegend();
            }
        }
    });

    let resizeTimeout;
    addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (mapState.instance?.updateSize) {
                mapState.instance.updateSize();
            }
        }, 200);
    });

    window.addEventListener('legendToggled', () => {
        updateMapContainerClasses();
    });
    
    initMobileNavigation();
}

function setupPanelEventListeners(panelType) {
    if (panelType === 'layers') {
        setupLayerEventListeners();
        restoreActiveLayerState();
    } else if (panelType === 'measurement') {
        setupMeasurementListeners();
    } else if (panelType === 'navigation') {
        setupNavigationListeners();
    } else if (panelType === 'print') {
        setupPrintListeners();
    } else if (panelType === 'analysis') {
        setupAnalysisListeners();
    } else if (panelType === 'building') {  
        setupBuildingListeners();
    }
}

function setupLayerEventListeners() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    const savedActiveTab = panelState.layers.activeTab || 'departments';
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    const activeTabBtn = document.querySelector(`.tab-button[data-tab="${savedActiveTab}"]`);
    const activeTabContent = document.getElementById(savedActiveTab + '-tab');
    
    if (activeTabBtn) activeTabBtn.classList.add('active');
    if (activeTabContent) activeTabContent.classList.add('active');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            const targetContent = document.getElementById(targetTab + '-tab');
            if (targetContent) {
                targetContent.classList.add('active');
                
                saveLayerTabState(targetTab);
                
                if (targetTab === 'all-layers') {
                    const allLayersList = document.getElementById('all-layers-list');
                    if (allLayersList && (!allLayersList.innerHTML || allLayersList.innerHTML.trim() === '')) {
                        allLayersList.innerHTML = generateAllLayersList();
                        
                        allLayersList.querySelectorAll('.toggle-switch[data-layer]').forEach(toggle => {
                            toggle.addEventListener('click', (event) => {
                                event.preventDefault();
                                event.stopPropagation();

                                const layerId = toggle.getAttribute('data-layer');
                                if (layerId && layerState.storage[layerId]) {
                                    toggleLayer(layerId, toggle);

                                    const allSimilarToggles = document.querySelectorAll(`[data-layer="${layerId}"]`);
                                    allSimilarToggles.forEach(otherToggle => {
                                        if (otherToggle !== toggle) {
                                            if (toggle.classList.contains('active')) {
                                                otherToggle.classList.add('active');
                                            } else {
                                                otherToggle.classList.remove('active');
                                            }
                                        }
                                    });
                                }
                            });
                        });
                    }
                }
            }
        });
    });

    const searchInput = document.getElementById('layer-search');
    if (searchInput) {
        if (panelState.layers.searchTerm) {
            searchInput.value = panelState.layers.searchTerm;
            searchInput.dispatchEvent(new Event('input'));
        }
        
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            panelState.layers.searchTerm = searchTerm;
            savePanelState();
            
            const layerItems = document.querySelectorAll('#all-layers-list .layer-item-simple');
            const categoryHeaders = document.querySelectorAll('#all-layers-list .layer-category-header');

            layerItems.forEach(item => {
                const layerName = item.querySelector('.layer-name').textContent.toLowerCase();
                const matches = layerName.includes(searchTerm);
                item.style.display = matches ? 'flex' : 'none';
            });

            categoryHeaders.forEach(header => {
                let nextElement = header.nextElementSibling;
                let hasVisibleItems = false;

                while (nextElement && !nextElement.classList.contains('layer-category-header')) {
                    if (nextElement.classList.contains('layer-item-simple') &&
                        nextElement.style.display !== 'none') {
                        hasVisibleItems = true;
                        break;
                    }
                    nextElement = nextElement.nextElementSibling;
                }

                header.style.display = hasVisibleItems ? 'block' : 'none';
            });
        });
    }

    document.querySelectorAll('.toggle-switch[data-layer]').forEach(toggle => {
        toggle.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const layerId = toggle.getAttribute('data-layer');
            if (layerId && layerState.storage[layerId]) {
                toggleLayer(layerId, toggle);

                const allSimilarToggles = document.querySelectorAll(`[data-layer="${layerId}"]`);
                allSimilarToggles.forEach(otherToggle => {
                    if (otherToggle !== toggle) {
                        if (toggle.classList.contains('active')) {
                            otherToggle.classList.add('active');
                        } else {
                            otherToggle.classList.remove('active');
                        }
                    }
                });
            }
        });
    });

    const layerGroupHeaders = document.querySelectorAll('.layer-group-header');
    layerGroupHeaders.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            const itemsContainer = header.nextElementSibling;
            if (itemsContainer?.classList.contains('feature-items')) {
                const isCollapsed = itemsContainer.classList.contains('collapsed');

                if (isCollapsed) {
                    itemsContainer.classList.remove('collapsed');
                    header.classList.remove('collapsed');
                    itemsContainer.style.maxHeight = itemsContainer.scrollHeight + "px";
                } else {
                    itemsContainer.style.maxHeight = "0px";
                    itemsContainer.classList.add('collapsed');
                    header.classList.add('collapsed');
                }
            }
        });
    });
}

function setupMeasurementListeners() {
    let currentType = panelState.measurement.currentType || 'distance';
    let currentUnits = panelState.measurement.currentUnits || 'km';
    let isMeasuring = false;

    const distanceBtn = document.getElementById('measure-distance-btn');
    const areaBtn = document.getElementById('measure-area-btn');
    
    if (currentType === 'distance' && distanceBtn) {
        distanceBtn.classList.add('active');
    } else if (currentType === 'area' && areaBtn) {
        areaBtn.classList.add('active');
    }
    
    if (distanceBtn) {
        distanceBtn.addEventListener('click', () => {
            currentType = 'distance';
            distanceBtn.classList.add('active');
            areaBtn?.classList.remove('active');
            saveMeasurementState(currentType, currentUnits);
        });
    }
    
    if (areaBtn) {
        areaBtn.addEventListener('click', () => {
            currentType = 'area';
            areaBtn.classList.add('active');
            distanceBtn?.classList.remove('active');
            saveMeasurementState(currentType, currentUnits);
        });
    }

    const unitsSelect = document.getElementById('measurement-units');
    if (unitsSelect) {
        unitsSelect.value = currentUnits;
        unitsSelect.addEventListener('change', (e) => {
            currentUnits = e.target.value;
            saveMeasurementState(currentType, currentUnits);
        });
    }

    const startBtn = document.getElementById('start-measurement-btn');
    const stopBtn = document.getElementById('stop-measurement-btn');
    
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            try {
                startMeasurement(currentType, currentUnits);
                isMeasuring = true;
                startBtn.disabled = true;
                if (stopBtn) stopBtn.disabled = false;
                showNotification(`Started ${currentType} measurement`, 'info');
            } catch (error) {
                console.error('Error starting measurement:', error);
                showNotification('Failed to start measurement', 'error');
            }
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            try {
                stopMeasurement();
                isMeasuring = false;
                stopBtn.disabled = true;
                if (startBtn) startBtn.disabled = false;
                showNotification('Measurement stopped', 'info');
            } catch (error) {
                console.error('Error stopping measurement:', error);
                showNotification('Failed to stop measurement', 'error');
            }
        });
    }

    const clearBtn = document.getElementById('clear-measurements-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            try {
                clearAllMeasurements();
                if (stopBtn) stopBtn.disabled = true;
                if (startBtn) startBtn.disabled = false;
                isMeasuring = false;
            } catch (error) {
                console.error('Error clearing measurements:', error);
                showNotification('Failed to clear measurements', 'error');
            }
        });
    }

    const exportBtn = document.getElementById('export-measurements-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            try {
                exportMeasurements();
            } catch (error) {
                console.error('Error exporting measurements:', error);
                showNotification('Failed to export measurements', 'error');
            }
        });
    }
}

function setupNavigationListeners() {
    loadDistricts().then(() => {
        populateDistrictDropdown('nav-district');
        
        setTimeout(() => {
            const districtSelect = document.getElementById('nav-district');
            const tehsilSelect = document.getElementById('nav-tehsil');
            const villageSelect = document.getElementById('nav-village');
            
            if (panelState.navigation.selectedDistrict && districtSelect) {
                districtSelect.value = panelState.navigation.selectedDistrict;
                
                if (districtSelect.value) {
                    districtSelect.dispatchEvent(new Event('change'));
                    
                    setTimeout(() => {
                        if (panelState.navigation.selectedTehsil && tehsilSelect) {
                            tehsilSelect.value = panelState.navigation.selectedTehsil;
                            
                            if (tehsilSelect.value) {
                                tehsilSelect.dispatchEvent(new Event('change'));
                                
                                setTimeout(() => {
                                    if (panelState.navigation.selectedVillage && villageSelect) {
                                        villageSelect.value = panelState.navigation.selectedVillage;
                                    }
                                }, 500);
                            }
                        }
                    }, 500);
                }
            }
        }, 300);
    }).catch(error => {
        console.error('Error loading districts:', error);
        showNotification('Failed to load districts', 'error');
    });

    const districtSelect = document.getElementById('nav-district');
    const tehsilSelect = document.getElementById('nav-tehsil');
    const villageSelect = document.getElementById('nav-village');
    const clearBtn = document.getElementById('clear-navigation-btn');
    const navInfo = document.getElementById('nav-info');
    const navDetails = document.getElementById('nav-details');

    if (districtSelect) {
        districtSelect.addEventListener('change', async (e) => {
            const districtCode = e.target.value;
            const districtName = e.target.options[e.target.selectedIndex]?.text || '';
            
            if (districtCode) {
                try {
                    navigateToDistrict(districtCode);
                    
                    tehsilSelect.disabled = true;
                    tehsilSelect.innerHTML = '<option value="">Loading tehsils...</option>';
                    
                    const tehsilData = await loadTehsils(districtCode);
                    populateTehsilDropdown('nav-tehsil', tehsilData);
                    tehsilSelect.disabled = false;
                    
                    villageSelect.innerHTML = '<option value="">Select tehsil first</option>';
                    villageSelect.disabled = true;
                    
                    if (navInfo) navInfo.style.display = 'block';
                    if (navDetails) {
                        navDetails.innerHTML = `<strong>District:</strong> ${districtName}`;
                    }
                    
                    saveNavigationState(districtCode, '', '', districtName, '', '');
                } catch (error) {
                    console.error('Error loading tehsils:', error);
                    showNotification('Failed to load tehsils', 'error');
                }
            } else {
                tehsilSelect.disabled = true;
                tehsilSelect.innerHTML = '<option value="">Select district first</option>';
                villageSelect.disabled = true;
                villageSelect.innerHTML = '<option value="">Select tehsil first</option>';
                if (navInfo) navInfo.style.display = 'none';
                
                saveNavigationState('', '', '', '', '', '');
            }
        });
    }

    if (tehsilSelect) {
        tehsilSelect.addEventListener('change', async (e) => {
            const tehsilCode = e.target.value;
            const tehsilName = e.target.options[e.target.selectedIndex]?.text || '';
            const districtCode = districtSelect.value;
            const districtName = districtSelect.options[districtSelect.selectedIndex]?.text || '';
            
            if (tehsilCode) {
                try {
                    const tehsilData = SIMPLE_STORAGE.tehsils[districtCode];
                    navigateToTehsil(tehsilData, tehsilCode);
                    
                    villageSelect.disabled = true;
                    villageSelect.innerHTML = '<option value="">Loading villages...</option>';
                    
                    const villageData = await loadVillages(tehsilCode);
                    populateVillageDropdown('nav-village', villageData);
                    villageSelect.disabled = false;
                    
                    if (navDetails) {
                        navDetails.innerHTML = `
                            <strong>District:</strong> ${districtName}<br>
                            <strong>Tehsil:</strong> ${tehsilName}
                        `;
                    }
                    
                    saveNavigationState(districtCode, tehsilCode, '', districtName, tehsilName, '');
                } catch (error) {
                    console.error('Error loading villages:', error);
                    showNotification('Failed to load villages', 'error');
                }
            } else {
                villageSelect.disabled = true;
                villageSelect.innerHTML = '<option value="">Select tehsil first</option>';
                
                saveNavigationState(districtCode, '', '', districtName, '', '');
            }
        });
    }

    if (villageSelect) {
        villageSelect.addEventListener('change', (e) => {
            const villageCode = e.target.value;
            const villageName = e.target.options[e.target.selectedIndex]?.text || '';
            const tehsilCode = tehsilSelect.value;
            const tehsilName = tehsilSelect.options[tehsilSelect.selectedIndex]?.text || '';
            const districtCode = districtSelect.value;
            const districtName = districtSelect.options[districtSelect.selectedIndex]?.text || '';
            
            if (villageCode) {
                const villageData = SIMPLE_STORAGE.villagesByDistrict[tehsilCode];
                navigateToVillage(villageData, villageCode);
                
                if (navDetails) {
                    navDetails.innerHTML = `
                        <strong>District:</strong> ${districtName}<br>
                        <strong>Tehsil:</strong> ${tehsilName}<br>
                        <strong>Village:</strong> ${villageName}
                    `;
                }
                
                saveNavigationState(districtCode, tehsilCode, villageCode, districtName, tehsilName, villageName);
            } else {
                saveNavigationState(districtCode, tehsilCode, '', districtName, tehsilName, '');
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearAllSelections();
            districtSelect.value = '';
            tehsilSelect.value = '';
            tehsilSelect.disabled = true;
            villageSelect.value = '';
            villageSelect.disabled = true;
            if (navInfo) navInfo.style.display = 'none';
            
            saveNavigationState('', '', '', '', '', '');
            showNotification('Navigation cleared', 'info');
        });
    }
}

function setupPrintListeners() {
    initializePrintModule();
    
    const formatSelect = document.getElementById('print-format');
    const resolutionSelect = document.getElementById('print-resolution');
    const titleInput = document.getElementById('print-title');
    const landscapeBtn = document.getElementById('orientation-landscape');
    const portraitBtn = document.getElementById('orientation-portrait');
    
    if (formatSelect) {
        formatSelect.value = panelState.print.format || 'A4';
    }
    
    if (resolutionSelect) {
        resolutionSelect.value = panelState.print.resolution || 150;
    }
    
    if (panelState.print.orientation === 'landscape' && landscapeBtn) {
        landscapeBtn.classList.add('active');
        portraitBtn?.classList.remove('active');
    } else if (panelState.print.orientation === 'portrait' && portraitBtn) {
        portraitBtn.classList.add('active');
        landscapeBtn?.classList.remove('active');
    }
    
    if (formatSelect) {
        formatSelect.addEventListener('change', (e) => {
            updatePrintSettings({ format: e.target.value });
            savePrintState(e.target.value, panelState.print.orientation, panelState.print.resolution);
        });
    }

    if (landscapeBtn) {
        landscapeBtn.addEventListener('click', () => {
            landscapeBtn.classList.add('active');
            portraitBtn?.classList.remove('active');
            updatePrintSettings({ orientation: 'landscape' });
            savePrintState(panelState.print.format, 'landscape', panelState.print.resolution);
        });
    }
    
    if (portraitBtn) {
        portraitBtn.addEventListener('click', () => {
            portraitBtn.classList.add('active');
            landscapeBtn?.classList.remove('active');
            updatePrintSettings({ orientation: 'portrait' });
            savePrintState(panelState.print.format, 'portrait', panelState.print.resolution);
        });
    }

    if (resolutionSelect) {
        resolutionSelect.addEventListener('change', (e) => {
            updatePrintSettings({ resolution: parseInt(e.target.value) });
            savePrintState(panelState.print.format, panelState.print.orientation, parseInt(e.target.value));
        });
    }

    if (titleInput) {
        titleInput.addEventListener('input', (e) => {
            updatePrintSettings({ title: e.target.value });
        });
    }

    const includeTitleCheck = document.getElementById('include-title');
    const includeScaleCheck = document.getElementById('include-scale');
    const includeDateCheck = document.getElementById('include-date');
    const includeCoordinatesCheck = document.getElementById('include-coordinates');

    if (includeTitleCheck) {
        includeTitleCheck.addEventListener('change', (e) => {
            updatePrintSettings({ includeTitle: e.target.checked });
        });
    }

    if (includeScaleCheck) {
        includeScaleCheck.addEventListener('change', (e) => {
            updatePrintSettings({ includeScale: e.target.checked });
        });
    }

    if (includeDateCheck) {
        includeDateCheck.addEventListener('change', (e) => {
            updatePrintSettings({ includeDate: e.target.checked });
        });
    }

    if (includeCoordinatesCheck) {
        includeCoordinatesCheck.addEventListener('change', (e) => {
            updatePrintSettings({ includeCoordinates: e.target.checked });
        });
    }

    const exportBtn = document.getElementById('export-map-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            try {
                await generatePrintMap();
            } catch (error) {
                console.error('Error exporting map:', error);
                showNotification('Failed to export map', 'error');
            }
        });
    }

    const exportJpegBtn = document.getElementById('export-jpeg-btn');
    if (exportJpegBtn) {
        exportJpegBtn.addEventListener('click', async () => {
            try {
                await exportAsJPEG();
            } catch (error) {
                console.error('Error exporting JPEG:', error);
                showNotification('Failed to export JPEG', 'error');
            }
        });
    }

    const resetBtn = document.getElementById('reset-print-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetPrintSettings();
            
            if (formatSelect) formatSelect.value = 'A4';
            if (resolutionSelect) resolutionSelect.value = '150';
            if (titleInput) titleInput.value = 'DMP Geo-Portal Map';
            if (includeTitleCheck) includeTitleCheck.checked = true;
            if (includeScaleCheck) includeScaleCheck.checked = true;
            if (includeDateCheck) includeDateCheck.checked = true;
            if (includeCoordinatesCheck) includeCoordinatesCheck.checked = true;
            
            landscapeBtn?.classList.add('active');
            portraitBtn?.classList.remove('active');
            
            savePrintState('A4', 'landscape', 150);
            
            showNotification('Print settings reset', 'info');
        });
    }

    setTimeout(() => {
        updatePrintPreview();
    }, 100);
}


// Complete setupBuildingListeners function for main.js
function setupBuildingListeners() {
    // Populate district dropdown first, then department
    loadDistricts().then(() => {
        populateDistrictDropdown('building-district');
    }).catch(() => {
        const el = document.getElementById('building-district');
        if (el) el.innerHTML = '<option value="">-- All Districts --</option>';
    });
    populateDepartmentDropdown('building-department');

    // Initialize building layers
    createBuildingWMSLayer();
    createBuildingVectorLayer();

    const districtSelect   = document.getElementById('building-district');
    const departmentSelect = document.getElementById('building-department');
    const searchTermSelect = document.getElementById('building-search-term');
    const searchBtn        = document.getElementById('search-buildings-btn');
    const clearBtn         = document.getElementById('clear-building-results-btn');
    const wmsLayerCheckbox = document.getElementById('show-wms-layer');
    const totalBuildingsEl = document.getElementById('total-buildings');
    const selectedDeptNameEl = document.getElementById('selected-dept-name');

    // Handle search term dropdown change
    if (searchTermSelect) {
        searchTermSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption) {
                const actualValue = selectedOption.getAttribute('data-actual-value') || this.value;
                this.dataset.actualValue = actualValue;
            }
        });

        // Set initial actual value
        const initialOption = searchTermSelect.options[searchTermSelect.selectedIndex];
        if (initialOption) {
            const actualValue = initialOption.getAttribute('data-actual-value') || searchTermSelect.value;
            searchTermSelect.dataset.actualValue = actualValue;
        }
    }

    // Department selection
    if (departmentSelect) {
        departmentSelect.addEventListener('change', (e) => {
            const selectedText = e.target.options[e.target.selectedIndex]?.text || 'None';
            if (selectedDeptNameEl) {
                selectedDeptNameEl.textContent = e.target.value ? selectedText : 'None';
            }
        });
    }

    // Search button
    if (searchBtn) {
        searchBtn.addEventListener('click', async () => {
            const districtCode = districtSelect?.value || '';
            const districtName = districtCode
                ? (districtSelect.options[districtSelect.selectedIndex]?.text?.trim() || '')
                : '';
            const departmentId = departmentSelect?.value || '';
            const searchTerm = searchTermSelect?.dataset.actualValue || '';

            if (!districtCode && !departmentId && !searchTerm) {
                showNotification('Please select a district, department or search term', 'warning');
                return;
            }

            const progressContainer = document.getElementById('search-progress-container');
            const progressBar = document.getElementById('search-progress-bar');
            const progressLabel = document.getElementById('search-progress-label');
            const progressPercent = document.getElementById('search-progress-percent');

            const showProgress = (pct, label) => {
                if (progressContainer) progressContainer.style.display = 'block';
                if (progressBar) progressBar.style.width = pct + '%';
                if (progressLabel) progressLabel.textContent = label;
                if (progressPercent) progressPercent.textContent = pct + '%';
            };

            const hideProgress = () => {
                setTimeout(() => {
                    if (progressContainer) progressContainer.style.display = 'none';
                    if (progressBar) progressBar.style.width = '0%';
                }, 1500);
            };

            try {
                searchBtn.disabled = true;
                searchBtn.innerHTML = `
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Searching...
                `;

                showProgress(0, 'Starting search...');

                const data = await searchBuildings(departmentId, searchTerm, showProgress, districtCode, districtName);

                if (totalBuildingsEl) {
                    totalBuildingsEl.textContent = data?.features?.length || 0;
                }

                hideProgress();
            } catch (error) {
                console.error('Search error:', error);
                showNotification('Search failed. Please try again.', 'error');
                hideProgress();
            } finally {
                searchBtn.disabled = false;
                searchBtn.innerHTML = `
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:18px; height:18px; margin-right:5px;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    Search Buildings
                `;
            }
        });
    }

    // Clear button
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearBuildingResults();

            if (districtSelect) districtSelect.value = '';
            if (departmentSelect) departmentSelect.value = '';
            if (searchTermSelect) {
                searchTermSelect.value = 'mahatari';
                searchTermSelect.dataset.actualValue = 'महतारी';
            }
            if (totalBuildingsEl) totalBuildingsEl.textContent = '0';
            if (selectedDeptNameEl) selectedDeptNameEl.textContent = 'None';
        });
    }

    const exportReportBtn = document.getElementById('export-buildings-btn');
    // Export Report button - opens modal with preview
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', () => {
            if (!buildingState.filteredBuildings || buildingState.filteredBuildings.length === 0) {
                showNotification('No data to export. Please search for buildings first.', 'warning');
                return;
            }

            // Update filter information
            const filterDeptName = document.getElementById('filter-dept-name');
            const filterSearchTerm = document.getElementById('filter-search-term');
            const filterBuildingCount = document.getElementById('filter-building-count');
            const reportDate = document.getElementById('report-date');

            if (reportDate) {
                reportDate.textContent = new Date().toLocaleString('en-IN', { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                });
            }

            if (filterDeptName && departmentSelect) {
                const selectedText = departmentSelect.options[departmentSelect.selectedIndex]?.text || 'All Departments';
                filterDeptName.textContent = departmentSelect.value ? selectedText : 'All Departments';
            }

            if (filterSearchTerm && searchTermSelect) {
                // Show actual value (Hindi) in export modal
                const actualValue = searchTermSelect.dataset.actualValue || '';
                const displayValue = searchTermSelect.options[searchTermSelect.selectedIndex]?.text || 'None';
                
                // Show both English and Hindi
                filterSearchTerm.innerHTML = actualValue 
                    ? `${displayValue} <span style="color: #6b7280;">(${actualValue})</span>` 
                    : 'None';
            }

            if (filterBuildingCount) {
                filterBuildingCount.textContent = buildingState.filteredBuildings.length;
            }

            // Update preview table - SHOW ALL RECORDS
            const previewTableBody = document.getElementById('preview-table-body');
            if (previewTableBody) {
                let html = '';
                
                buildingState.filteredBuildings.forEach((feature, index) => {
                    const props = feature.properties || {};
                    html += `
                        <tr>
                            <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
                            <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${props.name_building || '-'}</td>
                            <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${props.dist_name || '-'}</td>
                            <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${props.tehsil_name || '-'}</td>
                            <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${props.village_name || '-'}</td>
                        </tr>
                    `;
                });
                
                if (html === '') {
                    html = `
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 40px; color: #9ca3af;">
                                No data available
                            </td>
                        </tr>
                    `;
                }
                
                previewTableBody.innerHTML = html;
            }

            // Update tab badge counts
            const tabBuildingsCount = document.getElementById('tab-buildings-count');
            if (tabBuildingsCount) tabBuildingsCount.textContent = buildingState.filteredBuildings.length;

            // Populate Covered & Uncovered GP tabs
            const selDistrictName = districtSelect?.options[districtSelect.selectedIndex]?.text?.replace('-- All Districts --','').trim() || '';
            const { covered, uncovered } = getGPCoverageData(selDistrictName);

            const tabCoveredCount = document.getElementById('tab-covered-count');
            const tabUncoveredCount = document.getElementById('tab-uncovered-count');
            if (tabCoveredCount) tabCoveredCount.textContent = covered.length;
            if (tabUncoveredCount) tabUncoveredCount.textContent = uncovered.length;

            const td = (val) => `<td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;">${val}</td>`;

            const coveredBody = document.getElementById('covered-gp-table-body');
            if (coveredBody) {
                coveredBody.innerHTML = covered.length
                    ? covered.map((r, i) => `<tr>${td(i+1)}${td(r.name)}${td(r.buildings)}${td(r.district)}${td(r.tehsil)}</tr>`).join('')
                    : `<tr><td colspan="5" style="text-align:center;padding:30px;color:#9ca3af;">No covered GPs found.</td></tr>`;
            }

            const uncoveredBody = document.getElementById('uncovered-gp-table-body');
            if (uncoveredBody) {
                uncoveredBody.innerHTML = uncovered.length
                    ? uncovered.map((r, i) => `<tr>${td(i+1)}${td(r.name)}${td(r.district)}${td(r.tehsil)}</tr>`).join('')
                    : `<tr><td colspan="4" style="text-align:center;padding:30px;color:#9ca3af;">All GPs are covered!</td></tr>`;
            }

            // Open modal
            const exportModal = new bootstrap.Modal(document.getElementById('buildingExportModal'));
            exportModal.show();
        });
    }

    // Excel export handler
    const confirmExcelExport = document.getElementById('confirm-excel-export');
    if (confirmExcelExport) {
        confirmExcelExport.addEventListener('click', () => {
            try {
                if (typeof XLSX === 'undefined') {
                    showNotification('Excel export library not loaded. Please refresh the page.', 'error');
                    return;
                }

                exportBuildingAsExcel();
                
                const exportModal = bootstrap.Modal.getInstance(document.getElementById('buildingExportModal'));
                if (exportModal) exportModal.hide();
            } catch (error) {
                console.error('Excel export error:', error);
                showNotification('Failed to export Excel. Please try again.', 'error');
            }
        });
    }

    // PDF export handler
    const confirmPdfExport = document.getElementById('confirm-pdf-export');
    if (confirmPdfExport) {
        confirmPdfExport.addEventListener('click', () => {
            try {
                if (typeof window.jspdf === 'undefined') {
                    showNotification('PDF export library not loaded. Please refresh the page.', 'error');
                    return;
                }

                exportBuildingAsPDF();
                
                const exportModal = bootstrap.Modal.getInstance(document.getElementById('buildingExportModal'));
                if (exportModal) exportModal.hide();
            } catch (error) {
                console.error('PDF export error:', error);
                showNotification('Failed to export PDF. Please try again.', 'error');
            }
        });
    }

    // WMS Layer toggle
    if (wmsLayerCheckbox) {
        wmsLayerCheckbox.addEventListener('change', (e) => {
            toggleBuildingLayer(e.target.checked);
        });
        
        toggleBuildingLayer(wmsLayerCheckbox.checked);
    }
}

// ==================== UTILITY FUNCTIONS ====================
export function optimizeCanvasPerformance() {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (contextType, contextAttributes) {
        if (contextType === '2d') {
            contextAttributes = contextAttributes || {};
            contextAttributes.willReadFrequently = true;
        }
        return originalGetContext.call(this, contextType, contextAttributes);
    };
}

export function showNotification(message, type = 'info', duration = 3000) {
    if (typeof Swal !== 'undefined') {
        let icon;
        switch (type) {
            case 'error': icon = 'error'; break;
            case 'success': icon = 'success'; break;
            case 'warning': icon = 'warning'; break;
            default: icon = 'info';
        }

        Swal.fire({
            title: message,
            icon: icon,
            timer: duration,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
            timerProgressBar: true
        });
    } else {
        if (type === 'error') {
            alert(`ERROR: ${message}`);
        }
    }
}

export function updateCoordinateDisplay(lat, lon, zoom) {
    const latEl = document.getElementById('currentLat');
    const lonEl = document.getElementById('currentLon');
    const zoomEl = document.getElementById('zoomLevel');

    if (latEl) latEl.value = lat.toFixed(4);
    if (lonEl) lonEl.value = lon.toFixed(4);
    if (zoomEl) zoomEl.textContent = `Level ${Math.round(zoom)}`;
}

export function fastPopulateDropdown(selectElement, options, defaultOption = '') {
    if (!selectElement) return;

    selectElement.innerHTML = '';
    const fragment = document.createDocumentFragment();

    if (defaultOption) {
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = defaultOption;
        fragment.appendChild(defaultOpt);
    }

    options.forEach(({ value, text }) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        fragment.appendChild(option);
    });

    selectElement.appendChild(fragment);
}

export function updateMapContainerClasses() {
    const mapContainer = document.getElementById('map-container');
    const panel = document.getElementById('slide-panel');
    const legendPanel = document.getElementById('legend-panel');

    if (!mapContainer) return;

    const panelOpen = panel?.classList.contains('open');
    const legendPanelOpen = legendPanel?.classList.contains('open');

    mapContainer.classList.remove('panel-open', 'legend-open', 'both-open');

    if (panelOpen && legendPanelOpen) {
        mapContainer.classList.add('both-open');
    } else if (panelOpen) {
        mapContainer.classList.add('panel-open');
    } else if (legendPanelOpen) {
        mapContainer.classList.add('legend-open');
    }
}

export function loadExternalDependencies() {
    if (!document.querySelector('link[href*="bootstrap"]')) {
        const bootstrapCSS = document.createElement('link');
        bootstrapCSS.rel = 'stylesheet';
        bootstrapCSS.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
        bootstrapCSS.onerror = () => console.warn('Failed to load Bootstrap CSS');
        document.head.appendChild(bootstrapCSS);
    }

    if (typeof bootstrap === 'undefined') {
        const bootstrapScript = document.createElement('script');
        bootstrapScript.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js';
        bootstrapScript.onload = () => console.log('Bootstrap loaded successfully');
        bootstrapScript.onerror = () => console.warn('Failed to load Bootstrap JS');
        document.head.appendChild(bootstrapScript);
    }

    if (typeof Swal === 'undefined') {
        const sweetalertCSS = document.createElement('link');
        sweetalertCSS.rel = 'stylesheet';
        sweetalertCSS.href = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css';
        sweetalertCSS.onerror = () => console.warn('Failed to load SweetAlert2 CSS');
        document.head.appendChild(sweetalertCSS);

        const sweetalertScript = document.createElement('script');
        sweetalertScript.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
        sweetalertScript.onload = () => {
            window.Swal = Swal;
        };
        sweetalertScript.onerror = () => {
            console.error('Failed to load SweetAlert2 JS');
            console.warn('Falling back to basic notifications');
        };
        document.head.appendChild(sweetalertScript);
    }
}

export function exportToCSV(data, filename, headers, rowMapper) {
    try {
        const csvContent = [
            headers.join(','),
            ...data.map(row => rowMapper(row).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('Failed to export data', 'error');
    }
}

// ==================== MAP INITIALIZATION ====================
function createNavigationStyle(type) {
    const colors = {
        district: '#dc2626',
        tehsil: '#3b82f6',
        village: '#10b981'
    };
    
    return new Style({
        stroke: new Stroke({
            color: colors[type] || '#000000',
            width: 3,
            lineDash: [8, 4]
        }),
        fill: new Fill({ color: 'rgba(255, 255, 255, 0.1)' })
    });
}

function initializeMap() {
    initializeBasemaps();
    initializeWMSLayers();

    vectorLayers.navDistrict = new VectorLayer({
        source: vectorSources.navDistrict,
        style: createNavigationStyle('district'),
        zIndex: 105,
        name: 'nav-district'
    });

    vectorLayers.navTehsil = new VectorLayer({
        source: vectorSources.navTehsil,
        style: createNavigationStyle('tehsil'),
        zIndex: 106,
        name: 'nav-tehsil'
    });

    vectorLayers.navVillage = new VectorLayer({
        source: vectorSources.navVillage,
        style: createNavigationStyle('village'),
        zIndex: 107,
        name: 'nav-village'
    });

    vectorLayers.analysisBuffer = new VectorLayer({
        source: vectorSources.analysisBuffer,
        style: new Style({
            stroke: new Stroke({
                color: '#8b5cf6',
                width: 2
            }),
            fill: new Fill({
                color: 'rgba(139, 92, 246, 0.1)'
            })
        }),
        zIndex: 108,
        name: 'analysis-buffer'
    });

    vectorLayers.analysisProximity = new VectorLayer({
        source: vectorSources.analysisProximity,
        style: new Style({
            stroke: new Stroke({
                color: '#f59e0b',
                width: 2
            }),
            fill: new Fill({
                color: 'rgba(245, 158, 11, 0.1)'
            })
        }),
        zIndex: 109,
        name: 'analysis-proximity'
    });

    const markerLayer = new VectorLayer({
        source: vectorSources.marker,
        zIndex: 120
    });

    mapState.instance = new Map({
        target: 'map',
        layers: [
            mapState.basemapLayers.osm,
            mapState.basemapLayers.satellite,
            mapState.basemapLayers.terrain,
            mapState.basemapLayers.hybrid,
            vectorLayers.navDistrict,
            vectorLayers.navTehsil,
            vectorLayers.navVillage,
            vectorLayers.analysisBuffer,
            vectorLayers.analysisProximity,
            markerLayer
        ],
        view: new View({
            center: fromLonLat([82.15, 21.25]),
            zoom: 7.1
        }),
        controls: defaultControls({
            attribution: false,
            zoom: true
        }).extend([
            new Attribution({ collapsible: false })
        ]),
        pixelRatio: 1,
        renderer: 'canvas'
    });

    addMapEventListeners();
    
    try {
        initializeMeasurementSystem();
    } catch (error) {
        console.error('Error initializing measurement system:', error);
    }
}

function addMapEventListeners() {
    if (!mapState.instance) return;

    mapState.instance.on('pointermove', function (event) {
        const coords = toLonLat(event.coordinate);
        updateCoordinateDisplay(coords[1], coords[0], mapState.instance.getView().getZoom());
    });

    mapState.instance.getView().on('change:resolution', function () {
        const zoom = mapState.instance.getView().getZoom();
        const zoomEl = document.getElementById('zoomLevel');
        if (zoomEl) {
            zoomEl.textContent = `Level ${Math.round(zoom)}`;
        }
    });
    
    mapState.instance.on('pointermove', function (evt) {
        const pixel = evt.pixel;
        const hit = mapState.instance.hasFeatureAtPixel(pixel);
        mapState.instance.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });
}

let isHardRefresh = false;

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F5' || e.key === 'r' || e.key === 'R')) {
        isHardRefresh = true;
        sessionStorage.removeItem('panelState');
        sessionStorage.removeItem('activeMapLayers');
        localStorage.removeItem('activeMapLayers');
        localStorage.setItem('activeMapLayers', JSON.stringify(['cg_dist']));
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'F5' && !e.shiftKey) {
        isHardRefresh = true;
        sessionStorage.removeItem('panelState');
        sessionStorage.removeItem('activeMapLayers');
        localStorage.removeItem('activeMapLayers');
        localStorage.setItem('activeMapLayers', JSON.stringify(['cg_dist']));
    }
});

async function initializeApplication() {
    console.time('Application Initialization');

    try {
        loadExternalDependencies();
        initializeMap();
        setupBaseMapControls();
        setupMapControls();
        addLegendToggleButton();
        initializeEventListeners();
        initializePrintModule();
        
        loadGlobalDistricts().then(() => {
        }).catch(error => {
            console.error('Failed to load global districts:', error);
        });

        if (!isHardRefresh) {
            restorePanelState();
            
            if (mapState.currentPanel) {
                setTimeout(() => {
                    openPanel(mapState.currentPanel);
                }, 500);
            }
        }

        setTimeout(() => {
            try {
                restoreActiveLayerState();
            } catch (error) {
                console.warn('Error restoring layer state:', error);
            }
        }, 1000);

    } catch (error) {
        console.error('Critical error during initialization:', error);
    } finally {
        console.timeEnd('Application Initialization');
    }
}

optimizeCanvasPerformance();

document.addEventListener('DOMContentLoaded', initializeApplication);
addEventListener('load', function () {
    if (!mapState.instance) {
        initializeApplication();
    }
});

// ==================== GLOBAL DISTRICT DATA ====================
export const globalDistrictData = {
    data: null,
    loading: false,
    loaded: false,
    error: null
};

export async function loadGlobalDistricts() {
    if (globalDistrictData.loaded && globalDistrictData.data) {
        return globalDistrictData.data;
    }

    if (globalDistrictData.loading) {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (globalDistrictData.loaded) {
                    clearInterval(checkInterval);
                    resolve(globalDistrictData.data);
                }
            }, 100);
        });
    }

    if (SIMPLE_STORAGE.districts) {
        globalDistrictData.data = SIMPLE_STORAGE.districts;
        globalDistrictData.loaded = true;
        return SIMPLE_STORAGE.districts;
    }

    globalDistrictData.loading = true;
    globalDistrictData.error = null;

    try {
        const response = await fetch(API_CONFIG.apiUrl + '/districts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                authkey: API_CONFIG.apiAuthKey 
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        const data = await response.json();
        
        globalDistrictData.data = data;
        globalDistrictData.loaded = true;
        globalDistrictData.loading = false;
        SIMPLE_STORAGE.districts = data;
        
        return data;
    } catch (error) {
        console.error('Error loading districts:', error);
        globalDistrictData.error = error;
        globalDistrictData.loading = false;
        throw error;
    }
}

export function populateGlobalDistrictDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) {
        console.warn('Dropdown not found:', dropdownId);
        return;
    }

    if (!globalDistrictData.loaded || !globalDistrictData.data) {
        console.warn('District data not loaded yet');
        dropdown.innerHTML = '<option value="">Loading districts...</option>';
        dropdown.disabled = true;
        
        loadGlobalDistricts().then(() => {
            populateGlobalDistrictDropdown(dropdownId);
        }).catch(error => {
            console.error('Failed to load districts:', error);
            dropdown.innerHTML = '<option value="">Error loading districts</option>';
            dropdown.disabled = false;
        });
        return;
    }

    try {
        const districts = globalDistrictData.data.features || globalDistrictData.data.data || globalDistrictData.data;
        
        const options = districts.map(feature => {
            const properties = feature.properties || feature;
            return {
                value: properties.dist_cod || properties.dist_code || properties.districtCode || properties.id,
                text: properties.dist_e || properties.dist_name || properties.districtName || properties.name
            };
        });

        fastPopulateDropdown(dropdown, options, '-- Select District --');
        dropdown.disabled = false;
        
    } catch (error) {
        console.error('Error populating district dropdown:', error);
        dropdown.innerHTML = '<option value="">Error loading districts</option>';
        dropdown.disabled = false;
    }
}