import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Circle, Fill, Stroke, Text } from 'ol/style';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import ImageWMS from 'ol/source/ImageWMS';
import ImageLayer from 'ol/layer/Image';

import { 
    API_CONFIG, 
    mapState, 
    showNotification,
    exportToCSV
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

// ==================== DEPARTMENT DATA ====================
export async function loadDepartments() {
    if (buildingState.departments.length > 0) {
        return buildingState.departments;
    }

    buildingState.loading = true;

    try {
        // Mock department data based on the images provided
        const departments = [
            { id: 'CGCOGD0001', name: 'Chhattisgarh Promotion Of Regional & Traditional Society' },
            { id: 'CGCOGD0002', name: 'Archaeological Survey Of India' },
            { id: 'CGCOGD0003', name: 'Chhattisgarh Excise Department' },
            { id: 'CGCOGD0004', name: 'Chhattisgarh Forest & Climate Change' },
            { id: 'CGCOGD0005', name: 'Department Of Energy' },
            { id: 'CGCOGD0006', name: 'Chhattisgarh Legal Metrology Department' },
            { id: 'CGCOGD0007', name: 'Chhattisgarh Public Health Department' },
            { id: 'CGCOGD0008', name: 'Chhattisgarh State Agricultural Marketing(Mandi) Board' },
            { id: 'CGCOGD0009', name: 'Chhattisgarh State Minor Forest Produce Co. operative Federation Limited' },
            { id: 'CGCOGD0010', name: 'Chhattisgarh State Farmacy Council' },
            { id: 'CGCOGD0011', name: 'Chhattisgarh State Power Distribution Corporation Limited' },
            { id: 'CGCOGD0012', name: 'Chhattisgarh State Power Transmission Company Ltd' },
            { id: 'CGCOGD0013', name: 'Chhattisgarh State Skill Development Authority' },
            { id: 'CGCOGD0014', name: 'Chhattisgarh Transport Department' },
            { id: 'CGCOGD0015', name: 'Department Of Food & Civil Supplies & Consumer Protection' },
            { id: 'CGCOGD0016', name: 'Department Of Health' },
            { id: 'CGCOGD0017', name: 'Department Of Sport & Youth Welfare' },
            { id: 'CGCOGD0018', name: 'Directorate Of Employment And Training' },
            { id: 'CGCOGD0019', name: 'Directorate Of Geology And Mining' },
            { id: 'CGCOGD0020', name: 'Directorate Of Technical Education' },
            { id: 'CGCOGD0021', name: 'Farmer Welfare & Agricultural Development' },
            { id: 'CGCOGD0022', name: 'Food Corporation Of India' },
            { id: 'CGCOGD0023', name: 'Ministry Of Aviation' },
            { id: 'CGCOGD0024', name: 'Ministry Of Railway' },
            { id: 'CGCOGD0025', name: 'Naya Raipur Development Authority (NRDA)' },
            { id: 'CGCOGD0026', name: 'Directorate Of Panchayat And Rural Development' },
            { id: 'CGCOGD0027', name: 'State Urban Development Authority' },
            { id: 'CGCOGD0028', name: 'Water Resource Department' },
            { id: 'CGCOGD0029', name: 'Women And Child Development Department' },
            { id: 'CGCOGD0030', name: 'Raipur development authority' },
            { id: 'CGCOGD0031', name: 'Housing board' },
            { id: 'CGCOGD0032', name: 'Town & country planning' },
            { id: 'CGCOGD0033', name: 'Tribal' },
            { id: 'CGCOGD0034', name: 'Concor' },
            { id: 'CGCOGD0035', name: 'Directorate of Archaeology, archive and museum' },
            { id: 'CGCOGD0036', name: 'Department of culture' },
            { id: 'CGCOGD0037', name: 'Public health engineering' },
            { id: 'CGCOGD0038', name: 'Revenue and disaster management' },
            { id: 'CGCOGD0039', name: 'Home' },
            { id: 'CGCOGD0040', name: 'Commerce and industry' },
            { id: 'CGCOGD0041', name: 'Department of higher education' },
            { id: 'CGCOGD0042', name: 'Department of school education' },
            { id: 'CGCOGD0043', name: 'Directorate Of Horticulture And Farm Forestry' },
            { id: 'CGCOGD0044', name: 'Chhattisgarh Rural Road Development Department' },
            { id: 'CGCOGD0045', name: 'Chhattisgarh Tourism Board' },
            { id: 'CGCOGD0046', name: 'Chhattisgarh State Warehousing Corporation Ltd' },
            { id: 'CGCOGD0047', name: 'Directorate of Institutional Finance' },
            { id: 'CGCOGD0048', name: 'Chhattisgarh State Renewable Energy Development Agency (CREDA)' },
            { id: 'CGCOGD0049', name: 'Chhattisgarh State Industrial Development Corporation' },
            { id: 'CGCOGD0050', name: 'Directorate of Treasury Accounts and Pensions' },
            { id: 'CGCOGD0051', name: 'Department of Fishries' },
            { id: 'CGCOGD0052', name: 'Directorate of Rural Industries Sericulture' }
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
export async function fetchBuildingData(departmentId = null, searchTerm = 'महतारी') {
    buildingState.loading = true;
    
    try {
        // Build WFS request URL
        const wfsUrl = 'https://cggis.cgstate.gov.in/giscg/wmscgcog';
        
        let cqlFilter = '';
        if (departmentId && searchTerm) {
            // Match first 10 digits of gb_id with department_id AND name contains search term
            cqlFilter = `gb_id LIKE '${departmentId}%' AND name_building LIKE '%${searchTerm}%'`;
        } else if (departmentId) {
            // Only match department
            cqlFilter = `gb_id LIKE '${departmentId}%'`;
        } else if (searchTerm) {
            // Only search term
            cqlFilter = `name_building LIKE '%${searchTerm}%'`;
        }

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
        name: 'building-highlights' // Important: This name is used for click detection
    });

    if (mapState.instance) {
        mapState.instance.addLayer(vectorLayer);
        
        // Setup click listener after adding layer
        setupBuildingClickListener();
    }
}

// ==================== DISPLAY BUILDINGS ON MAP ====================
export function displayBuildingsOnMap(geojsonData) {
    if (!buildingState.buildingSource) {
        createBuildingVectorLayer();
    }

    // Clear existing features
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

        // Zoom to extent of buildings
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
export async function searchBuildings(departmentId, searchTerm) {
    if (!departmentId && !searchTerm) {
        showNotification('Please select a department or enter search term', 'warning');
        return;
    }

    try {
        showNotification('Searching buildings...', 'info');
        
        const data = await fetchBuildingData(departmentId, searchTerm);
        
        displayBuildingsOnMap(data);
        
        updateBuildingResults(data.features || []);
        
        // Add Government Buildings to legend
        if (data.features && data.features.length > 0) {
            const existingLegendItems = getCustomLegendItems();
            
            // Check if Government Buildings legend already exists
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
        item.label !== 'All Government Buildings (WMS)'
    );
    setCustomLegendItems(filteredLegendItems);
    updateLegend();

    showNotification('Results cleared', 'info');
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
        XLSX.utils.book_append_sheet(wb, ws, 'Building Report');

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