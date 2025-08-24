import {
  seedFromString, randInt, randFloat, closedCRtoBezier, generatePoints
} from './utils.js';

const BlobApp = {
  state: {
    mode: 'basic',
    seed: 380098792,
    points: 5,
    variance: 0.39,
    smooth: 1.05,
    jitter: 0,
  },

  el: {},
  
  FIXED_RADIUS: 150,
  FIXED_FILL: '#6fe1c5',

  init() {
    this.cacheDOMElements();
    this.loadStateFromURL();
    this.syncUIToState();
    this.bindEvents();
    this.setMode(this.state.mode);
    this.render();
  },

  cacheDOMElements() {
    const ids = [
      'mode', 'basicControls', 'advancedControls', 'basicGenerate', 'randomize',
      'points', 'points_num', 'variance', 'variance_num', 'smooth', 'smooth_num',
      'jitter', 'jitter_num',
      'svg', 'blob', 'toast', 'aria-notifications'
    ];
    ids.forEach(id => this.el[id] = document.getElementById(id));
    
    this.el.copyPathBtns = document.querySelectorAll('.copy-path');
    this.el.copySvgBtns = document.querySelectorAll('.copy-svg');
    this.el.downloadSvgBtns = document.querySelectorAll('.download-svg');
  },

  bindEvents() {
    this.el.advancedControls.addEventListener('input', e => {
      if (!e.target.id) return;
      
      const { id, value } = e.target;
      const stateKey = id.replace('_num', '');
      
      this.state[stateKey] = +value;
      this.syncUIProperty(stateKey);
      this.render();
      this.updateURL();
    });

    this.el.mode.addEventListener('change', e => this.setMode(e.target.value));
    this.el.randomize.addEventListener('click', () => this.randomizeSeed());
    this.el.basicGenerate.addEventListener('click', () => this.generateRandomBasic());

    this.el.copyPathBtns.forEach(btn => btn.addEventListener('click', () => this.copyData(this.el.blob.getAttribute('d'), "Path copied!")));
    this.el.copySvgBtns.forEach(btn => btn.addEventListener('click', () => this.copyData(this.currentSvgText(), "SVG code copied!")));
    this.el.downloadSvgBtns.forEach(btn => btn.addEventListener('click', () => this.downloadSvg()));
  },

  render() {
    const oldPath = this.el.blob.getAttribute('d');
    const generationParams = { ...this.state, radius: this.FIXED_RADIUS };
    const points = generatePoints(generationParams);
    const newPath = closedCRtoBezier(points, this.state.smooth);

    if (!oldPath || oldPath === newPath) {
      this.el.blob.setAttribute('d', newPath);
      return;
    }
    
    const animateEl = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animateEl.setAttribute('attributeName', 'd');
    animateEl.setAttribute('from', oldPath);
    animateEl.setAttribute('to', newPath);
    animateEl.setAttribute('dur', '0.5s'); // Duración ajustada
    animateEl.setAttribute('fill', 'freeze');

    // --- ¡LA CURVA CORREGIDA Y VÁLIDA! ---
    // calcMode="spline" nos permite definir una curva de aceleración personalizada.
    animateEl.setAttribute('calcMode', 'spline');
    // keyTimes debe corresponder a los puntos en la línea de tiempo (inicio y fin).
    animateEl.setAttribute('keyTimes', '0; 1');
    // keySplines define la curva de Bézier para la aceleración.
    // Este valor (0.16, 1, 0.3, 1) crea una curva "ease-out-expo" que es muy dinámica y válida en SVG.
    animateEl.setAttribute('keySplines', '0.16 1 0.3 1');

    animateEl.addEventListener('endEvent', () => {
      this.el.blob.setAttribute('d', newPath);
      this.el.blob.innerHTML = '';
    });

    this.el.blob.innerHTML = '';
    this.el.blob.appendChild(animateEl);

    animateEl.beginElement();
  },
  
  loadStateFromURL() {
    if (!window.location.hash) return;
    try {
      const params = new URLSearchParams(window.location.hash.substring(1));
      for (const [key, value] of params) {
        if (this.state.hasOwnProperty(key)) {
          this.state[key] = isNaN(Number(value)) ? value : Number(value);
        }
      }
    } catch (error) {
      console.error("Failed to parse state from URL hash.", error);
    }
  },

  updateURL() {
    const params = new URLSearchParams(this.state);
    window.location.hash = params.toString();
  },

  syncUIToState() {
    for (const key in this.state) {
      this.syncUIProperty(key);
    }
  },

  syncUIProperty(key) {
    const value = this.state[key];
    const elRange = this.el[key];
    const elNum = this.el[`${key}_num`];
    if (elRange) elRange.value = value;
    if (elNum) elNum.value = value;
  },

  setMode(mode) {
    this.state.mode = mode;
    this.el.mode.value = mode;
    this.el.basicControls.classList.toggle('hidden', mode !== 'basic');
    this.el.advancedControls.classList.toggle('hidden', mode !== 'advanced');
  },

  randomizeSeed() {
    this.state.seed = randInt(1, 2 ** 31);
    this.render();
    this.updateURL();
  },
  
  generateRandomBasic() {
    this.state.seed = randInt(1, 2 ** 31);
    this.state.points = 5;
    this.state.variance = 0.39;
    this.state.smooth = 1.05;
    this.state.jitter = 0;
    this.syncUIToState();
    this.render();
    this.updateURL();
  },

  showToast(message) {
    this.el.toast.textContent = message;
    this.el.toast.classList.add('show');
    this.updateAriaLive(message);
    setTimeout(() => this.el.toast.classList.remove('show'), 2000);
  },
  
  updateAriaLive(message) {
    this.el['aria-notifications'].textContent = message;
  },

  async copyData(data, message) {
    try {
      await navigator.clipboard.writeText(data);
      this.showToast(message);
    } catch (err) {
      this.showToast("Failed to copy!");
      console.error('Failed to copy: ', err);
    }
  },
  
  currentSvgText() {
    const bbox = this.el.blob.getBBox();
    const padding = 2;
    const x = bbox.x - padding;
    const y = bbox.y - padding;
    const w = Math.round(bbox.width) + (padding * 2);
    const h = Math.round(bbox.height) + (padding * 2);
    const path = `<path d="${this.el.blob.getAttribute('d')}" fill="${this.FIXED_FILL}"/>`;
    const viewBox = `${x.toFixed(2)} ${y.toFixed(2)} ${w} ${h}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}">${path}</svg>`;
    return `<?xml version="1.0" standalone="no"?>\n${svg}`;
  },

  downloadSvg() {
    const filename = `blob-${this.state.seed}.svg`;
    const blob = new Blob([this.currentSvgText()], { type: 'image/svg+xml' });
    this.triggerDownload(URL.createObjectURL(blob), filename);
  },
  
  triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
};

document.addEventListener('DOMContentLoaded', () => BlobApp.init());
