import React, { useState } from 'react';

const PRESETS = {
  Flat:       [0, 0, 0, 0, 0],
  'Bass Boost':  [8, 5, 0, -2, -3],
  'Treble Boost':[-2, -1, 0, 5, 8],
  Acoustic:   [5, 3, 0, 2, 4],
  Electronic: [6, 4, -2, 3, 6],
  Vocal:      [-2, 0, 4, 4, 2],
};

const BANDS = ['60Hz', '230Hz', '910Hz', '3.6kHz', '14kHz'];

const EqualizerView = () => {
  const [enabled, setEnabled] = useState(true);
  const [activePreset, setActivePreset] = useState('Flat');
  const [gains, setGains] = useState([0, 0, 0, 0, 0]);

  const applyPreset = (name) => {
    setActivePreset(name);
    setGains(PRESETS[name]);
  };

  const updateGain = (index, value) => {
    setActivePreset(null);
    const next = [...gains];
    next[index] = Number(value);
    setGains(next);
  };

  return (
    <div className="eq-view">
      {/* Header */}
      <div className="eq-header">
        <div className="eq-title-group">
          <span className="material-symbols-rounded eq-title-icon">graphic_eq</span>
          <h1 className="eq-title">Equalizer</h1>
        </div>
        <button
          className={`eq-power-btn ${enabled ? 'on' : 'off'}`}
          onClick={() => setEnabled(!enabled)}
        >
          <span className="material-symbols-rounded">power_settings_new</span>
          <span>{enabled ? 'On' : 'Off'}</span>
        </button>
      </div>

      {/* Presets */}
      <div className="eq-section">
        <p className="eq-section-label">Presets</p>
        <div className="eq-presets">
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              className={`eq-preset-btn ${activePreset === name ? 'active' : ''} ${!enabled ? 'disabled' : ''}`}
              onClick={() => enabled && applyPreset(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className={`eq-section eq-sliders-section ${!enabled ? 'eq-disabled' : ''}`}>
        <p className="eq-section-label">Frequency Bands</p>
        <div className="eq-sliders">
          {BANDS.map((band, i) => (
            <div key={band} className="eq-band">
              <div className="eq-slider-container">
                <span className="eq-gain-value">{gains[i] > 0 ? `+${gains[i]}` : gains[i]}dB</span>
                <div className="eq-slider-wrapper">
                  <div className="eq-slider-track-bg">
                    <div 
                      className="eq-slider-fill-active"
                      style={{ 
                        height: `${((gains[i] + 12) / 24) * 100}%`,
                        background: gains[i] > 0 ? 'var(--color-primary)' : gains[i] < 0 ? '#ff5252' : '#888'
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    className="eq-slider-range"
                    min="-12"
                    max="12"
                    step="1"
                    value={gains[i]}
                    disabled={!enabled}
                    onChange={(e) => updateGain(i, e.target.value)}
                  />
                </div>
                <span className="eq-band-label">{band}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visualizer bar */}
      <div className={`eq-section eq-viz-section ${!enabled ? 'eq-disabled' : ''}`}>
        <p className="eq-section-label">Response Curve</p>
        <div className="eq-viz">
          <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="eq-svg">
            <defs>
              <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.05"/>
              </linearGradient>
            </defs>
            <path
              d={`M 0 ${50 - gains[0] * 2} Q 80 ${50 - gains[1] * 2} 160 ${50 - gains[2] * 2} Q 240 ${50 - gains[3] * 2} 320 ${50 - gains[4] * 2} L 400 ${50 - gains[4] * 2} L 400 100 L 0 100 Z`}
              fill="url(#eqGrad)"
            />
            <path
              d={`M 0 ${50 - gains[0] * 2} Q 80 ${50 - gains[1] * 2} 160 ${50 - gains[2] * 2} Q 240 ${50 - gains[3] * 2} 320 ${50 - gains[4] * 2} L 400 ${50 - gains[4] * 2}`}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default EqualizerView;
