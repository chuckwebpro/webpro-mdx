import type { ReactNode } from 'react';
import styles from './Channel.module.css';

export function ChannelTable({ children }: { children?: ReactNode }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Channel</th>
          <th>What it does</th>
          <th>Orthodontic fit</th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

interface ChannelRowProps {
  channel: string;
  does: string;
  children?: ReactNode;
}

export function ChannelRow({ channel, does, children }: ChannelRowProps) {
  return (
    <tr>
      <td className={styles.channelName}>{channel}</td>
      <td>{does}</td>
      <td>{children}</td>
    </tr>
  );
}
