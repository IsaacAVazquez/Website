import { redirect } from "next/navigation";

export default function RBTiersRedirectPage() {
  redirect("/fantasy-football?position=rb&scoring=ppr");
}
