import { getMap, showNotification } from '../main.js';
import { getCustomLegendItems, layerState, API_CONFIG } from './layers.js';

// ==================== MODULE STATE ====================
let printSettings = {
    format: 'A4',
    orientation: 'landscape',
    resolution: 300,
    title: 'Geo-Portal Map',
    includeTitle: true,
    includeLegend: true,
    fitToActiveLayers: true
};

// ==================== PAGE FORMATS (in mm) ====================
const PAGE_FORMATS = {
    'A0': { width: 1189, height: 841 },
    'A1': { width: 841, height: 594 },
    'A2': { width: 594, height: 420 },
    'A3': { width: 420, height: 297 },
    'A4': { width: 297, height: 210 },
    'A5': { width: 210, height: 148 },
    'A6': { width: 148, height: 105 },
    'B4': { width: 353, height: 250 },
    'B5': { width: 250, height: 176 },
    'Letter': { width: 279, height: 216 },
    'Legal': { width: 356, height: 216 },
    'Tabloid': { width: 432, height: 279 },
    'Ledger': { width: 432, height: 279 },
    'Executive': { width: 267, height: 184 },
    'Poster': { width: 610, height: 914 },
    'Banner': { width: 914, height: 305 }
};

// ==================== INITIALIZATION ====================
export function initializePrintModule() {
}

// ==================== SETTINGS MANAGEMENT ====================
export function updatePrintSettings(settings) {
    printSettings = { ...printSettings, ...settings };
    updatePrintPreview();
}

export function getPrintSettings() {
    return { ...printSettings };
}

export function resetPrintSettings() {
    printSettings = {
        format: 'A4',
        orientation: 'landscape',
        resolution: 300,
        title: 'Geo-Portal Map',
        includeTitle: true,
        includeLegend: true,
        fitToActiveLayers: true
    };
    updatePrintPreview();
}

// ==================== VALIDATE EXTENT ====================
function isValidExtent(extent) {
    if (!extent || !Array.isArray(extent) || extent.length !== 4) {
        return false;
    }
    
    const [minX, minY, maxX, maxY] = extent;
    
    // Check if all values are finite numbers
    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
        return false;
    }
    
    // Check if extent has area (not empty)
    if (minX >= maxX || minY >= maxY) {
        return false;
    }
    
    // Check if extent is not too small (less than 1 meter)
    const width = maxX - minX;
    const height = maxY - minY;
    if (width < 1 || height < 1) {
        return false;
    }
    
    return true;
}

// ==================== DYNAMIC LAYER DETECTION HELPERS ====================

/**
 * Extract color from OpenLayers style
 */
function extractColorFromStyle(style) {
    if (!style) return null;
    
    try {
        // Check fill color
        const fill = style.getFill?.();
        if (fill) {
            const fillColor = fill.getColor?.();
            if (fillColor) return fillColor;
        }
        
        // Check stroke color
        const stroke = style.getStroke?.();
        if (stroke) {
            const strokeColor = stroke.getColor?.();
            if (strokeColor) return strokeColor;
        }
        
        // Check image/icon color (for points)
        const image = style.getImage?.();
        if (image) {
            const imageFill = image.getFill?.();
            if (imageFill) {
                const imageColor = imageFill.getColor?.();
                if (imageColor) return imageColor;
            }
            
            const imageStroke = image.getStroke?.();
            if (imageStroke) {
                const imageStrokeColor = imageStroke.getColor?.();
                if (imageStrokeColor) return imageStrokeColor;
            }
        }
    } catch (error) {
        console.warn('Error extracting color from style:', error);
    }
    
    return null;
}

/**
 * Determine geometry type from features
 */
function detectGeometryType(features) {
    if (!features || features.length === 0) return 'polygon';
    
    const geometryTypes = new Set();
    
    for (const feature of features) {
        try {
            const geometry = feature.getGeometry?.();
            if (geometry) {
                const type = geometry.getType?.();
                if (type) {
                    geometryTypes.add(type);
                }
            }
        } catch (error) {
            console.warn('Error detecting geometry type:', error);
        }
    }
    
    // Priority: Point > LineString > Polygon
    if (geometryTypes.has('Point') || geometryTypes.has('MultiPoint')) {
        return 'point';
    } else if (geometryTypes.has('LineString') || geometryTypes.has('MultiLineString')) {
        return 'line';
    } else if (geometryTypes.has('Polygon') || geometryTypes.has('MultiPolygon')) {
        return 'polygon';
    }
    
    return 'polygon'; // Default
}

/**
 * Get layer style information
 */
function getLayerStyle(layer) {
    let color = null;
    let geometryType = 'polygon';
    
    try {
        // Get features from layer source
        const source = layer.getSource?.();
        const features = source?.getFeatures?.() || [];
        
        // Detect geometry type
        geometryType = detectGeometryType(features);
        
        // Try to get style from layer
        const layerStyle = layer.getStyle?.();
        
        if (typeof layerStyle === 'function') {
            // Style is a function - get style for first feature
            if (features.length > 0) {
                const featureStyle = layerStyle(features[0]);
                if (Array.isArray(featureStyle)) {
                    color = extractColorFromStyle(featureStyle[0]);
                } else {
                    color = extractColorFromStyle(featureStyle);
                }
            }
        } else if (layerStyle) {
            // Style is a direct style object
            color = extractColorFromStyle(layerStyle);
        } else if (features.length > 0) {
            // Try to get style from first feature
            const featureStyle = features[0].getStyle?.();
            if (featureStyle) {
                if (Array.isArray(featureStyle)) {
                    color = extractColorFromStyle(featureStyle[0]);
                } else {
                    color = extractColorFromStyle(featureStyle);
                }
            }
        }
        
        // Default colors based on geometry type if none found
        if (!color) {
            switch (geometryType) {
                case 'point':
                    color = '#ef4444'; // Red for points
                    break;
                case 'line':
                    color = '#3b82f6'; // Blue for lines
                    break;
                case 'polygon':
                    color = 'rgba(59, 130, 246, 0.5)'; // Semi-transparent blue for polygons
                    break;
            }
        }
    } catch (error) {
        console.warn('Error getting layer style:', error);
    }
    
    return { color, type: geometryType };
}

/**
 * Get layer display name
 */
function getLayerDisplayName(layer) {
    try {
        // Try multiple properties for layer name
        return layer.get('title') || 
               layer.get('name') || 
               layer.get('label') || 
               layer.get('id') || 
               'Unnamed Layer';
    } catch (error) {
        return 'Unnamed Layer';
    }
}

/**
 * Check if layer is a base map layer
 */
function isBaseMapLayer(layer) {
    const layerName = (layer.get('name') || '').toLowerCase();
    const layerTitle = (layer.get('title') || '').toLowerCase();
    const layerType = layer.get('type') || '';
    
    const baseMapIndicators = [
        'osm', 'openstreetmap',
        'satellite', 'imagery',
        'terrain', 'topographic',
        'hybrid',
        'basemap', 'base-map', 'base_map',
        'google', 'bing', 'mapbox',
        'tile', 'xyz'
    ];
    
    // Check if it's marked as a base layer
    if (layer.get('baseLayer') === true || layerType === 'base') {
        return true;
    }
    
    // Check name/title for base map indicators
    return baseMapIndicators.some(indicator => 
        layerName.includes(indicator) || layerTitle.includes(indicator)
    );
}

// ==================== GET ACTIVE LAYERS EXTENT (DYNAMIC) ====================
function getActiveLayersExtent(map) {
    const extents = [];
    
    map.getLayers().forEach(layer => {
        // Skip invisible layers
        if (!layer.getVisible()) return;
        
        // Skip base map layers using dynamic check
        if (isBaseMapLayer(layer)) return;
        
        try {
            if (layer.getSource && typeof layer.getSource === 'function') {
                const source = layer.getSource();
                
                if (source.getFeatures && typeof source.getFeatures === 'function') {
                    const features = source.getFeatures();
                    if (features && features.length > 0) {
                        features.forEach(feature => {
                            const geom = feature.getGeometry();
                            if (geom && geom.getExtent) {
                                const extent = geom.getExtent();
                                if (isValidExtent(extent)) {
                                    extents.push(extent);
                                }
                            }
                        });
                    }
                }
                
                if (source.getExtent && typeof source.getExtent === 'function') {
                    const extent = source.getExtent();
                    if (isValidExtent(extent)) {
                        extents.push(extent);
                    }
                }
            }
        } catch (error) {
            const layerName = layer.get('name') || layer.get('title') || 'unknown';
            console.warn('Error getting extent for layer:', layerName, error);
        }
    });
    
    if (extents.length === 0) {
        console.warn('No valid extents found for active layers');
        return null;
    }
    
    let combinedExtent = extents[0];
    for (let i = 1; i < extents.length; i++) {
        combinedExtent = [
            Math.min(combinedExtent[0], extents[i][0]),
            Math.min(combinedExtent[1], extents[i][1]),
            Math.max(combinedExtent[2], extents[i][2]),
            Math.max(combinedExtent[3], extents[i][3])
        ];
    }
    
    return combinedExtent;
}

// ==================== PREVIEW ====================
export function updatePrintPreview() {
    const previewElement = document.getElementById('print-preview');
    if (!previewElement) return;

    const format = PAGE_FORMATS[printSettings.format];
    if (!format) return;

    const isLandscape = printSettings.orientation === 'landscape';
    const width = isLandscape ? format.width : format.height;
    const height = isLandscape ? format.height : format.width;
    
    const dpi = printSettings.resolution;
    const pixelWidth = Math.round((width / 25.4) * dpi);
    const pixelHeight = Math.round((height / 25.4) * dpi);
    
    const scale = 0.5;
    previewElement.style.width = `${width * scale}px`;
    previewElement.style.height = `${height * scale}px`;
    
    previewElement.innerHTML = `
        <div style="padding: 0; position: relative; height: 100%; width: 100%;">
            <div style="background: #e0f2fe; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; border: 2px solid #3b82f6;">
                <div style="text-align: center;">
                    <span style="color: #1e40af; font-weight: bold;">${printSettings.format} ${printSettings.orientation}</span><br>
                    <span style="color: #64748b; font-size: 11px;">${pixelWidth} × ${pixelHeight}px</span><br>
                    <span style="color: #059669; font-size: 10px; font-weight: bold;">${dpi} DPI</span>
                </div>
            </div>
        </div>
    `;
}

// ==================== PRINT GENERATION ====================
export async function generatePrintMap() {
    const map = getMap();
    if (!map) {
        showNotification('Map not initialized', 'error');
        return;
    }

    const exportBtn = document.getElementById('export-map-btn');

    try {
        showNotification('Generating map export...', 'info');
        
        const format = PAGE_FORMATS[printSettings.format];
        if (!format) throw new Error(`Invalid format: ${printSettings.format}`);

        const isLandscape = printSettings.orientation === 'landscape';
        const pageWidthMM = isLandscape ? format.width : format.height;
        const pageHeightMM = isLandscape ? format.height : format.width;
        
        const dpi = printSettings.resolution;
        const pixelWidth = Math.round((pageWidthMM / 25.4) * dpi);
        const pixelHeight = Math.round((pageHeightMM / 25.4) * dpi);
        
        const totalPixels = pixelWidth * pixelHeight;
        const maxRecommended = 50000000;
        
        if (totalPixels > maxRecommended) {
            const proceed = await Swal.fire({
                title: 'Large Export Size',
                html: `This export will create a ${(totalPixels/1000000).toFixed(1)} megapixel image.<br>This may take time. Continue?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Continue',
                cancelButtonText: 'Cancel'
            });
            
            if (!proceed.isConfirmed) return;
        }
        
        
        if (exportBtn) {
            exportBtn.disabled = true;
            exportBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Make sure map is still valid
        if (!map || typeof map.getSize !== 'function') {
            throw new Error('Map object is invalid');
        }
        
        const mapCanvas = await captureMapCanvas(map, pixelWidth, pixelHeight);
        const finalImage = await createFullPageImage(mapCanvas, pixelWidth, pixelHeight);
        
        const filename = `geo_portal_map_${printSettings.format}_${printSettings.orientation}_${dpi}dpi_${Date.now()}.png`;
        await downloadImage(finalImage, filename);
        
        showNotification(`Map exported successfully!`, 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        
        let errorMessage = 'Failed to generate map export';
        if (error.message.includes('tainted') || error.message.includes('CORS')) {
            errorMessage = 'Map layers have CORS restrictions. Try disabling some WMS layers.';
        } else if (error.message.includes('memory') || error.message.includes('too large')) {
            errorMessage = 'Image too large. Try lower DPI or smaller format.';
        } else {
            errorMessage = `Export failed: ${error.message}`;
        }
        
        showNotification(errorMessage, 'error');
        
    } finally {
        if (exportBtn) {
            exportBtn.disabled = false;
            exportBtn.innerHTML = '📥 Export as PNG';
        }
    }
}

// ==================== MAP CANVAS CAPTURE ====================
async function captureMapCanvas(map, targetWidth, targetHeight) {
    return new Promise((resolve, reject) => {
        try {
            const originalSize = map.getSize();
            const originalView = map.getView();
            const originalCenter = originalView.getCenter();
            const originalZoom = originalView.getZoom();
            
            let targetExtent = null;
            if (printSettings.fitToActiveLayers) {
                targetExtent = getActiveLayersExtent(map);
                
                // Validate extent before using it
                if (!isValidExtent(targetExtent)) {
                    console.warn('Invalid or empty active layers extent, using current view extent');
                    targetExtent = null;
                }
            }
            
            // If no valid extent, use current view extent as fallback
            if (!targetExtent) {
                targetExtent = map.getView().calculateExtent(map.getSize());
                
                if (!isValidExtent(targetExtent)) {
                    reject(new Error('Cannot determine valid map extent'));
                    return;
                }
            }
            
            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = targetWidth;
            exportCanvas.height = targetHeight;
            
            const context = exportCanvas.getContext('2d', {
                alpha: false,
                willReadFrequently: false
            });
            
            if (!context) {
                reject(new Error('Failed to get 2D context'));
                return;
            }
            
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, targetWidth, targetHeight);
            
            map.setSize([targetWidth, targetHeight]);
            
            // Fit to extent with validation
            try {
                map.getView().fit(targetExtent, {
                    size: [targetWidth, targetHeight],
                    padding: [50, 50, 50, 50],
                    constrainResolution: false
                });
            } catch (fitError) {
                console.warn('Error fitting to extent:', fitError);
                // Continue with current view
            }
            
            map.renderSync();
            
            setTimeout(() => {
                try {
                    const mapViewport = map.getViewport();
                    const canvases = mapViewport.querySelectorAll('.ol-layer canvas, canvas.ol-layer');
                    
                    let renderedLayers = 0;
                    
                    canvases.forEach((sourceCanvas) => {
                        try {
                            if (sourceCanvas.width > 0 && sourceCanvas.height > 0) {
                                const opacity = parseFloat(sourceCanvas.parentNode.style.opacity || '1');
                                
                                try {
                                    sourceCanvas.getContext('2d').getImageData(0, 0, 1, 1);
                                } catch (e) {
                                    console.warn('Canvas tainted, skipping');
                                    return;
                                }
                                
                                context.save();
                                context.globalAlpha = opacity;
                                
                                const transform = sourceCanvas.style.transform;
                                if (transform && transform !== 'none') {
                                    const matrix = transform.match(/^matrix\(([^)]+)\)$/);
                                    if (matrix) {
                                        const values = matrix[1].split(',').map(Number);
                                        context.setTransform(values[0], values[1], values[2], values[3], values[4], values[5]);
                                    }
                                }
                                
                                context.drawImage(sourceCanvas, 0, 0);
                                context.restore();
                                renderedLayers++;
                            }
                        } catch (drawError) {
                            console.error('Error drawing canvas:', drawError);
                        }
                    });
                    
                    
                    map.setSize(originalSize);
                    map.getView().setCenter(originalCenter);
                    map.getView().setZoom(originalZoom);
                    
                    try {
                        context.getImageData(0, 0, 1, 1);
                        resolve(exportCanvas);
                    } catch (testError) {
                        reject(new Error('Canvas is tainted - CORS restrictions on map layers'));
                    }
                    
                } catch (error) {
                    map.setSize(originalSize);
                    map.getView().setCenter(originalCenter);
                    map.getView().setZoom(originalZoom);
                    reject(error);
                }
            }, 2000);
            
        } catch (error) {
            reject(error);
        }
    });
}

// ==================== GET ACTIVE LAYERS (DYNAMIC) ====================
function getActiveLayers() {
    const layers = [];
    
    try {
        // 1. Add custom legend items first (from analysis)
        const customItems = getCustomLegendItems();
        if (customItems && customItems.length > 0) {
            customItems.forEach(item => {
                layers.push({
                    name: item.label,
                    type: item.shape === 'circle' ? 'point' : 
                          item.shape === 'line' ? 'line' : 
                          item.shape === 'boundary' ? 'boundary' : 'polygon',
                    color: item.color,
                    featureCount: 0,
                    isCustom: true,
                    shape: item.shape
                });
            });
        }
        
        // 2. Add active WMS layers
        if (layerState && layerState.active) {
            layerState.active.forEach(layerId => {
                const layerName = layerState.names[layerId] || layerId;
                const wmsLayerName = layerState.wmsMapping[layerId] || layerId;
                
                layers.push({
                    name: layerName,
                    type: 'wms',
                    wmsLayerName: wmsLayerName,
                    layerId: layerId,
                    isCustom: false
                });
            });
        }
        
    } catch (error) {
        console.error('Error getting active layers:', error);
    }
    
    return layers;
}

// ==================== GET PRINT OPTIONS ====================
function getPrintOptions() {
    return {
        includeTitle: document.getElementById('include-title')?.checked ?? true,
        includeScale: document.getElementById('include-scale')?.checked ?? true,
        includeDate: document.getElementById('include-date')?.checked ?? true,
        includeCoordinates: document.getElementById('include-coordinates')?.checked ?? true,
        includeLegend: document.getElementById('include-legend')?.checked ?? true
    };
}

// ==================== COMPASS ROSE ====================
function drawCompassRose(ctx, x, y, size) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size / 2;
    
    ctx.save();
    
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();
    ctx.stroke();
    
    // North arrow (red)
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius * 0.6);
    ctx.lineTo(centerX - radius * 0.2, centerY - radius * 0.2);
    ctx.lineTo(centerX, centerY);
    ctx.lineTo(centerX + radius * 0.2, centerY - radius * 0.2);
    ctx.closePath();
    ctx.fill();
    
    // South arrow (gray)
    ctx.fillStyle = '#9ca3af';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + radius * 0.6);
    ctx.lineTo(centerX - radius * 0.2, centerY + radius * 0.2);
    ctx.lineTo(centerX, centerY);
    ctx.lineTo(centerX + radius * 0.2, centerY + radius * 0.2);
    ctx.closePath();
    ctx.fill();
    
    // Labels
    const fontSize = size * 0.25;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const dirs = [
        { label: 'N', angle: -Math.PI / 2, color: '#dc2626' },
        { label: 'E', angle: 0, color: '#374151' },
        { label: 'S', angle: Math.PI / 2, color: '#374151' },
        { label: 'W', angle: Math.PI, color: '#374151' }
    ];
    
    dirs.forEach(dir => {
        const labelX = centerX + Math.cos(dir.angle) * (radius * 0.85);
        const labelY = centerY + Math.sin(dir.angle) * (radius * (dir['label'] == 'N' ? 0.75 : 0.85));
        ctx.fillStyle = dir.color;
        ctx.fillText(dir.label, labelX, labelY);
    });
    
    ctx.restore();
}

// ==================== LOGO ====================
async function drawLogo(ctx, x, y, width, height) {
    return new Promise((resolve) => {
        try {
            const img = new Image();
            img.onload = function() {
                ctx.save();
                
                // Background box
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.strokeStyle = '#1f2937';
                ctx.lineWidth = 2;
                roundRect(ctx, x, y, width, height, 4);
                ctx.fill();
                ctx.stroke();
                
                // Calculate logo size with padding
                const logoPadding = width * 0.1;
                const logoWidth = width - (logoPadding * 2);
                const logoHeight = height - (logoPadding * 2);
                
                // Calculate aspect ratio
                const imgRatio = img.width / img.height;
                const boxRatio = logoWidth / logoHeight;
                
                let drawWidth, drawHeight, drawX, drawY;
                
                if (imgRatio > boxRatio) {
                    drawWidth = logoWidth;
                    drawHeight = logoWidth / imgRatio;
                    drawX = x + logoPadding;
                    drawY = y + (height - drawHeight) / 2;
                } else {
                    drawHeight = logoHeight;
                    drawWidth = logoHeight * imgRatio;
                    drawX = x + (width - drawWidth) / 2;
                    drawY = y + logoPadding;
                }
                
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                ctx.restore();
                resolve();
            };
            
            img.onerror = function() {
                console.warn('Failed to load logo, drawing placeholder');
                // Draw placeholder if logo fails to load
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.strokeStyle = '#1f2937';
                ctx.lineWidth = 2;
                roundRect(ctx, x, y, width, height, 4);
                ctx.fill();
                ctx.stroke();
                
                ctx.fillStyle = '#64748b';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('LOGO', x + width / 2, y + height / 2);
                resolve();
            };
            
            // Load logo directly from path
            img.src = '../assets/images/chips_logo.png';
                
        } catch (error) {
            console.warn('Error loading logo:', error);
            // Draw placeholder on error
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.strokeStyle = '#1f2937';
            ctx.lineWidth = 2;
            roundRect(ctx, x, y, width, height, 4);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('LOGO', x + width / 2, y + height / 2);
            resolve();
        }
    });
}

// ==================== SCALE BAR (DYNAMIC BASED ON MAP EXTENT) ====================
function drawScaleBar(ctx, x, y, width, height, map) {
    ctx.save();
    
    const view = map.getView();
    const resolution = view.getResolution();
    const projection = view.getProjection();
    const units = projection.getUnits();
    
    // Get center of the map for accurate scale calculation
    const center = view.getCenter();
    
    // Calculate meters per pixel at map center
    let metersPerUnit = 1;
    if (units === 'degrees') {
        // For geographic coordinates, calculate meters per degree at this latitude
        const pointResolution = projection.getPointResolution(resolution, center);
        metersPerUnit = pointResolution;
    } else if (units === 'm') {
        metersPerUnit = 1;
    } else if (units === 'ft') {
        metersPerUnit = 0.3048;
    }
    
    const metersPerPixel = resolution * metersPerUnit;
    
    // Target scale bar to be about 60% of the provided width
    const targetScaleBarWidth = width * 0.6;
    const targetDistance = targetScaleBarWidth * metersPerPixel;
    
    // Find a nice round number for the scale
    const distances = [
        1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 
        1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 
        100000, 200000, 250000, 500000, 1000000
    ];
    
    let scaleDistance = distances[0];
    for (let dist of distances) {
        if (dist <= targetDistance * 1.5) {
            scaleDistance = dist;
        } else {
            break;
        }
    }
    
    // Calculate actual pixel width for this distance
    const scaleBarWidth = (scaleDistance / metersPerPixel);
    const barHeight = height * 0.35;
    const startX = x + (width - scaleBarWidth) / 2;
    const startY = y + height * 0.3;
    
    // White background box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    const boxPadding = Math.max(width * 0.15, 20);
    roundRect(ctx, startX - boxPadding, y, scaleBarWidth + (boxPadding * 2), height, 4);
    ctx.fill();
    ctx.stroke();
    
    // Black and white segments
    const segments = 2;
    const segmentWidth = scaleBarWidth / segments;
    
    ctx.lineWidth = 1.5;
    for (let i = 0; i < segments; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#000000' : '#ffffff';
        ctx.strokeStyle = '#000000';
        const segX = startX + (i * segmentWidth);
        ctx.fillRect(segX, startY, segmentWidth, barHeight);
        ctx.strokeRect(segX, startY, segmentWidth, barHeight);
    }
    
    // Calculate labels
    const fontSize = height * 0.25;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    // Start label (0)
    ctx.fillText('0', startX, startY - 2);
    
    // End label with proper units
    let endLabel;
    if (scaleDistance < 1000) {
        endLabel = `${scaleDistance}`;
    } else {
        const km = scaleDistance / 1000;
        endLabel = km % 1 === 0 ? `${km}` : `${km.toFixed(1)}`;
    }
    ctx.fillText(endLabel, startX + scaleBarWidth, startY - 2);
    
    // Middle label (half distance)
    const middleDistance = scaleDistance / 2;
    let middleLabel;
    if (middleDistance < 1000) {
        middleLabel = `${middleDistance}`;
    } else {
        const km = middleDistance / 1000;
        middleLabel = km % 1 === 0 ? `${km}` : `${km.toFixed(1)}`;
    }
    ctx.fillText(middleLabel, startX + scaleBarWidth / 2, startY - 2);
    
    // "Kilometers" label below
    ctx.font = `${fontSize * 0.9}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Kilometers', startX + scaleBarWidth / 2, startY + barHeight + 2);
    
    ctx.restore();
}

// ==================== WORD WRAPPING ====================
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}
// ==================== DRAW ACTUAL LEGEND ====================
async function drawActualLegend(ctx, activeLayers, width, height, margin, legendWidth, legendTotalHeight, baseFontSize) {
    const legendPadding = Math.round(width * 0.01);
    const legendFontSize = Math.round(baseFontSize * 0.7);
    const legendSymbolSize = Math.round(legendFontSize * 1.1);
    
    const legendX = width - margin - legendWidth;
    const legendY = height - margin - legendTotalHeight;
    
    // Draw legend background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = -2;
    ctx.shadowOffsetY = -2;
    
    roundRect(ctx, legendX, legendY, legendWidth, legendTotalHeight, 6);
    ctx.fill();
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 2;
    roundRect(ctx, legendX, legendY, legendWidth, legendTotalHeight, 6);
    ctx.stroke();
    
    // Header
    const legendHeaderHeight = Math.round(legendFontSize * 2.2);
    ctx.fillStyle = '#1f2937';
    ctx.font = `bold ${Math.round(legendFontSize * 1.1)}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Map Legends', legendX + legendPadding, legendY + legendHeaderHeight / 2.5);
    
    // Separator
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(legendX + legendPadding, legendY + legendHeaderHeight);
    ctx.lineTo(legendX + legendWidth - legendPadding, legendY + legendHeaderHeight);
    ctx.stroke();
    
    ctx.font = `${legendFontSize}px Arial`;
    
    // Calculate layout dynamically based on content
    let currentY = legendY + legendHeaderHeight + legendPadding;
    const contentWidth = legendWidth - (legendPadding * 2);
    const itemSpacing = Math.round(legendFontSize * 0.8);
    
    // Draw each layer sequentially with proper spacing
    for (let index = 0; index < activeLayers.length; index++) {
        const layer = activeLayers[index];
        const startY = currentY;
        
        if (layer.isCustom) {
            // Draw custom legend items (from analysis)
            const symbolX = legendX + legendPadding;
            const symbolY = currentY;
            
            if (layer.type === 'point') {
                ctx.fillStyle = layer.color || '#ef4444';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(symbolX + legendSymbolSize / 2, symbolY + legendSymbolSize / 2, legendSymbolSize / 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else if (layer.type === 'line') {
                ctx.strokeStyle = layer.color || '#3b82f6';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(symbolX, symbolY + legendSymbolSize / 2);
                ctx.lineTo(symbolX + legendSymbolSize, symbolY + legendSymbolSize / 2);
                ctx.stroke();
            } else if (layer.shape === 'boundary') {
                ctx.strokeStyle = layer.color || '#FF0000';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(symbolX, symbolY, legendSymbolSize, legendSymbolSize);
                ctx.setLineDash([]);
            } else {
                // polygon
                ctx.fillStyle = layer.color || 'rgba(59, 130, 246, 0.5)';
                ctx.strokeStyle = '#1e40af';
                ctx.lineWidth = 1.5;
                ctx.fillRect(symbolX, symbolY, legendSymbolSize, legendSymbolSize);
                ctx.strokeRect(symbolX, symbolY, legendSymbolSize, legendSymbolSize);
            }
            
            // Draw label
            ctx.fillStyle = '#374151';
            ctx.font = `${legendFontSize}px Arial`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            const textX = symbolX + legendSymbolSize + (legendPadding * 0.6);
            const maxTextWidth = contentWidth - legendSymbolSize - (legendPadding * 0.6);
            
            let layerName = layer.name;
            let textWidth = ctx.measureText(layerName).width;
            if (textWidth > maxTextWidth) {
                while (textWidth > maxTextWidth && layerName.length > 0) {
                    layerName = layerName.substring(0, layerName.length - 1);
                    textWidth = ctx.measureText(layerName + '...').width;
                }
                layerName += '...';
            }
            
            ctx.fillText(layerName, textX, symbolY + legendSymbolSize / 2);
            
            // Update Y position for next item
            currentY += legendSymbolSize + itemSpacing;
            
        } else {
            // Draw WMS layer legend using GetLegendGraphic
            try {
                const legendImg = await loadLegendImage(layer.wmsLayerName);
                
                if (legendImg && legendImg.complete && legendImg.naturalHeight > 0) {
                    // Draw layer name
                    ctx.fillStyle = '#374151';
                    ctx.font = `bold ${legendFontSize}px Arial`;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    const textX = legendX + legendPadding;
                    const maxTextWidth = contentWidth;
                    
                    let layerName = layer.name;
                    let textWidth = ctx.measureText(layerName).width;
                    if (textWidth > maxTextWidth) {
                        while (textWidth > maxTextWidth && layerName.length > 0) {
                            layerName = layerName.substring(0, layerName.length - 1);
                            textWidth = ctx.measureText(layerName + '...').width;
                        }
                        layerName += '...';
                    }
                    
                    // Draw name
                    ctx.fillText(layerName, textX, currentY);
                    currentY += legendFontSize + 4;
                    
                    // Draw legend image below name
                    const maxImgWidth = contentWidth;
                    const maxImgHeight = Math.round(legendFontSize * 3);
                    
                    // Calculate scaling
                    let imgWidth = legendImg.naturalWidth;
                    let imgHeight = legendImg.naturalHeight;
                    
                    // Scale to fit within max dimensions
                    if (imgWidth > maxImgWidth) {
                        const scale = maxImgWidth / imgWidth;
                        imgWidth = maxImgWidth;
                        imgHeight = imgHeight * scale;
                    }
                    
                    if (imgHeight > maxImgHeight) {
                        const scale = maxImgHeight / imgHeight;
                        imgHeight = maxImgHeight;
                        imgWidth = imgWidth * scale;
                    }
                    
                    ctx.drawImage(legendImg, textX, currentY, imgWidth, imgHeight);
                    
                    // Update Y position for next item
                    currentY += imgHeight + itemSpacing;
                    
                } else {
                    // Fallback to simple colored box if image fails
                    const symbolX = legendX + legendPadding;
                    const symbolY = currentY;
                    
                    ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
                    ctx.strokeStyle = '#1e40af';
                    ctx.lineWidth = 1.5;
                    ctx.fillRect(symbolX, symbolY, legendSymbolSize, legendSymbolSize);
                    ctx.strokeRect(symbolX, symbolY, legendSymbolSize, legendSymbolSize);
                    
                    ctx.fillStyle = '#374151';
                    ctx.font = `${legendFontSize}px Arial`;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    const textX = symbolX + legendSymbolSize + (legendPadding * 0.6);
                    ctx.fillText(layer.name, textX, symbolY + legendSymbolSize / 2);
                    
                    // Update Y position for next item
                    currentY += legendSymbolSize + itemSpacing;
                }
            } catch (error) {
                console.warn('Error loading WMS legend for', layer.name, error);
                
                // Fallback
                const symbolX = legendX + legendPadding;
                const symbolY = currentY;
                
                ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
                ctx.strokeStyle = '#1e40af';
                ctx.lineWidth = 1.5;
                ctx.fillRect(symbolX, symbolY, legendSymbolSize, legendSymbolSize);
                ctx.strokeRect(symbolX, symbolY, legendSymbolSize, legendSymbolSize);
                
                ctx.fillStyle = '#374151';
                ctx.font = `${legendFontSize}px Arial`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                const textX = symbolX + legendSymbolSize + (legendPadding * 0.6);
                ctx.fillText(layer.name, textX, symbolY + legendSymbolSize / 2);
                
                // Update Y position for next item
                currentY += legendSymbolSize + itemSpacing;
            }
        }
        
        // Safety check - if we're running out of space, stop adding items
        if (currentY > (legendY + legendTotalHeight - legendPadding)) {
            console.warn('Legend overflow - some items may not be displayed');
            break;
        }
    }
}

function loadLegendImage(wmsLayerName) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            resolve(img);
        };
        
        img.onerror = function() {
            console.warn('Failed to load legend for', wmsLayerName);
            resolve(null);
        };
        
        const legendUrl = `${API_CONFIG.adminUrl}?service=WMS&version=1.1.1&request=GetLegendGraphic&layer=CGCOG_DATABASE:${wmsLayerName}&format=image/png`;
        img.src = legendUrl;
        
        // Timeout after 5 seconds
        setTimeout(() => {
            if (!img.complete) {
                resolve(null);
            }
        }, 5000);
    });
}

// ==================== FULL PAGE IMAGE (UPDATED BOTTOM LAYOUT) ====================
async function createFullPageImage(mapCanvas, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate 2mm border in pixels
    const dpi = printSettings.resolution;
    const borderWidth = Math.round((2 / 25.4) * dpi);
    
    // 2mm black border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
    
    // Calculate 2mm padding in pixels
    const padding = Math.round((2 / 25.4) * dpi);
    const margin = borderWidth + padding;
    
    // Draw map with padding
    const mapX = margin;
    const mapY = margin;
    const mapWidth = width - (margin * 2);
    const mapHeight = height - (margin * 2);
    
    ctx.drawImage(mapCanvas, mapX, mapY, mapWidth, mapHeight);
    
    const baseFontSize = Math.max(14, Math.round(height * 0.012));
    
    // Get checkbox states
    const options = getPrintOptions();
    
    // 1. Title (if enabled) - TOP LEFT
    if (options.includeTitle && printSettings.title) {
        const maxTitleBoxWidth = width / 4;
        const titlePadding = Math.round(width * 0.01);
        
        let titleFontSize = Math.round(baseFontSize * 1.4);
        if (printSettings.title.length > 50) {
            titleFontSize = Math.round(baseFontSize * 1.1);
        } else if (printSettings.title.length > 30) {
            titleFontSize = Math.round(baseFontSize * 1.2);
        }
        
        ctx.font = `bold ${titleFontSize}px Arial`;
        const maxTextWidth = maxTitleBoxWidth - (titlePadding * 2);
        const titleLines = wrapText(ctx, printSettings.title, maxTextWidth);
        
        const lineHeight = titleFontSize * 1.3;
        const titleBoxHeight = (titleLines.length * lineHeight) + (titlePadding * 2);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 3;
        
        roundRect(ctx, margin, margin, maxTitleBoxWidth, titleBoxHeight, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.fillStyle = '#1f2937';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        titleLines.forEach((line, index) => {
            ctx.fillText(line, margin + titlePadding, margin + titlePadding + (index * lineHeight));
        });
    }
    
    // 2. Compass (always shown) - TOP RIGHT
    const compassSize = Math.round(width * 0.06);
    const compassX = width - margin - compassSize;
    const compassY = margin;
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 3;
    drawCompassRose(ctx, compassX, compassY, compassSize);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // ==================== BOTTOM ROW LAYOUT ====================
    const mapInstance = getMap();
    
    // Calculate dimensions for bottom elements
    const logoWidth = Math.round(width * 0.08);
    const logoHeight = Math.round(width * 0.08);
    
    const dateTimeFontSize = Math.round(baseFontSize * 0.9);
    const coordsFontSize = Math.round(baseFontSize * 0.85);
    const scaleBarWidth = Math.round(width * 0.15);
    const scaleBarHeight = Math.round(height * 0.04);
    
    const elementSpacing = Math.round(width * 0.015);
    
    // Calculate legend dimensions using ACTUAL legend data
    const activeLayers = getActiveLayers();
    let legendWidth = 0;
    let legendTotalHeight = 0;

    if (activeLayers.length > 0 && options.includeLegend) {
        const legendPadding = Math.round(width * 0.01);
        const legendFontSize = Math.round(baseFontSize * 0.7);
        
        // Estimate heights more generously
        const legendHeaderHeight = Math.round(legendFontSize * 2.2);
        const customItemHeight = Math.round(legendFontSize * 2);
        const wmsItemHeight = Math.round(legendFontSize * 4.5); // More space for WMS legends
        
        // Count custom vs WMS items
        let customCount = 0;
        let wmsCount = 0;
        activeLayers.forEach(layer => {
            if (layer.isCustom) {
                customCount++;
            } else {
                wmsCount++;
            }
        });
        
        // Calculate total content height
        const itemSpacing = Math.round(legendFontSize * 0.8);
        const totalContentHeight = 
            (customCount * customItemHeight) + 
            (wmsCount * wmsItemHeight) + 
            (activeLayers.length * itemSpacing);
        
        const maxLegendHeight = height / 4; // Allow more space
        legendTotalHeight = Math.min(
            legendHeaderHeight + totalContentHeight + (legendPadding * 2), 
            maxLegendHeight
        );
        
        // Width calculation
        const columnWidth = Math.round(width * 0.15);
        legendWidth = columnWidth + (legendPadding * 2);
    }
    
    // Calculate widths for datetime and coords boxes
    let dateTimeBoxWidth = 0;
    let coordsBoxWidth = 0;
    
    if (options.includeDate) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
        const timeStr = now.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        ctx.font = `${dateTimeFontSize}px Arial`;
        const dateTimeText = `${dateStr} ${timeStr}`;
        const dateTimeWidth = ctx.measureText(dateTimeText).width;
        const dateTimePadding = Math.round(width * 0.01);
        dateTimeBoxWidth = dateTimeWidth + (dateTimePadding * 2);
    }
    
    if (options.includeCoordinates && mapInstance) {
        const center = mapInstance.getView().getCenter();
        const [lon, lat] = center;
        ctx.font = `${coordsFontSize}px Arial`;
        const coordsText = `Lat: ${lat.toFixed(5)}°, Lon: ${lon.toFixed(5)}°`;
        const coordsWidth = ctx.measureText(coordsText).width;
        const coordsPadding = Math.round(width * 0.01);
        coordsBoxWidth = coordsWidth + (coordsPadding * 2);
    }
    
    // Position calculation for bottom row
    let currentX = margin; // Start from left margin
    
    // 3. Logo (BOTTOM LEFT - FIXED POSITION)
    const logoX = currentX;
    const logoY = height - margin - logoHeight;
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = -3;
    await drawLogo(ctx, logoX, logoY, logoWidth, logoHeight);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    currentX = logoX + logoWidth + elementSpacing;
    
    // 4. Date & Time (BOTTOM - NEXT TO LOGO)
    if (options.includeDate) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
        const timeStr = now.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        
        const dateTimeBoxHeight = dateTimeFontSize * 2;
        const dateTimeX = currentX;
        const dateTimeY = height - margin - dateTimeBoxHeight;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = -2;
        const dateTimePadding = Math.round(width * 0.01);
        roundRect(ctx, dateTimeX, dateTimeY, dateTimeBoxWidth, dateTimeBoxHeight, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#1f2937';
        ctx.font = `${dateTimeFontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const dateTimeText = `${dateStr} ${timeStr}`;
        ctx.fillText(dateTimeText, dateTimeX + dateTimeBoxWidth / 2, dateTimeY + dateTimeBoxHeight / 2);
        
        currentX = dateTimeX + dateTimeBoxWidth + elementSpacing;
    }
    
    // 5. Coordinates (BOTTOM - CENTER OR AFTER DATETIME)
    if (options.includeCoordinates && mapInstance) {
        const center = mapInstance.getView().getCenter();
        const [lon, lat] = center;
        
        const coordsBoxHeight = coordsFontSize * 2;
        
        // Calculate center position if both datetime and coords are present and scale is not
        let coordsX;
        if (options.includeDate && !options.includeScale) {
            // Center between current position and legend
            const legendX = width - margin - legendWidth;
            const availableSpace = legendX - currentX - elementSpacing;
            coordsX = currentX + (availableSpace - coordsBoxWidth) / 2;
        } else {
            coordsX = currentX;
        }
        
        const coordsY = height - margin - coordsBoxHeight;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = -2;
        const coordsPadding = Math.round(width * 0.01);
        roundRect(ctx, coordsX, coordsY, coordsBoxWidth, coordsBoxHeight, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#1f2937';
        ctx.font = `${coordsFontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const coordsText = `Lat: ${lat.toFixed(5)}°, Lon: ${lon.toFixed(5)}°`;
        ctx.fillText(coordsText, coordsX + coordsBoxWidth / 2, coordsY + coordsBoxHeight / 2);
        
        currentX = coordsX + coordsBoxWidth + elementSpacing;
    }
    
    // 6. Scale Bar (BOTTOM - BEFORE LEGEND)
    if (options.includeScale && mapInstance) {
        const legendX = width - margin - legendWidth;
        const scaleBarX = legendX - scaleBarWidth - elementSpacing;
        const scaleBarY = height - margin - scaleBarHeight;
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = -3;
        drawScaleBar(ctx, scaleBarX, scaleBarY, scaleBarWidth, scaleBarHeight, mapInstance);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }
    
    // 7. Legend (BOTTOM RIGHT - FIXED POSITION)
    if (activeLayers.length > 0 && options.includeLegend) {
        await drawActualLegend(ctx, activeLayers, width, height, margin, legendWidth, legendTotalHeight, baseFontSize);
    }
    
    return canvas;
}

// ==================== HELPER FUNCTIONS ====================
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function downloadImage(canvas, filename) {
    return new Promise((resolve, reject) => {
        try {
            if (!canvas || !canvas.getContext) {
                reject(new Error('Invalid canvas object'));
                return;
            }
            
            try {
                canvas.getContext('2d').getImageData(0, 0, 1, 1);
            } catch (securityError) {
                reject(new Error('Canvas tainted - check WMS CORS settings'));
                return;
            }
            
            canvas.toBlob(function(blob) {
                if (!blob) {
                    reject(new Error('Failed to create image blob'));
                    return;
                }
                
                
                try {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = url;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    
                    setTimeout(() => {
                        try {
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                        } catch (cleanupError) {
                            console.warn('Cleanup error:', cleanupError);
                        }
                        resolve();
                    }, 100);
                    
                } catch (urlError) {
                    reject(new Error('Failed to create download link: ' + urlError.message));
                }
            }, 'image/png', 1.0);
            
        } catch (error) {
            reject(new Error('Download failed: ' + error.message));
        }
    });
}

// ==================== EXPORT FORMATS ====================
export async function exportAsPDF() {
    showNotification('PDF export coming soon. Exporting as PNG instead.', 'info');
    await generatePrintMap();
}

export async function exportAsJPEG() {
    const map = getMap();
    if (!map) {
        showNotification('Map not initialized', 'error');
        return;
    }

    const exportBtn = document.getElementById('export-jpeg-btn');
    
    try {
        showNotification('Generating JPEG export...', 'info');
        
        const format = PAGE_FORMATS[printSettings.format];
        if (!format) throw new Error(`Invalid format: ${printSettings.format}`);
        
        const isLandscape = printSettings.orientation === 'landscape';
        const pageWidthMM = isLandscape ? format.width : format.height;
        const pageHeightMM = isLandscape ? format.height : format.width;
        
        const dpi = printSettings.resolution;
        const pixelWidth = Math.round((pageWidthMM / 25.4) * dpi);
        const pixelHeight = Math.round((pageHeightMM / 25.4) * dpi);
        
        if (exportBtn) {
            exportBtn.disabled = true;
            exportBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mapCanvas = await captureMapCanvas(map, pixelWidth, pixelHeight);
        const finalImage = await createFullPageImage(mapCanvas, pixelWidth, pixelHeight);
        
        await new Promise((resolve, reject) => {
            finalImage.toBlob(function(blob) {
                if (!blob) {
                    reject(new Error('Failed to create JPEG blob'));
                    return;
                }
                
                try {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    const filename = `geo_portal_map_${printSettings.format}_${printSettings.orientation}_${dpi}dpi_${Date.now()}.jpg`;
                    link.download = filename;
                    link.href = url;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    
                    setTimeout(() => {
                        try {
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                        } catch (cleanupError) {
                            console.warn('Cleanup error:', cleanupError);
                        }
                        resolve();
                    }, 100);
                    
                } catch (urlError) {
                    reject(urlError);
                }
            }, 'image/jpeg', 0.98);
        });
        
        showNotification(`JPEG exported successfully!`, 'success');
        
    } catch (error) {
        console.error('JPEG export error:', error);
        showNotification('Failed to generate JPEG export: ' + error.message, 'error');
    } finally {
        if (exportBtn) {
            exportBtn.disabled = false;
            exportBtn.innerHTML = '📥 Export as JPEG';
        }
    }
}

// ==================== UTILITY ====================
export function getAvailableFormats() {
    return Object.keys(PAGE_FORMATS);
}

export function getFormatDimensions(format, orientation = 'landscape') {
    const dims = PAGE_FORMATS[format];
    if (!dims) return null;
    
    return orientation === 'landscape' 
        ? { width: dims.width, height: dims.height }
        : { width: dims.height, height: dims.width };
}

export default {
    initializePrintModule,
    updatePrintSettings,
    getPrintSettings,
    resetPrintSettings,
    updatePrintPreview,
    generatePrintMap,
    exportAsPDF,
    exportAsJPEG,
    getAvailableFormats,
    getFormatDimensions
};