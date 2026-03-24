import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Circle, Fill, Stroke, Text } from 'ol/style';
import ImageWMS from 'ol/source/ImageWMS';
import ImageLayer from 'ol/layer/Image';

import { 
    API_CONFIG,
    mapState,
    showNotification
} from '../main.js';

import {
    setCustomLegendItems,
    getCustomLegendItems,
    updateLegend
} from './layers.js';

// Building state management
export const buildingState = {
    departments: [],
    selectedDepartment: null,
    buildingLayer: null,
    buildingSource: null,
    filteredBuildings: [],
    loading: false
};

// Add village layer state
export const villageLayerState = {
    layer: null,
    source: null,
    villagesWithBuildings: new Set(),
    allVillages: new Map()
};

// GP (Gram Panchayat) WMS layer state
export const gpLayerState = {
    wmsLayer: null,
    coverageLayer: null,
    coverageSource: null,
    gpsWithBuildings: new Set(),  // Set of OL feature refs
    gpBuildingMap: new Map(),     // OL feature → [{name, tehsil, district}]
    tehsilMap: new Map(),         // teh_cod → teh_e (tehsil name)
    allGPs: new Map()
};

// ==================== DEPARTMENT DATA ====================
export async function loadDepartments() {
    if (buildingState.departments.length > 0) {
        return buildingState.departments;
    }

    buildingState.loading = true;

    try {
        // Mock department data based on the images provided
        const departments = [
            // { id: 'CGCOGD0001', name: 'Chhattisgarh Promotion Of Regional & Traditional Society' },
            // { id: 'CGCOGD0002', name: 'Archaeological Survey Of India' },
            // { id: 'CGCOGD0003', name: 'Chhattisgarh Excise Department' },
            // { id: 'CGCOGD0004', name: 'Chhattisgarh Forest & Climate Change' },
            // { id: 'CGCOGD0005', name: 'Department Of Energy' },
            // { id: 'CGCOGD0006', name: 'Chhattisgarh Legal Metrology Department' },
            // { id: 'CGCOGD0007', name: 'Chhattisgarh Public Health Department' },
            // { id: 'CGCOGD0008', name: 'Chhattisgarh State Agricultural Marketing(Mandi) Board' },
            // { id: 'CGCOGD0009', name: 'Chhattisgarh State Minor Forest Produce Co. operative Federation Limited' },
            // { id: 'CGCOGD0010', name: 'Chhattisgarh State Farmacy Council' },
            // { id: 'CGCOGD0011', name: 'Chhattisgarh State Power Distribution Corporation Limited' },
            // { id: 'CGCOGD0012', name: 'Chhattisgarh State Power Transmission Company Ltd' },
            // { id: 'CGCOGD0013', name: 'Chhattisgarh State Skill Development Authority' },
            // { id: 'CGCOGD0014', name: 'Chhattisgarh Transport Department' },
            // { id: 'CGCOGD0015', name: 'Department Of Food & Civil Supplies & Consumer Protection' },
            // { id: 'CGCOGD0016', name: 'Department Of Health' },
            // { id: 'CGCOGD0017', name: 'Department Of Sport & Youth Welfare' },
            // { id: 'CGCOGD0018', name: 'Directorate Of Employment And Training' },
            // { id: 'CGCOGD0019', name: 'Directorate Of Geology And Mining' },
            // { id: 'CGCOGD0020', name: 'Directorate Of Technical Education' },
            // { id: 'CGCOGD0021', name: 'Farmer Welfare & Agricultural Development' },
            // { id: 'CGCOGD0022', name: 'Food Corporation Of India' },
            // { id: 'CGCOGD0023', name: 'Ministry Of Aviation' },
            // { id: 'CGCOGD0024', name: 'Ministry Of Railway' },
            // { id: 'CGCOGD0025', name: 'Naya Raipur Development Authority (NRDA)' },
            { id: 'CGCOGD0026', name: 'Directorate Of Panchayat And Rural Development' },
            // { id: 'CGCOGD0027', name: 'State Urban Development Authority' },
            // { id: 'CGCOGD0028', name: 'Water Resource Department' },
            // { id: 'CGCOGD0029', name: 'Women And Child Development Department' },
            // { id: 'CGCOGD0030', name: 'Raipur development authority' },
            // { id: 'CGCOGD0031', name: 'Housing board' },
            // { id: 'CGCOGD0032', name: 'Town & country planning' },
            // { id: 'CGCOGD0033', name: 'Tribal' },
            // { id: 'CGCOGD0034', name: 'Concor' },
            // { id: 'CGCOGD0035', name: 'Directorate of Archaeology, archive and museum' },
            // { id: 'CGCOGD0036', name: 'Department of culture' },
            // { id: 'CGCOGD0037', name: 'Public health engineering' },
            // { id: 'CGCOGD0038', name: 'Revenue and disaster management' },
            // { id: 'CGCOGD0039', name: 'Home' },
            // { id: 'CGCOGD0040', name: 'Commerce and industry' },
            // { id: 'CGCOGD0041', name: 'Department of higher education' },
            // { id: 'CGCOGD0042', name: 'Department of school education' },
            // { id: 'CGCOGD0043', name: 'Directorate Of Horticulture And Farm Forestry' },
            // { id: 'CGCOGD0044', name: 'Chhattisgarh Rural Road Development Department' },
            // { id: 'CGCOGD0045', name: 'Chhattisgarh Tourism Board' },
            // { id: 'CGCOGD0046', name: 'Chhattisgarh State Warehousing Corporation Ltd' },
            // { id: 'CGCOGD0047', name: 'Directorate of Institutional Finance' },
            // { id: 'CGCOGD0048', name: 'Chhattisgarh State Renewable Energy Development Agency (CREDA)' },
            // { id: 'CGCOGD0049', name: 'Chhattisgarh State Industrial Development Corporation' },
            // { id: 'CGCOGD0050', name: 'Directorate of Treasury Accounts and Pensions' },
            // { id: 'CGCOGD0051', name: 'Department of Fishries' },
            // { id: 'CGCOGD0052', name: 'Directorate of Rural Industries Sericulture' }
        ];

        buildingState.departments = departments;
        buildingState.loading = false;
        return departments;
    } catch (error) {
        console.error('Error loading departments:', error);
        buildingState.loading = false;
        throw error;
    }
}



// ==================== CREATE VILLAGE LAYER ====================
export function createVillageAnalysisLayer() {
    if (villageLayerState.layer) {
        return villageLayerState.layer;
    }

    villageLayerState.source = new VectorSource();

    villageLayerState.layer = new VectorLayer({
        source: villageLayerState.source,
        style: function(feature) {
            const villageCode = feature.get('vill_cod');
            const hasBuildings = villageLayerState.villagesWithBuildings.has(String(villageCode));
            
            return new Style({
                stroke: new Stroke({
                    color: hasBuildings ? '#10b981' : '#6b7280',
                    width: 2
                }),
                fill: new Fill({
                    color: hasBuildings ? 'rgba(16, 185, 129, 0.3)' : 'rgba(107, 116, 128, 0.2)'
                })
            });
        },
        zIndex: 95,
        name: 'village-analysis'
    });

    return villageLayerState.layer;
}

// ==================== LOAD VILLAGE BOUNDARIES ====================
export async function loadVillageLayer() {
    try {
        showNotification('Loading village boundaries...', 'info');

        const wfsUrl = API_CONFIG.wfsUrl;
        const params = new URLSearchParams({
            service: 'WFS',
            version: '1.1.0',
            request: 'GetFeature',
            typeName: 'CGCOG_DATABASE:cg_village_boundary',
            outputFormat: 'application/json',
            srsName: 'EPSG:4326'
        });

        const response = await fetch(`${wfsUrl}?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch village boundaries: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('Village data received:', data);
        
        if (!villageLayerState.source) {
            createVillageAnalysisLayer();
        }

        const format = new GeoJSON();
        const features = format.readFeatures(data, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });

        console.log(`Parsed ${features.length} village features`);

        villageLayerState.source.clear();
        villageLayerState.source.addFeatures(features);

        // Store all village features with their codes
        villageLayerState.allVillages.clear();
        features.forEach(feature => {
            const code = feature.get('vill_cod');
            const name = feature.get('vill_nam');
            
            if (code) {
                villageLayerState.allVillages.set(String(code), {
                    feature: feature,
                    name: name,
                    code: code
                });
            }
        });

        console.log(`Stored ${villageLayerState.allVillages.size} villages in map`);

        // Add to map if not already added
        if (mapState.instance) {
            const existingLayers = mapState.instance.getLayers().getArray();
            const layerExists = existingLayers.includes(villageLayerState.layer);
            
            if (!layerExists) {
                mapState.instance.addLayer(villageLayerState.layer);
                console.log('Village layer added to map');
            }
        }

        showNotification(`Loaded ${features.length} village boundaries`, 'success');
        return data;
    } catch (error) {
        console.error('Error loading village layer:', error);
        showNotification('Failed to load village boundaries: ' + error.message, 'error');
        throw error;
    }
}



// ==================== ANALYZE VILLAGES WITH BUILDINGS ====================
export function analyzeVillagesWithBuildings(buildingFeatures) {
    if (!buildingFeatures || buildingFeatures.length === 0) {
        showNotification('No buildings to analyze', 'warning');
        return;
    }

    if (!villageLayerState.source) {
        showNotification('Village layer not loaded', 'warning');
        return;
    }

    villageLayerState.villagesWithBuildings.clear();

    const villageFeatures = villageLayerState.source.getFeatures();
    
    if (villageFeatures.length === 0) {
        console.warn('No village features in source');
        showNotification('No village features loaded', 'warning');
        return;
    }

    // Get building point features from the vector source
    const buildingPointFeatures = buildingState.buildingSource?.getFeatures() || [];
    
    if (buildingPointFeatures.length === 0) {
        console.warn('No building point features found');
        return;
    }

    console.log(`Analyzing ${buildingPointFeatures.length} buildings against ${villageFeatures.length} villages...`);

    let matchCount = 0;

    // For each building point, check which village contains it
    buildingPointFeatures.forEach((buildingFeature, idx) => {
        const buildingGeom = buildingFeature.getGeometry();
        
        if (!buildingGeom) {
            console.warn(`Building ${idx} has no geometry`);
            return;
        }

        const buildingCoord = buildingGeom.getCoordinates();

        // Check each village polygon
        villageFeatures.forEach(villageFeature => {
            const villageGeom = villageFeature.getGeometry();
            
            if (!villageGeom) return;

            // Spatial containment check
            if (villageGeom.intersectsCoordinate(buildingCoord)) {
                const villageCode = villageFeature.get('vill_cod');
                
                if (villageCode) {
                    villageLayerState.villagesWithBuildings.add(String(villageCode));
                    matchCount++;
                    
                    // Log for debugging
                    const villageName = villageFeature.get('vill_nam');
                    console.log(`Building found in village: ${villageName} (${villageCode})`);
                }
            }
        });
    });

    console.log(`Total spatial matches: ${matchCount}`);

    // Refresh the layer style
    if (villageLayerState.layer) {
        villageLayerState.layer.changed();
    }

    // Update legend
    updateVillageLegend();

    // Show statistics
    const totalVillages = villageLayerState.allVillages.size;
    const villagesWithBuildings = villageLayerState.villagesWithBuildings.size;
    const villagesWithoutBuildings = totalVillages - villagesWithBuildings;

    console.log('Village Analysis Results:', {
        totalVillages: totalVillages,
        villagesWithBuildings: villagesWithBuildings,
        villagesWithoutBuildings: villagesWithoutBuildings,
        percentage: totalVillages > 0 ? ((villagesWithBuildings / totalVillages) * 100).toFixed(2) + '%' : '0%'
    });

    // Log village names with buildings
    const villageNamesWithBuildings = [];
    villageLayerState.villagesWithBuildings.forEach(code => {
        const villageData = villageLayerState.allVillages.get(code);
        if (villageData) {
            villageNamesWithBuildings.push(villageData.name);
        }
    });
    console.log('Villages with buildings:', villageNamesWithBuildings);

    if (totalVillages > 0) {
        showNotification(
            `Analysis Complete: ${villagesWithBuildings} of ${totalVillages} villages have buildings (${((villagesWithBuildings/totalVillages)*100).toFixed(1)}%)`,
            'success',
            5000
        );
    }
}

// ==================== UPDATE LEGEND FOR VILLAGES ====================
function updateVillageLegend() {
    const existingLegendItems = getCustomLegendItems();
    
    // Remove old village legend items
    const filteredItems = existingLegendItems.filter(item => 
        !item.label.includes('Villages with Buildings') &&
        !item.label.includes('Villages without Buildings')
    );

    // Add new village legend items
    const newLegendItems = [
        ...filteredItems,
        {
            color: '#10b981',
            label: 'Villages with Buildings',
            shape: 'polygon'
        },
        {
            color: '#6b7280',
            label: 'Villages without Buildings',
            shape: 'polygon'
        }
    ];

    setCustomLegendItems(newLegendItems);
    updateLegend();
}

// ==================== REMOVE VILLAGE LAYER ====================
export function removeVillageAnalysisLayer() {
    if (villageLayerState.layer && mapState.instance) {
        mapState.instance.removeLayer(villageLayerState.layer);
    }

    villageLayerState.villagesWithBuildings.clear();
    villageLayerState.allVillages.clear();

    // Remove from legend
    const existingLegendItems = getCustomLegendItems();
    const filteredItems = existingLegendItems.filter(item => 
        !item.label.includes('Villages with Buildings') &&
        !item.label.includes('Villages without Buildings')
    );
    setCustomLegendItems(filteredItems);
    updateLegend();
}

// ==================== GP WMS LAYER SETUP ====================
export function createGPWMSLayer() {
    if (gpLayerState.wmsLayer) {
        return gpLayerState.wmsLayer;
    }

    gpLayerState.wmsLayer = new ImageLayer({
        title: 'Gram Panchayat Boundaries',
        source: new ImageWMS({
            url: API_CONFIG.adminUrl,
            params: {
                'LAYERS': 'CGCOG_DATABASE:cg_gp',
                'FORMAT': 'image/png',
                'TRANSPARENT': true,
                'STYLES': '',
                'VERSION': '1.1.0'
            },
            serverType: 'geoserver',
            crossOrigin: 'anonymous',
        }),
        visible: true,
        zIndex: 93,
        name: 'gp-wms-boundary'
    });

    return gpLayerState.wmsLayer;
}

// ==================== LOAD GP LAYER (WMS + WFS for coverage) ====================
export async function loadGPLayer(buildingFeatures = [], districtCode = '') {
    try {
        showNotification('Loading Gram Panchayat boundaries...', 'info');

        // Add WMS layer to map and apply district filter
        if (mapState.instance) {
            if (!gpLayerState.wmsLayer) {
                createGPWMSLayer();
            }
            const existingLayers = mapState.instance.getLayers().getArray();
            if (!existingLayers.includes(gpLayerState.wmsLayer)) {
                mapState.instance.addLayer(gpLayerState.wmsLayer);
            }

            // Apply CQL_FILTER on WMS to show only selected district GPs
            const wmsSource = gpLayerState.wmsLayer.getSource();
            if (districtCode) {
                wmsSource.updateParams({ 'CQL_FILTER': `dist_cod = '${districtCode}'` });
            } else {
                wmsSource.updateParams({ 'CQL_FILTER': undefined });
            }
        }

        // Build GP WFS filter — dist_cod is preferred (exact), BBOX as fallback
        let gpCqlFilter = '';
        if (districtCode) {
            gpCqlFilter = `dist_cod = '${districtCode}'`;
        } else if (buildingFeatures.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            buildingFeatures.forEach(f => {
                const coords = f.geometry?.coordinates;
                if (coords) {
                    const [x, y] = Array.isArray(coords[0]) ? coords[0] : coords;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            });
            const pad = 0.5;
            gpCqlFilter = `BBOX(the_geom,${minX - pad},${minY - pad},${maxX + pad},${maxY + pad},'EPSG:4326')`;
        }

        // Fetch GP WFS + Tehsil WFS in parallel for speed
        const wfsUrl = API_CONFIG.wfsUrl;

        const gpParams = new URLSearchParams({
            service: 'WFS', version: '1.1.0', request: 'GetFeature',
            typeName: 'CGCOG_DATABASE:cg_gp',
            outputFormat: 'application/json', srsName: 'EPSG:4326'
        });
        if (gpCqlFilter) gpParams.append('CQL_FILTER', gpCqlFilter);

        const tehsilParams = new URLSearchParams({
            service: 'WFS', version: '1.1.0', request: 'GetFeature',
            typeName: 'CGCOG_DATABASE:cg_tehsil_boundary',
            outputFormat: 'application/json', srsName: 'EPSG:4326'
        });
        if (districtCode) tehsilParams.append('CQL_FILTER', `dist_cod='${districtCode}'`);

        const [gpResp, tehsilResp] = await Promise.all([
            fetch(`${wfsUrl}?${gpParams.toString()}`),
            fetch(`${wfsUrl}?${tehsilParams.toString()}`).catch(() => null)
        ]);

        if (!gpResp.ok) throw new Error(`Failed to fetch GP boundaries: ${gpResp.status}`);

        const [data, tehsilData] = await Promise.all([
            gpResp.json(),
            tehsilResp?.json().catch(() => null)
        ]);

        // Build teh_cod → teh_e map
        gpLayerState.tehsilMap.clear();
        (tehsilData?.features || []).forEach(f => {
            const cod = f.properties?.teh_cod;
            const name = f.properties?.teh_e || f.properties?.teh_nam;
            if (cod && name) gpLayerState.tehsilMap.set(String(cod), name);
        });
        console.log(`Tehsil map built: ${gpLayerState.tehsilMap.size} entries`);
        console.log(`GP data received: ${data.features?.length} features`);

        // Create coverage vector layer if not exists
        if (!gpLayerState.coverageSource) {
            gpLayerState.coverageSource = new VectorSource();
            gpLayerState.coverageLayer = new VectorLayer({
                source: gpLayerState.coverageSource,
                style: function(feature) {
                    const hasBuildings = gpLayerState.gpsWithBuildings.has(feature);
                    const zoom = mapState.instance ? mapState.instance.getView().getZoom() : 0;
                    const gpName = feature.get('gp_nam') || '';

                    return new Style({
                        stroke: new Stroke({
                            color: hasBuildings ? '#10b981' : '#6b7280',
                            width: 1.5
                        }),
                        fill: new Fill({
                            color: hasBuildings ? 'rgba(16, 185, 129, 0.4)' : 'rgba(107, 114, 128, 0.25)'
                        }),
                        text: zoom >= 9 ? new Text({
                            text: gpName,
                            font: 'bold 11px Arial, sans-serif',
                            fill: new Fill({ color: hasBuildings ? '#065f46' : '#374151' }),
                            stroke: new Stroke({ color: '#ffffff', width: 3 }),
                            backgroundFill: new Fill({ color: hasBuildings ? 'rgba(209,250,229,0.85)' : 'rgba(243,244,246,0.85)' }),
                            backgroundStroke: new Stroke({ color: hasBuildings ? '#10b981' : '#9ca3af', width: 1 }),
                            padding: [3, 5, 3, 5],
                            overflow: true,
                            placement: 'point'
                        }) : null
                    });
                },
                zIndex: 94,
                name: 'gp-coverage'
            });

            if (mapState.instance) {
                mapState.instance.addLayer(gpLayerState.coverageLayer);
            }
        }

        const format = new GeoJSON();
        const features = format.readFeatures(data, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });

        console.log(`Parsed ${features.length} GP features`);

        gpLayerState.coverageSource.clear();
        gpLayerState.coverageSource.addFeatures(features);

        // Store all GPs
        gpLayerState.allGPs.clear();
        features.forEach(feature => {
            const code = feature.get('gp_lgd_code') || feature.get('gp_code') || feature.get('gid');
            const name = feature.get('gp_name') || feature.get('name');
            if (code) {
                gpLayerState.allGPs.set(String(code), { feature, name, code });
            }
        });

        console.log(`Stored ${gpLayerState.allGPs.size} GPs in map`);
        showNotification(`Loaded ${features.length} Gram Panchayat boundaries`, 'success');
        return data;
    } catch (error) {
        console.error('Error loading GP layer:', error);
        showNotification('Failed to load Gram Panchayat boundaries: ' + error.message, 'error');
        throw error;
    }
}

// ==================== ANALYZE GPS WITH BUILDINGS ====================
export function analyzeGPWithBuildings(buildingFeatures) {
    if (!buildingFeatures || buildingFeatures.length === 0) {
        showNotification('No buildings to analyze', 'warning');
        return;
    }

    if (!gpLayerState.coverageSource) {
        showNotification('GP layer not loaded', 'warning');
        return;
    }

    gpLayerState.gpsWithBuildings.clear();
    gpLayerState.gpBuildingMap.clear();

    const gpFeatures = gpLayerState.coverageSource.getFeatures();
    if (gpFeatures.length === 0) {
        console.warn('No GP features in source');
        return;
    }

    // ---- Strategy 1: Attribute matching using gp_nam field (O(n+m), fast) ----
    const gpByName = new Map();
    gpFeatures.forEach(f => {
        const name = (f.get('gp_nam') || f.get('gp_name') || f.get('name') || '').trim().toLowerCase();
        if (name) gpByName.set(name, f);
    });

    const unmatchedBuildings = [];
    buildingFeatures.forEach(f => {
        const gpName = (f.properties?.gram_panchayat_name || '').trim().toLowerCase();
        if (gpName) {
            const gpFeature = gpByName.get(gpName);
            if (gpFeature) {
                gpLayerState.gpsWithBuildings.add(gpFeature);
                return;
            }
        }
        unmatchedBuildings.push(f);
    });

    console.log(`Attribute match: ${gpLayerState.gpsWithBuildings.size} GPs matched, ${unmatchedBuildings.length} buildings need spatial fallback`);

    // ---- Strategy 2: Spatial fallback only for unmatched buildings ----
    if (unmatchedBuildings.length > 0) {
        const buildingOLFeatures = buildingState.buildingSource?.getFeatures() || [];
        buildingOLFeatures.forEach(buildingFeature => {
            const geom = buildingFeature.getGeometry();
            if (!geom) return;
            const coord = geom.getCoordinates();

            for (const gpFeature of gpFeatures) {
                const gpGeom = gpFeature.getGeometry();
                if (!gpGeom) continue;
                if (gpGeom.intersectsCoordinate(coord)) {
                    gpLayerState.gpsWithBuildings.add(gpFeature);
                    break;
                }
            }
        });
    }

    // ---- Build gpBuildingMap: spatial match of ALL buildings against ONLY covered GPs ----
    {
        const coveredGPs = [...gpLayerState.gpsWithBuildings];
        const buildingOLAll = buildingState.buildingSource?.getFeatures() || [];

        buildingOLAll.forEach(bFeature => {
            const geom = bFeature.getGeometry();
            if (!geom) return;
            const coord = geom.getCoordinates();

            for (const gpFeature of coveredGPs) {
                const gpGeom = gpFeature.getGeometry();
                if (!gpGeom) continue;
                if (gpGeom.intersectsCoordinate(coord)) {
                    if (!gpLayerState.gpBuildingMap.has(gpFeature)) {
                        gpLayerState.gpBuildingMap.set(gpFeature, []);
                    }
                    gpLayerState.gpBuildingMap.get(gpFeature).push({
                        name: bFeature.get('name_building') || '-',
                        tehsil: bFeature.get('tehsil_name') || '-',
                        district: bFeature.get('dist_name') || '-'
                    });
                    break;
                }
            }
        });
        console.log(`gpBuildingMap built: ${gpLayerState.gpBuildingMap.size} covered GPs with buildings`);
    }

    if (gpLayerState.coverageLayer) {
        gpLayerState.coverageLayer.changed();
    }

    updateGPLegend();

    const totalGPs = gpFeatures.length;
    const gpsWithBuildings = gpLayerState.gpsWithBuildings.size;

    console.log(`GP Analysis: ${gpsWithBuildings}/${totalGPs} GPs have buildings`);

    if (totalGPs > 0) {
        showNotification(
            `Analysis Complete: ${gpsWithBuildings} of ${totalGPs} Gram Panchayats have buildings (${((gpsWithBuildings / totalGPs) * 100).toFixed(1)}%)`,
            'success',
            5000
        );
    }
}

// ==================== UPDATE GP LEGEND ====================
function updateGPLegend() {
    const existingLegendItems = getCustomLegendItems();

    const filteredItems = existingLegendItems.filter(item =>
        !item.label.includes('GPs with Buildings') &&
        !item.label.includes('Gram Panchayat Boundaries')
    );

    const newLegendItems = [
        ...filteredItems,
        {
            color: '#10b981',
            label: 'GPs with Buildings',
            shape: 'polygon'
        },
        {
            color: '#6b7280',
            label: 'GPs without Buildings',
            shape: 'polygon'
        }
    ];

    setCustomLegendItems(newLegendItems);
    updateLegend();
}

// ==================== REMOVE GP LAYER ====================
export function removeGPAnalysisLayer() {
    if (gpLayerState.wmsLayer && mapState.instance) {
        mapState.instance.removeLayer(gpLayerState.wmsLayer);
        gpLayerState.wmsLayer = null;
    }

    if (gpLayerState.coverageLayer && mapState.instance) {
        mapState.instance.removeLayer(gpLayerState.coverageLayer);
    }

    gpLayerState.gpsWithBuildings.clear();
    gpLayerState.allGPs.clear();

    if (gpLayerState.coverageSource) {
        gpLayerState.coverageSource.clear();
    }

    const existingLegendItems = getCustomLegendItems();
    const filteredItems = existingLegendItems.filter(item =>
        !item.label.includes('GPs with Buildings') &&
        !item.label.includes('GPs without Buildings') &&
        !item.label.includes('Gram Panchayat Boundaries')
    );
    setCustomLegendItems(filteredItems);
    updateLegend();
}

// ==================== WMS LAYER SETUP ====================
export function createBuildingWMSLayer() {
    if (buildingState.buildingLayer) {
        return buildingState.buildingLayer;
    }

    buildingState.buildingLayer = new ImageLayer({
        title: 'Government Buildings',
        source: new ImageWMS({
            url: 'https://cggis.cgstate.gov.in:8443/geoserver/CGCOG_DATABASE/wms',
            params: {
                'LAYERS': 'CGCOG_DATABASE:Government_Buildings',
                'FORMAT': 'image/png',
                'TRANSPARENT': true,
                'STYLES': '',
                'VERSION': '1.1.0'
            },
            serverType: 'geoserver',
            crossOrigin: 'anonymous',
        }),
        visible: false,
        zIndex: 100
    });

    return buildingState.buildingLayer;
}

// ==================== BUILDING DATA FETCH ====================
export async function fetchBuildingData(departmentId = null, searchTerm = 'महतारी', districtName = '') {
    buildingState.loading = true;

    try {
        const wfsUrl = 'https://cggis.cgstate.gov.in/giscg/wmscgcog';

        const filters = [];
        if (departmentId) filters.push(`gb_id LIKE '${departmentId}%'`);
        if (searchTerm)   filters.push(`name_building LIKE '%${searchTerm}%'`);
        if (districtName) filters.push(`dist_name = '${districtName}'`);
        const cqlFilter = filters.join(' AND ');

        const params = new URLSearchParams({
            service: 'WFS',
            version: '1.1.0',
            request: 'GetFeature',
            typeName: 'CGCOG_DATABASE:Government_Buildings',
            outputFormat: 'application/json',
            srsName: 'EPSG:4326'
        });

        if (cqlFilter) {
            params.append('CQL_FILTER', cqlFilter);
        }

        const response = await fetch(`${wfsUrl}?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch building data');
        }

        const data = await response.json();
        buildingState.filteredBuildings = data.features || [];
        buildingState.loading = false;

        return data;
    } catch (error) {
        console.error('Error fetching building data:', error);
        buildingState.loading = false;
        showNotification('Failed to fetch building data', 'error');
        throw error;
    }
}

// ==================== VECTOR LAYER FOR HIGHLIGHTS ====================
export function createBuildingVectorLayer() {
    if (buildingState.buildingSource) {
        return;
    }

    buildingState.buildingSource = new VectorSource();

    const buildingStyle = new Style({
        image: new Circle({
            radius: 8,
            fill: new Fill({ color: '#ef4444' }),
            stroke: new Stroke({
                color: '#ffffff',
                width: 2
            })
        }),
        stroke: new Stroke({
            color: '#ef4444',
            width: 3
        }),
        fill: new Fill({
            color: 'rgba(239, 68, 68, 0.2)'
        }),
        text: new Text({
            font: '12px Arial',
            fill: new Fill({ color: '#000' }),
            stroke: new Stroke({
                color: '#fff',
                width: 3
            }),
            offsetY: -15
        })
    });

    const vectorLayer = new VectorLayer({
        source: buildingState.buildingSource,
        style: function(feature) {
            const clone = buildingStyle.clone();
            const name = feature.get('name_building') || '';
            clone.getText().setText(name.length > 30 ? name.substring(0, 30) + '...' : name);
            return clone;
        },
        zIndex: 110,
        name: 'building-highlights'
    });

    if (mapState.instance) {
        mapState.instance.addLayer(vectorLayer);
        setupBuildingClickListener();
    }
}

// ==================== DISPLAY BUILDINGS ON MAP ====================
export function displayBuildingsOnMap(geojsonData) {
    if (!buildingState.buildingSource) {
        createBuildingVectorLayer();
    }

    buildingState.buildingSource.clear();

    if (!geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
        showNotification('No buildings found', 'warning');
        return;
    }

    try {
        const format = new GeoJSON();
        const features = format.readFeatures(geojsonData, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });

        buildingState.buildingSource.addFeatures(features);

        if (features.length > 0) {
            const extent = buildingState.buildingSource.getExtent();
            mapState.instance.getView().fit(extent, {
                padding: [50, 50, 50, 50],
                duration: 1000,
                maxZoom: 16
            });
        }

        showNotification(`Found ${features.length} building(s)`, 'success');
    } catch (error) {
        console.error('Error displaying buildings:', error);
        showNotification('Error displaying buildings on map', 'error');
    }
}

// ==================== POPULATE DEPARTMENT DROPDOWN ====================
export function populateDepartmentDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    dropdown.innerHTML = '<option value="">Loading departments...</option>';
    dropdown.disabled = true;

    loadDepartments()
        .then(departments => {
            dropdown.innerHTML = '<option value="">-- Select Department --</option>';
            
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.id;
                option.textContent = dept.name;
                dropdown.appendChild(option);
            });

            dropdown.disabled = false;
        })
        .catch(error => {
            console.error('Error populating departments:', error);
            dropdown.innerHTML = '<option value="">Error loading departments</option>';
            showNotification('Failed to load departments', 'error');
        });
}

// ==================== SEARCH BUILDINGS ====================
export async function searchBuildings(departmentId, searchTerm, onProgress = null, districtCode = '', districtName = '') {
    if (!departmentId && !searchTerm && !districtCode) {
        showNotification('Please select a district, department or search term', 'warning');
        return;
    }

    const progress = (pct, label) => {
        if (typeof onProgress === 'function') onProgress(pct, label);
    };

    try {
        progress(10, 'Fetching buildings...');
        showNotification('Searching buildings...', 'info');

        const data = await fetchBuildingData(departmentId, searchTerm, districtName);
        progress(35, 'Displaying buildings on map...');

        displayBuildingsOnMap(data);
        progress(50, 'Updating results list...');

        updateBuildingResults(data.features || []);

        // Load GP (Gram Panchayat) WMS layer and perform spatial analysis
        if (data.features && data.features.length > 0) {
            progress(60, 'Loading Gram Panchayat boundaries...');
            await loadGPLayer(data.features, districtCode);
            progress(80, 'Analyzing GP coverage...');
            analyzeGPWithBuildings(data.features);
            progress(100, 'Complete!');
        } else {
            progress(100, 'Complete!');
        }

        // Add Government Buildings to legend
        if (data.features && data.features.length > 0) {
            const existingLegendItems = getCustomLegendItems();

            const hasGovBuilding = existingLegendItems.some(item =>
                item.label === 'Government Buildings'
            );

            if (!hasGovBuilding) {
                const newLegendItems = [
                    ...existingLegendItems,
                    {
                        color: '#ef4444',
                        label: 'Government Buildings',
                        shape: 'circle'
                    }
                ];
                setCustomLegendItems(newLegendItems);
                updateLegend();
            }
        }

        return data;
    } catch (error) {
        console.error('Error searching buildings:', error);
        showNotification('Failed to search buildings', 'error');
    }
}

// ==================== UPDATE RESULTS DISPLAY ====================
export function updateBuildingResults(buildings) {
    const resultsContainer = document.getElementById('building-results');
    const countBadge = document.getElementById('building-count');

    if (!resultsContainer) return;

    if (countBadge) {
        countBadge.textContent = `${buildings.length} building${buildings.length !== 1 ? 's' : ''}`;
    }

    if (buildings.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="mb-3">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-muted">
                        <path d="M3 21h18M3 7v14M21 7v14M9 7h6M9 11h6M9 15h6M9 19h6M5 3h14l2 4H3l2-4z"/>
                    </svg>
                </div>
                <p class="mb-0 text-muted">No buildings found</p>
                <small class="text-muted">Try selecting a different department or search term</small>
            </div>
        `;
        return;
    }

    let html = '<div class="building-results-list">';
    
    buildings.forEach((feature, index) => {
        const props = feature.properties || {};
        const gbId = props.gb_id || 'N/A';
        const name = props.name_building || 'Unnamed Building';
        const distName = props.dist_name || 'N/A';
        const tehsilName = props.tehsil_name || 'N/A';
        const type = props.type_building || 'N/A';
        const yearComm = props.year_comm || 'N/A';

        html += `
            <div class="building-result-item" data-index="${index}">
                <div class="building-item-header">
                    <div class="building-item-number">${index + 1}</div>
                    <h6 class="building-item-title">${name}</h6>
                </div>
                <div class="building-item-details">
                    <div class="building-detail-row">
                        <span class="detail-label">Building ID:</span>
                        <span class="detail-value">${gbId}</span>
                    </div>
                    <div class="building-detail-row">
                        <span class="detail-label">Type:</span>
                        <span class="detail-value">${type}</span>
                    </div>
                    <div class="building-detail-row">
                        <span class="detail-label">District:</span>
                        <span class="detail-value">${distName}</span>
                    </div>
                    <div class="building-detail-row">
                        <span class="detail-label">Tehsil:</span>
                        <span class="detail-value">${tehsilName}</span>
                    </div>
                    <div class="building-detail-row">
                        <span class="detail-label">Year:</span>
                        <span class="detail-value">${yearComm}</span>
                    </div>
                </div>
                <div class="building-item-actions">
                    <button class="btn btn-sm btn-primary zoom-to-building" data-index="${index}">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                        </svg>
                        Zoom To
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    resultsContainer.innerHTML = html;

    // Add click listeners for zoom buttons
    document.querySelectorAll('.zoom-to-building').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            zoomToBuilding(index);
        });
    });
}

// ==================== ZOOM TO BUILDING ====================
export function zoomToBuilding(index) {
    const features = buildingState.buildingSource.getFeatures();
    if (features && features[index]) {
        const feature = features[index];
        const geometry = feature.getGeometry();
        
        if (geometry) {
            mapState.instance.getView().fit(geometry, {
                padding: [100, 100, 100, 100],
                duration: 1000,
                maxZoom: 18
            });

            // Highlight the selected building
            feature.setStyle(new Style({
                image: new Circle({
                    radius: 10,
                    fill: new Fill({ color: '#22c55e' }),
                    stroke: new Stroke({
                        color: '#ffffff',
                        width: 3
                    })
                }),
                stroke: new Stroke({
                    color: '#22c55e',
                    width: 4
                }),
                fill: new Fill({
                    color: 'rgba(34, 197, 94, 0.3)'
                })
            }));

            // Reset style after 3 seconds
            setTimeout(() => {
                feature.setStyle(null);
            }, 3000);
        }
    }
}

// ==================== CLEAR RESULTS ====================
export function clearBuildingResults() {
    if (buildingState.buildingSource) {
        buildingState.buildingSource.clear();
    }

    buildingState.filteredBuildings = [];
    buildingState.selectedDepartment = null;

    // Remove GP analysis layer
    removeGPAnalysisLayer();

    const resultsContainer = document.getElementById('building-results');
    const countBadge = document.getElementById('building-count');

    if (countBadge) {
        countBadge.textContent = '0 buildings';
    }

    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="mb-3">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-muted">
                        <path d="M3 21h18M3 7v14M21 7v14M9 7h6M9 11h6M9 15h6M9 19h6M5 3h14l2 4H3l2-4z"/>
                    </svg>
                </div>
                <p class="mb-0 text-muted">No results to display</p>
                <small class="text-muted">Select a department and search to begin</small>
            </div>
        `;
    }

    // Remove ALL building-related legends
    const existingLegendItems = getCustomLegendItems();
    const filteredLegendItems = existingLegendItems.filter(item =>
        item.label !== 'Government Buildings' &&
        item.label !== 'All Government Buildings (WMS)' &&
        !item.label.includes('Villages with Buildings') &&
        !item.label.includes('Villages without Buildings') &&
        !item.label.includes('GPs with Buildings') &&
        !item.label.includes('GPs without Buildings') &&
        !item.label.includes('Gram Panchayat Boundaries')
    );
    setCustomLegendItems(filteredLegendItems);
    updateLegend();

    showNotification('Results cleared', 'info');
}

// ==================== GP COVERAGE DATA FOR REPORT ====================
export function getGPCoverageData(districtName = '') {
    const gpFeatures = gpLayerState.coverageSource?.getFeatures() || [];
    const covered = [];
    const uncovered = [];

    gpFeatures.forEach(f => {
        const gpNameRaw = f.get('gp_nam') || f.get('gp_name') || '-';

        // Tehsil: join via teh_cod from tehsilMap (cg_tehsil_boundary)
        const tehCod = f.get('teh_cod');
        const tehsil = (tehCod && gpLayerState.tehsilMap.get(String(tehCod)))
            || f.get('teh_e') || f.get('teh_nam') || '-';

        const district = districtName || f.get('dist_nam') || f.get('dist_e') || '-';

        if (gpLayerState.gpsWithBuildings.has(f)) {
            // Get buildings from gpBuildingMap (spatial match, reliable)
            const bList = gpLayerState.gpBuildingMap.get(f) || [];
            covered.push({
                name: gpNameRaw,
                buildings: bList.length ? bList.map(b => b.name).join(' | ') : '-',
                district: bList[0]?.district || district,
                tehsil: bList[0]?.tehsil !== '-' ? bList[0].tehsil : tehsil
            });
        } else {
            uncovered.push({
                name: gpNameRaw,
                buildings: '-',
                district,
                tehsil
            });
        }
    });

    return { covered, uncovered };
}

// ==================== EXPORT BUILDING DATA ====================
export function exportBuildingAsExcel() {
    if (!buildingState.filteredBuildings || buildingState.filteredBuildings.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }

    try {
        // Prepare data for Excel
        const data = buildingState.filteredBuildings.map((feature, index) => {
            const props = feature.properties || {};
            return {
                'S.No': index + 1,
                'Building ID': props.gb_id || '-',
                'Building Name': props.name_building || '-',
                'District': props.dist_name || '-',
                'Block': props.block_name || '-',
                'Tehsil': props.tehsil_name || '-',
                'Gram Panchayat': props.gram_panchayat_name || '-',
                'Village': props.village_name || '-',
                'Type': props.type_building || '-',
                'Year Commissioned': props.year_comm || '-',
                'Floors': props.floors || '-',
                'Height (m)': props.height || '-',
                'Is Shared': props.is_shared || '-',
                'Use of Building': props.use_of_building || '-',
                'Ownership': props.ownership || '-',
                'Sitting Floor': props.sitting_floor || '-',
                'Area Type': props.area_typ || '-',
                'Pin Code': props.pincode || '-',
                'Address': props.address || '-',
                'UID': props.uid || '-',
                'Floors Covered by Office': props.floors_covered_by_office || '-'
            };
        });

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(data);

        // Set column widths
        const colWidths = [
            { wch: 6 },  // S.No
            { wch: 18 }, // Building ID
            { wch: 35 }, // Building Name
            { wch: 15 }, // District
            { wch: 15 }, // Block
            { wch: 15 }, // Tehsil
            { wch: 20 }, // Gram Panchayat
            { wch: 20 }, // Village
            { wch: 18 }, // Type
            { wch: 12 }, // Year
            { wch: 8 },  // Floors
            { wch: 10 }, // Height
            { wch: 10 }, // Is Shared
            { wch: 20 }, // Use
            { wch: 15 }, // Ownership
            { wch: 12 }, // Sitting Floor
            { wch: 12 }, // Area Type
            { wch: 10 }, // Pin Code
            { wch: 40 }, // Address
            { wch: 15 }, // UID
            { wch: 20 }  // Floors Covered
        ];
        ws['!cols'] = colWidths;

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Buildings');

        // Covered & Uncovered GP sheets
        const selEl = document.getElementById('building-district');
        const selDistName = selEl?.options[selEl.selectedIndex]?.text?.replace('-- All Districts --','').trim() || '';
        const { covered, uncovered } = getGPCoverageData(selDistName);

        const gpSheetData = (list) => list.map((r, i) => ({
            'S.No': i + 1,
            'GP Name': r.name,
            'Building Name(s)': r.buildings,
            'District': r.district,
            'Tehsil': r.tehsil,
            'Block': r.block
        }));

        const wsCovered = XLSX.utils.json_to_sheet(gpSheetData(covered));
        wsCovered['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 50 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsCovered, 'Covered GPs');

        const wsUncovered = XLSX.utils.json_to_sheet(gpSheetData(uncovered));
        wsUncovered['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 50 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsUncovered, 'Uncovered GPs');

        // Generate filename
        const filename = `Building_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Save file
        XLSX.writeFile(wb, filename);

        showNotification('Excel report generated successfully!', 'success');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showNotification('Failed to generate Excel report', 'error');
    }
}

export function exportBuildingAsPDF() {
    if (!buildingState.filteredBuildings || buildingState.filteredBuildings.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4

        // Add title
        doc.setFontSize(18);
        doc.setTextColor(119, 104, 174);
        doc.text('Building Analysis Report', 14, 20);

        // Add metadata
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
        doc.text(`Total Buildings: ${buildingState.filteredBuildings.length}`, 14, 33);

        // Get selected department name
        const deptSelect = document.getElementById('building-department');
        const deptName = deptSelect ? deptSelect.options[deptSelect.selectedIndex]?.text : 'All Departments';
        if (deptName && deptName !== '-- Select Department --') {
            doc.text(`Department: ${deptName}`, 14, 38);
        }

        // Prepare table data
        const tableData = buildingState.filteredBuildings.map((feature, index) => {
            const props = feature.properties || {};
            return [
                index + 1,
                props.gb_id || '-',
                props.name_building || '-',
                props.dist_name || '-',
                props.tehsil_name || '-',
                props.village_name || '-',
                props.type_building || '-',
                props.year_comm || '-'
            ];
        });

        // Add table
        doc.autoTable({
            startY: 45,
            head: [['#', 'Building ID', 'Building Name', 'District', 'Tehsil', 'Village', 'Type', 'Year']],
            body: tableData,
            theme: 'grid',
            styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: 'linebreak'
            },
            headStyles: {
                fillColor: [119, 104, 174],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 30 },
                2: { cellWidth: 60 },
                3: { cellWidth: 30 },
                4: { cellWidth: 30 },
                5: { cellWidth: 35 },
                6: { cellWidth: 35 },
                7: { cellWidth: 20, halign: 'center' }
            },
            margin: { left: 14, right: 14 },
            didDrawPage: function (data) {
                // Footer
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(
                    `Page ${data.pageNumber} of ${pageCount}`,
                    doc.internal.pageSize.width / 2,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                );
            }
        });

        // Covered & Uncovered GP tables
        const selEl = document.getElementById('building-district');
        const selDistName = selEl?.options[selEl.selectedIndex]?.text?.replace('-- All Districts --','').trim() || '';
        const { covered, uncovered } = getGPCoverageData(selDistName);

        const gpRows = (list) => list.map((r, i) => [i + 1, r.name, r.buildings, r.district, r.tehsil]);

        if (covered.length > 0) {
            doc.addPage();
            doc.setFontSize(14);
            doc.setTextColor(16, 185, 129);
            doc.text(`Covered Gram Panchayats (${covered.length})`, 14, 18);
            doc.autoTable({
                startY: 24,
                head: [['#', 'GP Name', 'Building Name(s)', 'District', 'Tehsil']],
                body: gpRows(covered),
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 45 }, 2: { cellWidth: 90 }, 3: { cellWidth: 35 }, 4: { cellWidth: 35 } },
                margin: { left: 14, right: 14 }
            });
        }

        if (uncovered.length > 0) {
            doc.addPage();
            doc.setFontSize(14);
            doc.setTextColor(107, 114, 128);
            doc.text(`Uncovered Gram Panchayats (${uncovered.length})`, 14, 18);
            doc.autoTable({
                startY: 24,
                head: [['#', 'GP Name', 'Building Name(s)', 'District', 'Tehsil']],
                body: gpRows(uncovered),
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                headStyles: { fillColor: [107, 114, 128], textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 45 }, 2: { cellWidth: 90 }, 3: { cellWidth: 35 }, 4: { cellWidth: 35 } },
                margin: { left: 14, right: 14 }
            });
        }

        // Generate filename
        const filename = `Building_Report_${new Date().toISOString().split('T')[0]}.pdf`;

        // Save PDF
        doc.save(filename);

        showNotification('PDF report generated successfully!', 'success');
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        showNotification('Failed to generate PDF report. Please ensure required libraries are loaded.', 'error');
    }
}

// ==================== TOGGLE WMS LAYER ====================
export function toggleBuildingLayer(show) {
    if (!buildingState.buildingLayer) {
        createBuildingWMSLayer();
        if (mapState.instance) {
            mapState.instance.addLayer(buildingState.buildingLayer);
        }
    }

    if (buildingState.buildingLayer) {
        buildingState.buildingLayer.setVisible(show);
    }
}



// ==================== SETUP MAP CLICK LISTENER ====================
export function setupBuildingClickListener() {
    if (!mapState.instance) {
        console.warn('Map instance not available');
        return;
    }

    // Add click event to map
    mapState.instance.on('singleclick', function(evt) {
        // Check if we clicked on a building feature
        const feature = mapState.instance.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
            // Only handle building highlights layer
            if (layer && layer.get('name') === 'building-highlights') {
                return feature;
            }
        });

        if (feature) {
            showBuildingDetails(feature);
        }
    });

    // Change cursor on hover
    mapState.instance.on('pointermove', function(evt) {
        const pixel = evt.pixel;
        const hit = mapState.instance.hasFeatureAtPixel(pixel, {
            layerFilter: function(layer) {
                return layer.get('name') === 'building-highlights';
            }
        });
        
        mapState.instance.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });
}

// ==================== SHOW BUILDING DETAILS IN MODAL ====================
export function showBuildingDetails(feature) {
    if (!feature) return;

    const props = feature.getProperties();
    
    // Update modal fields
    document.getElementById('detail-building-id').textContent = props.gb_id || '-';
    document.getElementById('detail-building-name').textContent = props.name_building || '-';
    document.getElementById('detail-type').textContent = props.type_building || '-';
    document.getElementById('detail-ownership').textContent = props.ownership || '-';
    document.getElementById('detail-village').textContent = props.village_name || '-';
    document.getElementById('detail-tehsil').textContent = props.tehsil_name || '-';
    document.getElementById('detail-district').textContent = props.dist_name || '-';
    document.getElementById('detail-year').textContent = props.year_comm || '-';
    document.getElementById('detail-floors').textContent = props.floors || '-';
    document.getElementById('detail-use').textContent = props.use_of_building || '-';
    document.getElementById('detail-address').textContent = props.address || '-';

    // Show modal
    const detailsModal = new bootstrap.Modal(document.getElementById('buildingDetailsModal'));
    detailsModal.show();
}