import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import GeoJSON from "ol/format/GeoJSON";
import Polygon from 'ol/geom/Polygon';
import MultiPolygon from 'ol/geom/MultiPolygon';
import Point from 'ol/geom/Point';
import Overlay from 'ol/Overlay';

import { 
    showNotification,    
    panelState
} from '../main.js';

import { setCustomLegendItems, clearCustomLegendItems, updateLegend, getCustomLegendItems } from './layers.js';



export function setupAnalysisListeners() {
    let currentTool = panelState.analysis.currentTool || 'buffer';
    
    const bufferBtn = document.getElementById('analysis-buffer-btn');
    const proximityBtn = document.getElementById('analysis-proximity-btn');
    const statisticsBtn = document.getElementById('analysis-statistics-btn');
    
    if (currentTool === 'buffer' && bufferBtn) {
        bufferBtn.classList.add('active');
    } else if (currentTool === 'proximity' && proximityBtn) {
        proximityBtn.classList.add('active');
    } else if (currentTool === 'statistics' && statisticsBtn) {
        statisticsBtn.classList.add('active');
    }
    
    if (bufferBtn) {
        bufferBtn.addEventListener('click', () => {
            currentTool = 'buffer';
            bufferBtn.classList.add('active');
            proximityBtn?.classList.remove('active');
            statisticsBtn?.classList.remove('active');
            
            document.getElementById('buffer-options')?.classList.remove('d-none');
            document.getElementById('proximity-options')?.classList.add('d-none');
            document.getElementById('statistics-options')?.classList.add('d-none');
            
            saveAnalysisState(currentTool, panelState.analysis.bufferDistance, panelState.analysis.bufferUnits);
        });
    }
    
    if (proximityBtn) {
        proximityBtn.addEventListener('click', () => {
            currentTool = 'proximity';
            proximityBtn.classList.add('active');
            bufferBtn?.classList.remove('active');
            statisticsBtn?.classList.remove('active');
            
            document.getElementById('proximity-options')?.classList.remove('d-none');
            document.getElementById('buffer-options')?.classList.add('d-none');
            document.getElementById('statistics-options')?.classList.add('d-none');
            
            saveAnalysisState(currentTool, panelState.analysis.bufferDistance, panelState.analysis.bufferUnits);
        });
    }
    
    if (statisticsBtn) {
        statisticsBtn.addEventListener('click', () => {
            currentTool = 'statistics';
            statisticsBtn.classList.add('active');
            bufferBtn?.classList.remove('active');
            proximityBtn?.classList.remove('active');
            
            document.getElementById('statistics-options')?.classList.remove('d-none');
            document.getElementById('buffer-options')?.classList.add('d-none');
            document.getElementById('proximity-options')?.classList.add('d-none');
            
            saveAnalysisState(currentTool, panelState.analysis.bufferDistance, panelState.analysis.bufferUnits);
        });
    }

    const bufferDistanceInput = document.getElementById('buffer-distance');
    const bufferUnitsSelect = document.getElementById('buffer-units');
    
    if (bufferDistanceInput) {
        bufferDistanceInput.value = panelState.analysis.bufferDistance || 1000;
        bufferDistanceInput.addEventListener('input', (e) => {
            saveAnalysisState(currentTool, parseFloat(e.target.value), panelState.analysis.bufferUnits);
        });
    }
    
    if (bufferUnitsSelect) {
        bufferUnitsSelect.value = panelState.analysis.bufferUnits || 'm';
        bufferUnitsSelect.addEventListener('change', (e) => {
            saveAnalysisState(currentTool, panelState.analysis.bufferDistance, e.target.value);
        });
    }

    const runAnalysisBtn = document.getElementById('run-analysis-btn');
    if (runAnalysisBtn) {
        runAnalysisBtn.addEventListener('click', () => {
            showNotification(`Running ${currentTool} analysis...`, 'info');
            setTimeout(() => {
                showNotification('Analysis feature coming soon!', 'info');
            }, 1000);
        });
    }

    const clearAnalysisBtn = document.getElementById('clear-analysis-btn');
    if (clearAnalysisBtn) {
        clearAnalysisBtn.addEventListener('click', () => {
            vectorSources.analysisBuffer.clear();
            vectorSources.analysisProximity.clear();
            showNotification('Analysis results cleared', 'success');
        });
    }

    const exportAnalysisBtn = document.getElementById('export-analysis-btn');
    if (exportAnalysisBtn) {
        exportAnalysisBtn.addEventListener('click', () => {
            showNotification('Export analysis feature coming soon!', 'info');
        });
    }
}
