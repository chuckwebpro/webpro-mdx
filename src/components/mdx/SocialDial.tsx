import { useCallback, useState } from 'react';
import styles from './SocialDial.module.css';

const CHANNELS = [
  {
    key: 'fb',
    label: 'Facebook',
    labelClass: styles.labelFb,
    angle: -135,
    roi: '6.3x',
    note: 'Est. $2,500/mo return',
    detail: 'Parent-facing community. ~0.5 new patients/mo at $5K avg case value.',
  },
  {
    key: 'tt',
    label: 'TikTok',
    labelClass: styles.labelTt,
    angle: -45,
    roi: '3.8x',
    note: 'Est. $1,500/mo return',
    detail: 'Teen veto power. Braces journeys, removal reveals, office culture.',
  },
  {
    key: 'ig',
    label: 'Instagram',
    labelClass: styles.labelIg,
    angle: 45,
    roi: '5x',
    note: 'Est. $2,000/mo return',
    detail: 'Visual proof. Before/after trust layer that supports Google conversion.',
  },
  {
    key: 'li',
    label: 'LinkedIn',
    labelClass: styles.labelLi,
    angle: 135,
    roi: '2.5x',
    note: 'Est. $1,000/mo return',
    detail: 'Dentist referral networking. Long cycle, high-value relationships.',
  },
] as const;

export function SocialDial() {
  const [selected, setSelected] = useState<number | null>(null);
  const [roiVisible, setRoiVisible] = useState(false);

  const selectChannel = useCallback((index: number) => {
    setSelected(index);
    setRoiVisible(false);
    window.setTimeout(() => setRoiVisible(true), 200);
  }, []);

  const channel = selected !== null ? CHANNELS[selected] : null;
  const needleAngle = channel?.angle ?? 0;

  return (
    <div className={styles.dial}>
      <p className={styles.heading}>Which social dial do they turn?</p>

      <div className={styles.stage}>
        {CHANNELS.map((item, index) => (
          <button
            key={item.key}
            type="button"
            className={`${styles.label} ${item.labelClass} ${
              selected === index ? styles.labelActive : ''
            }`}
            onClick={() => selectChannel(index)}
          >
            {item.label}
          </button>
        ))}

        <svg
          className={styles.svg}
          width="200"
          height="200"
          viewBox="0 0 200 200"
          role="img"
          aria-label="Rotary selector knob with four social channel positions"
        >
          <circle cx="100" cy="100" r="96" fill="none" stroke="#d9d6ce" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="82" fill="#edeae3" stroke="#d9d6ce" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="72" fill="#c4c4c4" stroke="#aaa" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="68" fill="#b8b8b8" />
          <circle cx="100" cy="100" r="10" fill="#a0a0a0" stroke="#999" strokeWidth="0.5" />
          <g
            className={styles.needle}
            style={{ transform: `rotate(${needleAngle}deg)`, transformOrigin: '100px 100px' }}
          >
            <circle cx="100" cy="38" r="5" fill="#e01a1a" />
          </g>
          <line x1="30" y1="30" x2="38" y2="38" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="170" y1="30" x2="162" y2="38" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="170" y1="170" x2="162" y2="162" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="30" y1="170" x2="38" y2="162" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div className={styles.output}>
        {channel ? (
          <div className={`${styles.roi} ${roiVisible ? styles.roiVisible : ''}`}>
            <p className={styles.roiVal}>{channel.roi}</p>
            <div className={styles.roiMeta}>
              <span>{channel.note}</span>
              <span className={styles.roiEst}>{channel.detail}</span>
            </div>
          </div>
        ) : (
          <p className={styles.idle}>Select a channel</p>
        )}
      </div>

      <p className={styles.budget}>
        Based on $400/mo spend per channel · $5,000 avg orthodontic case value
      </p>
    </div>
  );
}
