import { redirect } from "next/navigation";

/** Plans and payment live on /checkout (Whop); this older address forwards there. */
export default function PremiumPage() {
  redirect("/checkout");
}
