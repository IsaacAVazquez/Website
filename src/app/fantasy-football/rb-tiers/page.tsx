import { permanentRedirect } from "next/navigation";

export default function RBTiersRedirectPage() {
  permanentRedirect("/fantasy-football?position=rb&scoring=ppr");
}
