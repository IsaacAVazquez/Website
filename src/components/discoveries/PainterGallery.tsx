import Image from "next/image";
import { PAINTERS } from "@/lib/siteDiscoveries";
import styles from "./discoveries.module.css";

const LABELS = [
  ["Man Who Opened Another Dashboard", "After Monet", "The subject appears to be thinking about adding a filter."],
  ["Study for One More Side Project", "After Van Gogh", "The brushwork suggests the build has been running for a while."],
  ["A Sunday Afternoon With Several Tabs", "After Seurat", "Every dot is another thing I wanted to look up."],
  ["Office, After the Last Train", "After Hopper", "The dashboard is open. The train has left."],
  ["I Thought This Would Be a Small Change", "After Lichtenstein", "An estimate familiar to anyone who has built a website."],
];

export function PainterGallery() {
  return <>
    <div className={styles.gallery}>{PAINTERS.map((painter, index) => <figure className={styles.painting} key={painter}>
      <Image src={`/images/home/headshot-${painter}.webp`} alt={`Isaac's portrait in a style inspired by ${LABELS[index][1].slice(6)}`} width={480} height={600} sizes="(max-width: 640px) 90vw, 320px" loading={index < 3 ? "eager" : "lazy"} />
      <figcaption><h2>{LABELS[index][0]}</h2><p className={styles.note}>{LABELS[index][1]} · Digital study</p><p>{LABELS[index][2]}</p></figcaption>
    </figure>)}</div>
    <p className={styles.note}>Five interpretations of the same headshot. These are styled portraits, and the labels are part of the joke.</p>
  </>;
}
