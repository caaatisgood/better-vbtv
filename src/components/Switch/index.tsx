import styles from './Switch.module.css';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Switch = (props: SwitchProps) => {
  return (
    <label class={styles.switch}>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={() => props.onChange(!props.checked)}
      />
      <span class={styles.slider}></span>
    </label>
  );
};
