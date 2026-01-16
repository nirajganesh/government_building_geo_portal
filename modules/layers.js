import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import LayerGroup from 'ol/layer/Group';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import ImageWMS from 'ol/source/ImageWMS';

import { 
    API_CONFIG, 
    LAYER_CONFIGS, 
    mapState, 
    layerState, 
    saveActiveLayerState, 
    showNotification
} from '../main.js';

// ==================== WMS LAYER CREATION ====================
export function createWMSLayer(layerName, title = '', minZoom = null) {
    return new ImageLayer({
        title: title,
        minZoom: minZoom,
        source: new ImageWMS({
            url: API_CONFIG.adminUrl,
            params: {
                'LAYERS': `CGCOG_DATABASE:${layerName}`,
                'FORMAT': 'image/png',
                'TRANSPARENT': true,
                'STYLES': '',
                'VERSION': '1.1.1'
            },
            serverType: "geoserver",
            crossOrigin: "anonymous",
        }),
    });
}

export function initializeWMSLayers() {
    LAYER_CONFIGS.forEach(config => {
        layerState.storage[config.id] = createWMSLayer(config.wms, config.name, config.minZoom);
        layerState.names[config.id] = config.name;
        layerState.wmsMapping[config.id] = config.wms;
    });
}

export function toggleLayer(layerId, toggleElement) {
    if (!toggleElement || !layerId) return;

    toggleElement.classList.toggle('active');
    const isActive = toggleElement.classList.contains('active');

    if (isActive) {
        layerState.active.add(layerId);
    } else {
        layerState.active.delete(layerId);
    }

    const layer = layerState.storage[layerId];
    if (!layer || !mapState.instance) return;

    try {
        if (isActive) {
            const existingLayers = mapState.instance.getLayers().getArray();
            const layerExists = existingLayers.includes(layer);
            if (!layerExists) {
                mapState.instance.addLayer(layer);
            }
        } else {
            mapState.instance.removeLayer(layer);
        }
    } catch (error) {
        console.error('Error toggling layer:', error);
    }

    updateLegend();
    
    if (isActive && !mapState.legendOpen && layerState.active.size > 0) {
        toggleLegend();
    }
    
    if (!isActive && mapState.legendOpen && layerState.active.size === 0) {
        toggleLegend();
    }

    saveActiveLayerState();
}

// ==================== BASEMAP MANAGEMENT ====================
export function initializeBasemaps() {
    mapState.basemapLayers = {
        osm: new TileLayer({
            source: new OSM(),
            visible: true
        }),
        satellite: new TileLayer({
            source: new XYZ({
                url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
                attributions: '© Google Satellite'
            }),
            visible: false
        }),
        terrain: new TileLayer({
            source: new XYZ({
                url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
                attributions: 'Map data: © OpenStreetMap contributors'
            }),
            visible: false
        }),
        hybrid: new LayerGroup({
            layers: [
                new TileLayer({
                    source: new XYZ({
                        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                        attributions: 'Tiles © Esri'
                    })
                }),
                new TileLayer({
                    source: new XYZ({
                        url: 'https://stamen-tiles.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}.png',
                        attributions: 'Map labels by Stamen Design'
                    }),
                    opacity: 0.8
                })
            ],
            visible: false
        })
    };
}

export function switchBasemap(basemapType) {
    if (!mapState.instance || !mapState.basemapLayers) return;

    try {
        Object.keys(mapState.basemapLayers).forEach(key => {
            if (mapState.basemapLayers[key]?.setVisible) {
                mapState.basemapLayers[key].setVisible(false);
            }
        });

        if (mapState.basemapLayers[basemapType]?.setVisible) {
            mapState.basemapLayers[basemapType].setVisible(true);
            mapState.currentBasemap = basemapType;
            showNotification(`Switched to ${basemapType.charAt(0).toUpperCase() + basemapType.slice(1)} basemap`, 'success');
        }
    } catch (error) {
        console.error('Error switching basemap:', error);
    }
}

export function restoreActiveLayerState() {
    try {
        const saved = localStorage.getItem('activeMapLayers');
        let layerIds = saved ? JSON.parse(saved) : ['cg_dist'];

        layerIds.forEach(layerId => {
            if (layerState.storage[layerId]) {
                layerState.active.add(layerId);

                const existingLayers = mapState.instance.getLayers().getArray();
                const layerExists = existingLayers.includes(layerState.storage[layerId]);

                if (!layerExists) {
                    mapState.instance.addLayer(layerState.storage[layerId]);
                }

                const toggle = document.querySelector(`[data-layer="${layerId}"]`);
                if (toggle) {
                    toggle.classList.add('active');
                }
            }
        });
    } catch (error) {
        console.warn('Could not restore layer state:', error);
    }
}

// ==================== LEGEND MANAGEMENT ====================
export function toggleLegend() {
    const legendPanel = document.getElementById('legend-panel');
    const legendToggle = document.getElementById('legend-toggle');

    mapState.legendOpen = !mapState.legendOpen;

    if (mapState.legendOpen) {
        legendPanel?.classList.add('open');
        if (legendToggle) legendToggle.classList.add('active');
        updateLegend();
    } else {
        legendPanel?.classList.remove('open');
        if (legendToggle) legendToggle.classList.remove('active');
    }

    const event = new CustomEvent('legendToggled');
    window.dispatchEvent(event);
}

// Store custom legend items
let customLegendItems = [];

export function getCustomLegendItems() {
    return [...customLegendItems];
}

export function setCustomLegendItems(items) {
    customLegendItems = items;
}

export function clearCustomLegendItems() {
    customLegendItems = [];
}

// Function to handle legend item removal
export function removeLegendItem(layerId, isCustomLegend = false, customIndex = null) {
    if (isCustomLegend && customIndex !== null) {
        customLegendItems.splice(customIndex, 1);
        updateLegend();
        return;
    }
    
    // Remove WMS layer
    if (layerState.storage[layerId]) {
        layerState.active.delete(layerId);
        
        if (mapState.instance) {
            mapState.instance.removeLayer(layerState.storage[layerId]);
        }
        
        const checkbox = document.querySelector(`.layer-checkbox[value="${layerId}"]`);
        if (checkbox) {
            checkbox.checked = false;
        }
        
        updateLegend();
        saveActiveLayerState();
    }
}

export function updateLegend() {    
    const legendContent = document.getElementById('legend-content');
    if (!legendContent) return;

    const totalLayers = layerState.active.size;
    const hasCustomLegend = customLegendItems.length > 0;

    if (totalLayers === 0 && !hasCustomLegend) {
        legendContent.innerHTML = `
            <div class="no-legend">
                <p>No active layers selected</p>
                <p>Enable layers to view their legends</p>
            </div>
        `;
        return;
    }

    let legendHTML = '';
    
    const allLegendItems = [];
    
    // Add custom legend items
    if (hasCustomLegend) {
        const seenLabels = new Set();
        customLegendItems.forEach((item, index) => {
            const normalizedLabel = item.label.toLowerCase();
            if (normalizedLabel.includes('district') && normalizedLabel.includes('boundary')) {
                if (seenLabels.has('district_boundary')) {
                    return;
                }
                seenLabels.add('district_boundary');
            }
            
            allLegendItems.push({
                type: 'custom',
                data: item,
                index: index
            });
        });
    }
    
    // Add WMS layer legends
    if (totalLayers > 0) {
        layerState.active.forEach(layerId => {
            const layerName = layerState.names[layerId] || layerId;
            const wmsLayerName = layerState.wmsMapping[layerId] || layerId;

            allLegendItems.push({
                type: 'wms',
                layerId: layerId,
                layerName: layerName,
                wmsLayerName: wmsLayerName
            });
        });
    }

    if (allLegendItems.length === 0) {
        legendContent.innerHTML = `
            <div class="no-legend">
                <p>No active layers selected</p>
                <p>Enable layers to view their legends</p>
            </div>
        `;
        return;
    }

    legendHTML += '<div class="unified-legend-section">';
    
    allLegendItems.forEach(item => {
        if (item.type === 'custom') {
            legendHTML += createCustomLegendItemWithClose(
                item.data.color, 
                item.data.label, 
                item.data.shape, 
                item.index
            );
        } else {
            legendHTML += `
                <div class="legend-item" style="position: relative; margin-bottom: 12px;">
                    <button class="legend-close-btn" onclick="window.removeLegendItem('${item.layerId}')" 
                        title="Remove ${item.layerName}" 
                        style="position: absolute; top: 5px; right: 5px; background: grey; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 20px; line-height: 1; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; z-index: 10;">
                        ×
                    </button>
                    <h5 style="padding-right: 25px; font-size: 13px; font-weight: 600; margin-bottom: 8px;">${item.layerName}</h5>
                    <img class="legend-image" 
                        src="${API_CONFIG.adminUrl}?service=WMS&version=1.1.1&request=GetLegendGraphic&layer=CGCOG_DATABASE:${item.wmsLayerName}&format=image/png" 
                        crossorigin="anonymous"
                        alt="${item.layerName} Legend" 
                        style="max-width: 100%; height: auto;"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <p style="display:none; color: #64748b; font-style: italic; font-size: 12px;">Legend not available for ${item.layerName}</p>
                </div>
            `;
        }
    });
    
    legendHTML += '</div>';

    legendContent.innerHTML = legendHTML;
}

// Create custom legend item with close button
export function createCustomLegendItemWithClose(color, label, shape, index) {
    let shapeHTML = '';
    
    if (shape === 'circle') {
        shapeHTML = `<div style="width: 12px; height: 12px; background-color: ${color}; border-radius: 50%; border: 1px solid rgba(0,0,0,0.2);"></div>`;
    } else if (shape === 'polygon') {
        shapeHTML = `<div style="width: 16px; height: 12px; background-color: ${color}; border: 2px solid rgba(0,0,0,0.3); opacity: 0.6;"></div>`;
    } else if (shape === 'line') {
        shapeHTML = `<div style="width: 20px; height: 2px; background-color: ${color};"></div>`;
    } else if (shape === 'boundary') {
        shapeHTML = `<div style="width: 20px; height: 12px; border: 2px dashed ${color}; background: transparent;"></div>`;
    } else {
        shapeHTML = `<div style="width: 12px; height: 12px; background-color: ${color}; border: 1px solid rgba(0,0,0,0.2);"></div>`;
    }
    
    return `
        <div class="custom-legend-item" style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 4px; background: #f8f9fa; margin-bottom: 8px; position: relative;">
            <button class="legend-close-btn" onclick="window.removeCustomLegendItem(${index})" 
                title="Remove ${label}"
                style="position: absolute; top: 4px; right: 4px; background: grey; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 18px; line-height: 1; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; z-index: 10;">
                ×
            </button>
            ${shapeHTML}
            <span style="font-size: 13px; color: #374151; padding-right: 25px; font-weight: 500;">${label}</span>
        </div>
    `;
}

// Expose functions to window for onclick handlers
if (typeof window !== 'undefined') {
    window.removeLegendItem = removeLegendItem;
    window.removeCustomLegendItem = function(index) {
        removeLegendItem(null, true, index);
    };
}

export { layerState, API_CONFIG };