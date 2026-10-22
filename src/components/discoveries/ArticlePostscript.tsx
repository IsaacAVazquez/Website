import styles from "./discoveries.module.css";

export function ArticlePostscript({ note }: { note: string }) {
  return <details className={styles.postscript}>
    <summary aria-label="Open director's commentary" title="There is a postscript under the end mark">-30-</summary>
    <aside aria-label="Director's commentary"><p>{note}</p><p className={styles.note}>A note from the build · Isaac</p></aside>
  </details>;
}
