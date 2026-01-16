// ============================================================================
// MEASUREMENT SYSTEM - ES6 MODULE FORMAT
// ============================================================================

// Core OpenLayers
import Overlay from 'ol/Overlay';

// Layers
import VectorLayer from 'ol/layer/Vector';

// Sources
import VectorSource from 'ol/source/Vector';

// Geometries
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Polygon } from 'ol/geom';
import { LineString } from 'ol/geom';

// Styles
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';

// Interactions
import { Draw, Modify, Snap } from 'ol/interaction';

// Utilities
import { fromLonLat, toLonLat } from 'ol/proj';
import { getArea, getLength } from 'ol/sphere';
import { unByKey } from 'ol/Observable';

import { getMap, showNotification } from '../main.js';

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================

let measurementSource = new VectorSource();
let measurementLayer = new VectorLayer({
    source: measurementSource,
    style: getMeasurementStyle,
    zIndex: 200
});

let sketchSource = new VectorSource();
let sketchLayer = new VectorLayer({
    source: sketchSource,
    style: getSketchStyle,
    zIndex: 201
});

let draw = null;
let modify = null;
let snap = null;
let sketch = null;
let helpTooltipElement = null;
let helpTooltip = null;
let measureTooltipElement = null;
let measureTooltip = null;
let listener = null;

let currentMeasurementType = 'distance';
let currentUnits = 'km';
let measurementCount = 0;
let measurements = [];

const continuePolygonMsg = 'Click to continue drawing the polygon';
const continueLineMsg = 'Click to continue drawing the line';

// ============================================================================
// INITIALIZATION
// ============================================================================

export function initializeMeasurementSystem() {
    const map = getMap();
    if (!map) {
        console.error('Map not initialized yet');
        return;
    }
    
    // Add layers to map
    map.addLayer(measurementLayer);
    map.addLayer(sketchLayer);
    
    // Initialize modify interaction
    initializeModifyInteraction();
    
    console.log('Measurement system initialized successfully');
}

// ============================================================================
// STYLE FUNCTIONS
// ============================================================================

export function getMeasurementStyle(feature) {
    const geometry = feature.getGeometry();
    const type = geometry.getType();
    const measurementType = feature.get('measurementType') || 'distance';
    
    const styles = [];
    
    if (type === 'Polygon' || type === 'LineString') {
        // Main line/polygon style
        styles.push(new Style({
            fill: new Fill({
                color: type === 'Polygon' ? 'rgba(255, 255, 255, 0.2)' : undefined
            }),
            stroke: new Stroke({
                color: measurementType === 'area' ? '#ff6b35' : 
                       measurementType === 'perimeter' ? '#3b82f6' : '#10b981',
                width: 3,
                lineDash: [5, 5]
            }),
            image: new CircleStyle({
                radius: 7,
                fill: new Fill({
                    color: '#fff'
                }),
                stroke: new Stroke({
                    color: measurementType === 'area' ? '#ff6b35' : 
                           measurementType === 'perimeter' ? '#3b82f6' : '#10b981',
                    width: 3
                })
            })
        }));
        
        // Add vertex markers for polygons
        if (type === 'Polygon') {
            const coordinates = geometry.getCoordinates()[0];
            coordinates.slice(0, -1).forEach((coord, index) => {
                styles.push(new Style({
                    geometry: new Point(coord),
                    image: new CircleStyle({
                        radius: 6,
                        fill: new Fill({
                            color: '#fff'
                        }),
                        stroke: new Stroke({
                            color: '#ff6b35',
                            width: 2
                        })
                    }),
                    text: new Text({
                        text: (index + 1).toString(),
                        font: 'bold 12px Arial',
                        fill: new Fill({
                            color: '#ff6b35'
                        })
                    })
                }));
            });
        }
    }
    
    return styles;
}

export function getSketchStyle() {
    return new Style({
        fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new Stroke({
            color: 'rgba(0, 0, 0, 0.5)',
            lineDash: [10, 10],
            width: 2
        }),
        image: new CircleStyle({
            radius: 5,
            stroke: new Stroke({
                color: 'rgba(0, 0, 0, 0.7)'
            }),
            fill: new Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            })
        })
    });
}

// ============================================================================
// INTERACTION FUNCTIONS
// ============================================================================

export function initializeModifyInteraction() {
    const map = getMap();
    if (!map) return;
    
    modify = new Modify({
        source: measurementSource,
        deleteCondition: function(event) {
            return event.originalEvent.shiftKey;
        }
    });
    
    map.addInteraction(modify);
    
    modify.on('modifyend', (evt) => {
        const feature = evt.features.getArray()[0];
        updateMeasurementLabel(feature);
    });
}

export function startMeasurement(type = 'distance', units = 'km') {
    const map = getMap();
    if (!map) {
        showNotification('Map not initialized', 'error');
        return;
    }
    
    currentMeasurementType = type;
    currentUnits = units;
    
    stopMeasurement();
    createHelpTooltip();
    
    let geometryFunction;
    let drawType;
    
    switch (type) {
        case 'distance':
            drawType = 'LineString';
            break;
        case 'area':
            drawType = 'Polygon';
            break;
        case 'perimeter':
            drawType = 'Polygon';
            geometryFunction = createRegularPolygon(32);
            break;
        default:
            drawType = 'LineString';
    }
    
    draw = new Draw({
        source: sketchSource,
        type: drawType,
        geometryFunction: geometryFunction,
        style: getSketchStyle()
    });
    
    map.addInteraction(draw);
    
    snap = new Snap({
        source: measurementSource
    });
    map.addInteraction(snap);
    
    createMeasureTooltip();
    
    let drawListener;
    
    draw.on('drawstart', (evt) => {
        sketch = evt.feature;
        let tooltipCoord = evt.coordinate;
        
        drawListener = sketch.getGeometry().on('change', (evt) => {
            const geom = evt.target;
            let output;
            
            if (geom instanceof Polygon) {
                output = formatArea(geom);
                tooltipCoord = geom.getInteriorPoint().getCoordinates();
            } else if (geom instanceof LineString) {
                output = formatLength(geom);
                tooltipCoord = geom.getLastCoordinate();
            }
            
            measureTooltipElement.innerHTML = output;
            measureTooltip.setPosition(tooltipCoord);
        });
    });
    
    draw.on('drawend', (evt) => {
        handleDrawEnd(evt);
        unByKey(drawListener);
    });
}

export function stopMeasurement() {
    const map = getMap();
    if (!map) return;
    
    if (draw) {
        map.removeInteraction(draw);
        draw = null;
    }
    
    if (snap) {
        map.removeInteraction(snap);
        snap = null;
    }
    
    if (helpTooltip) {
        map.removeOverlay(helpTooltip);
        helpTooltip = null;
    }
    if (helpTooltipElement) {
        if (helpTooltipElement.parentNode) {
            helpTooltipElement.parentNode.removeChild(helpTooltipElement);
        }
        helpTooltipElement = null;
    }
    
    if (measureTooltip) {
        map.removeOverlay(measureTooltip);
        measureTooltip = null;
    }
    if (measureTooltipElement) {
        if (measureTooltipElement.parentNode) {
            measureTooltipElement.parentNode.removeChild(measureTooltipElement);
        }
        measureTooltipElement = null;
    }
    
    sketchSource.clear();
    sketch = null;
    
    if (listener) {
        unByKey(listener);
        listener = null;
    }
    
    const overlays = map.getOverlays().getArray().slice();
    overlays.forEach(overlay => {
        const element = overlay.getElement();
        if (element && (
            element.className.includes('ol-tooltip') ||
            element.className.includes('measurement-tooltip')
        )) {
            map.removeOverlay(overlay);
        }
    });
    
    document.body.classList.remove('measurement-active');
}

export function clearAllMeasurements() {
    const map = getMap();
    if (!map) return;
    
    stopMeasurement();
    
    measurementSource.clear();
    sketchSource.clear();
    
    const overlays = map.getOverlays().getArray().slice();
    overlays.forEach(overlay => {
        const element = overlay.getElement();
        if (element && (
            element.className.includes('ol-tooltip') ||
            element.className.includes('measurement') ||
            element.dataset.measurementId
        )) {
            map.removeOverlay(overlay);
        }
    });
    
    measurements = [];
    measurementCount = 0;
    
    updateResultsDisplay();
    updateMeasurementStats();
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Measurements Cleared!',
            text: 'All measurements removed. You can now use other map tools.',
            icon: 'info',
            timer: 1500,
            showConfirmButton: false
        });
    }
}

// ============================================================================
// TOOLTIP FUNCTIONS
// ============================================================================

export function createHelpTooltip() {
    const map = getMap();
    if (!map) return;
    
    if (helpTooltipElement) {
        if (helpTooltipElement.parentNode) {
            helpTooltipElement.parentNode.removeChild(helpTooltipElement);
        }
        helpTooltipElement = null;
    }
    
    if (helpTooltip) {
        map.removeOverlay(helpTooltip);
        helpTooltip = null;
    }
    
    helpTooltipElement = document.createElement('div');
    helpTooltipElement.className = 'ol-tooltip hidden';
    
    helpTooltip = new Overlay({
        element: helpTooltipElement,
        offset: [15, 0],
        positioning: 'center-left'
    });
    
    map.addOverlay(helpTooltip);
}

export function createMeasureTooltip() {
    const map = getMap();
    if (!map) return;
    
    if (measureTooltipElement) {
        if (measureTooltipElement.parentNode) {
            measureTooltipElement.parentNode.removeChild(measureTooltipElement);
        }
        measureTooltipElement = null;
    }
    
    if (measureTooltip) {
        map.removeOverlay(measureTooltip);
        measureTooltip = null;
    }
    
    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
    
    measureTooltip = new Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center',
        stopEvent: false,
        insertFirst: false
    });
    
    map.addOverlay(measureTooltip);
}

// ============================================================================
// MEASUREMENT CALCULATION FUNCTIONS
// ============================================================================

export function formatLength(line) {
    const length = getLength(line);
    let output;
    
    switch (currentUnits) {
        case 'm':
            if (length > 100) {
                output = Math.round((length) * 100) / 100 + ' m';
            } else {
                output = Math.round(length * 100) / 100 + ' m';
            }
            break;
        case 'km':
            if (length > 1000) {
                output = Math.round((length / 1000) * 100) / 100 + ' km';
            } else {
                output = Math.round(length * 100) / 100 + ' m';
            }
            break;
        case 'mi':
            const miles = length * 0.000621371;
            if (miles > 1) {
                output = Math.round(miles * 100) / 100 + ' mi';
            } else {
                const feet = length * 3.28084;
                output = Math.round(feet * 100) / 100 + ' ft';
            }
            break;
        default:
            output = Math.round((length / 1000) * 100) / 100 + ' km';
    }
    
    return output;
}

export function formatArea(polygon) {
    const area = getArea(polygon);
    let output;
    
    switch (currentUnits) {
        case 'm':
            if (area > 10000) {
                output = Math.round((area / 1000000) * 100) / 100 + ' km²';
            } else {
                output = Math.round(area * 100) / 100 + ' m²';
            }
            break;
        case 'km':
            if (area > 10000) {
                output = Math.round((area / 1000000) * 100) / 100 + ' km²';
            } else {
                output = Math.round(area * 100) / 100 + ' m²';
            }
            break;
        case 'mi':
            const sqMiles = area * 0.000000386102;
            if (sqMiles > 1) {
                output = Math.round(sqMiles * 100) / 100 + ' mi²';
            } else {
                const acres = area * 0.000247105;
                output = Math.round(acres * 100) / 100 + ' acres';
            }
            break;
        default:
            output = Math.round((area / 1000000) * 100) / 100 + ' km²';
    }
    
    return output;
}

// ============================================================================
// FEATURE HANDLING FUNCTIONS
// ============================================================================

export function handleDrawEnd(evt) {
    const feature = evt.feature;
    const geometry = feature.getGeometry();
    
    feature.set('measurementType', currentMeasurementType);
    feature.set('units', currentUnits);
    feature.set('id', `measurement_${++measurementCount}`);
    
    let measurement = {
        id: measurementCount,
        type: currentMeasurementType,
        units: currentUnits,
        feature: feature,
        geometry: geometry,
        timestamp: new Date()
    };
    
    if (geometry instanceof Polygon) {
        const area = getArea(geometry);
        const perimeter = getLength(new LineString(geometry.getCoordinates()[0]));
        
        measurement.area = area;
        measurement.perimeter = perimeter;
        measurement.areaFormatted = formatArea(geometry);
        measurement.perimeterFormatted = formatLength(new LineString(geometry.getCoordinates()[0]));
        
        feature.set('area', area);
        feature.set('perimeter', perimeter);
    } else if (geometry instanceof LineString) {
        const length = getLength(geometry);
        measurement.length = length;
        measurement.lengthFormatted = formatLength(geometry);
        
        feature.set('length', length);
    }
    
    measurements.push(measurement);
    
    sketchSource.removeFeature(feature);
    measurementSource.addFeature(feature);
    
    createPermanentLabel(feature, measurement);
    updateResultsDisplay();
    
    measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
    measureTooltip.setOffset([0, -7]);
    
    sketch = null;
    measureTooltipElement = null;
    createMeasureTooltip();
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Measurement Added!',
            text: `${currentMeasurementType.charAt(0).toUpperCase() + currentMeasurementType.slice(1)} measurement completed`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    }
}

export function createPermanentLabel(feature, measurement) {
    const geometry = feature.getGeometry();
    let labelCoord;
    let labelText = '';
    
    if (geometry instanceof Polygon) {
        labelCoord = geometry.getInteriorPoint().getCoordinates();
        if (currentMeasurementType === 'area') {
            labelText = `Area: ${measurement.areaFormatted}`;
        } else {
            labelText = `Perimeter: ${measurement.perimeterFormatted}`;
        }
    } else if (geometry instanceof LineString) {
        labelCoord = geometry.getLastCoordinate();
        labelText = `Distance: ${measurement.lengthFormatted}`;
    }
    
    const labelFeature = new Feature({
        geometry: new Point(labelCoord),
        measurementId: measurement.id,
        labelText: labelText
    });
    
    labelFeature.setStyle(new Style({
        text: new Text({
            text: labelText,
            font: 'bold 14px Arial, sans-serif',
            fill: new Fill({
                color: '#000'
            }),
            backgroundFill: new Fill({
                color: 'rgba(255, 255, 255, 0.9)'
            }),
            backgroundStroke: new Stroke({
                color: '#000',
                width: 1
            }),
            padding: [4, 8, 4, 8],
            textAlign: 'center',
            offsetY: -20
        })
    }));
    
    measurementSource.addFeature(labelFeature);
    measurement.labelFeature = labelFeature;
}

export function updateMeasurementLabel(feature) {
    const measurementId = feature.get('id');
    if (!measurementId) return;
    
    const measurement = measurements.find(m => m.id === parseInt(measurementId.split('_')[1]));
    if (!measurement) return;
    
    const geometry = feature.getGeometry();
    let newText = '';
    
    if (geometry instanceof Polygon) {
        const area = getArea(geometry);
        const perimeter = getLength(new LineString(geometry.getCoordinates()[0]));
        
        measurement.area = area;
        measurement.perimeter = perimeter;
        measurement.areaFormatted = formatArea(geometry);
        measurement.perimeterFormatted = formatLength(new LineString(geometry.getCoordinates()[0]));
        
        if (measurement.type === 'area') {
            newText = `Area: ${measurement.areaFormatted}`;
        } else {
            newText = `Perimeter: ${measurement.perimeterFormatted}`;
        }
    } else if (geometry instanceof LineString) {
        const length = getLength(geometry);
        measurement.length = length;
        measurement.lengthFormatted = formatLength(geometry);
        newText = `Distance: ${measurement.lengthFormatted}`;
    }
    
    if (measurement.labelFeature) {
        const labelStyle = measurement.labelFeature.getStyle();
        labelStyle.getText().setText(newText);
        measurement.labelFeature.changed();
    }
    
    updateResultsDisplay();
}

export function removeMeasurement(measurementId) {
    const map = getMap();
    if (!map) return;
    
    const measurement = measurements.find(m => m.id === measurementId);
    if (!measurement) return;
    
    if (measurement.feature) {
        measurementSource.removeFeature(measurement.feature);
    }
    
    if (measurement.labelFeature) {
        measurementSource.removeFeature(measurement.labelFeature);
    }
    
    const overlays = map.getOverlays().getArray().slice();
    overlays.forEach(overlay => {
        const element = overlay.getElement();
        if (element && element.dataset && element.dataset.measurementId === measurementId.toString()) {
            map.removeOverlay(overlay);
        }
    });
    
    measurements = measurements.filter(m => m.id !== measurementId);
    
    updateResultsDisplay();
    updateMeasurementStats();
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Measurement Removed',
            text: `${measurement.type.charAt(0).toUpperCase() + measurement.type.slice(1)} measurement #${measurementId} removed`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    }
}

// ============================================================================
// DISPLAY FUNCTIONS
// ============================================================================

export function updateResultsDisplay() {
    const resultsEl = document.getElementById('measurementResults');
    if (!resultsEl) return;
    
    if (measurements.length === 0) {
        resultsEl.innerHTML = `
            <div class="text-center py-4">
                <div class="mb-3">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-muted">
                        <path d="M3 3v18h18"></path>
                        <path d="m19 9-5 5-4-4-3 3"></path>
                    </svg>
                </div>
                <p class="mb-0 text-muted">No measurements yet</p>
                <small class="text-muted">Click <strong>"Start Measurement"</strong> to begin</small>
            </div>
        `;
        updateMeasurementStats();
        return;
    }
    
    let html = '<div class="measurement-results">';
    
    measurements.forEach((measurement, index) => {
        const typeIcon = measurement.type === 'area' ? '📐' : 
                      measurement.type === 'perimeter' ? '⭕' : '📏';
        
        const statusClass = measurement.type === 'area' ? 'success' : 
                          measurement.type === 'distance' ? 'primary' : 'warning';
        
        html += `
            <div class="measurement-item mb-2 border rounded" data-measurement-id="${measurement.id}">
                <div class="p-2">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="d-flex align-items-center">
                            <span class="badge bg-${statusClass} me-2">#${measurement.id}</span>
                            <h6 class="mb-0">${typeIcon} ${measurement.type.charAt(0).toUpperCase() + measurement.type.slice(1)}</h6>
                        </div>
                        <button class="btn btn-sm btn-outline-danger remove-measurement-btn" 
                                data-measurement-id="${measurement.id}" 
                                title="Remove measurement">
                            ×
                        </button>
                    </div>
        `;
        
        if (measurement.type === 'distance' && measurement.lengthFormatted) {
            html += `
                <div class="measurement-values">
                    <p class="mb-1"><strong class="text-primary">Distance: ${measurement.lengthFormatted}</strong></p>
                </div>
            `;
        } else if (measurement.type === 'area') {
            html += `
                <div class="measurement-values">
                    <p class="mb-1"><strong class="text-success">Area: ${measurement.areaFormatted || 'N/A'}</strong></p>
                    <p class="mb-1 text-info small">Perimeter: ${measurement.perimeterFormatted || 'N/A'}</p>
                </div>
            `;
        } else if (measurement.type === 'perimeter') {
            html += `
                <div class="measurement-values">
                    <p class="mb-1"><strong class="text-warning">Perimeter: ${measurement.perimeterFormatted || 'N/A'}</strong></p>
                </div>
            `;
        }
        
        html += `
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="bi bi-clock"></i> ${measurement.timestamp.toLocaleTimeString()}
                        </small>
                        <small class="text-muted">
                            Units: ${measurement.units}
                        </small>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    resultsEl.innerHTML = html;
    
    attachRemoveButtonListeners();
    updateMeasurementStats();
}

export function attachRemoveButtonListeners() {
    const removeButtons = document.querySelectorAll('.remove-measurement-btn');
    removeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const measurementId = parseInt(event.target.dataset.measurementId);
            if (measurementId) {
                removeMeasurement(measurementId);
            }
        });
    });
}

export function updateMeasurementStats() {
    const measurementCountEl = document.getElementById('measurement-count');
    const count = measurements.length;
    
    if (measurementCountEl) {
        measurementCountEl.textContent = `${count} measurement${count !== 1 ? 's' : ''}`;
    }
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

export function exportMeasurements() {
    if (measurements.length === 0) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'No Measurements',
                text: 'Please create some measurements first',
                icon: 'warning'
            });
        } else {
            showNotification('No measurements to export', 'warning');
        }
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Sr_No,Type,Value,Units,Coordinates,Timestamp\n";
    
    measurements.forEach((measurement, index) => {
        let value = '';
        let coords = '';
        
        if (measurement.type === 'distance') {
            value = measurement.lengthFormatted;
            const lineCoords = measurement.geometry.getCoordinates();
            coords = lineCoords.map(coord => {
                const lonLat = toLonLat(coord);
                return `${lonLat[1].toFixed(6)},${lonLat[0].toFixed(6)}`;
            }).join(';');
        } else if (measurement.type === 'area') {
            value = measurement.areaFormatted;
            const polyCoords = measurement.geometry.getCoordinates()[0];
            coords = polyCoords.slice(0, -1).map(coord => {
                const lonLat = toLonLat(coord);
                return `${lonLat[1].toFixed(6)},${lonLat[0].toFixed(6)}`;
            }).join(';');
        } else if (measurement.type === 'perimeter') {
            value = measurement.perimeterFormatted;
            const polyCoords = measurement.geometry.getCoordinates()[0];
            coords = polyCoords.slice(0, -1).map(coord => {
                const lonLat = toLonLat(coord);
                return `${lonLat[1].toFixed(6)},${lonLat[0].toFixed(6)}`;
            }).join(';');
        }
        
        const row = [
            index + 1,
            measurement.type,
            `"${value}"`,
            measurement.units,
            `"${coords}"`,
            `"${measurement.timestamp.toLocaleString()}"`
        ].join(",");
        
        csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = `Measurements_${new Date().toISOString().split('T')[0]}_${measurements.length}items.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Export Complete!',
            text: `${measurements.length} measurements exported to CSV`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
    } else {
        showNotification(`${measurements.length} measurements exported`, 'success');
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function createRegularPolygon(sides) {
    return function(coordinates, geometry) {
        const center = coordinates[0];
        const last = coordinates[coordinates.length - 1];
        const dx = last[0] - center[0];
        const dy = last[1] - center[1];
        const radius = Math.sqrt(dx * dx + dy * dy);
        const rotation = Math.atan2(dy, dx);
        const newCoordinates = [];
        const numPoints = sides;
        for (let i = 0; i < numPoints; ++i) {
            const angle = rotation + (i * 2 * Math.PI) / numPoints;
            const fracRadius = radius;
            const offsetX = fracRadius * Math.cos(angle);
            const offsetY = fracRadius * Math.sin(angle);
            newCoordinates.push([center[0] + offsetX, center[1] + offsetY]);
        }
        newCoordinates.push(newCoordinates[0].slice());
        if (!geometry) {
            geometry = new Polygon([newCoordinates]);
        } else {
            geometry.setCoordinates([newCoordinates]);
        }
        return geometry;
    };
}

export function getMeasurements() {
    return measurements;
}

export function getMeasurementCount() {
    return measurementCount;
}

export function getCurrentMeasurementType() {
    return currentMeasurementType;
}

export function getCurrentUnits() {
    return currentUnits;
}