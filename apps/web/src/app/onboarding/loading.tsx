import { ClawLoader } from "@/components/claw-loader";

/** The shining claw belongs to onboarding only (never between features): shown while it loads. */
export default function Loading() {
  return <ClawLoader />;
}
