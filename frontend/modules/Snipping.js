import styles from './../styles/Home.module.css';

export const Snipping = () => {
  return (
    <div className={`${styles.mint_snipping} z-100 fixed h-full w-full left-0 top-0`}>
      <div className={`${styles.sk_chase}`}>
        <div className={`${styles.sk_chase_dot}`}></div>
        <div className={`${styles.sk_chase_dot}`}></div>
        <div className={`${styles.sk_chase_dot}`}></div>
        <div className={`${styles.sk_chase_dot}`}></div>
        <div className={`${styles.sk_chase_dot}`}></div>
        <div className={`${styles.sk_chase_dot}`}></div>
      </div>
    </div>
  )
}