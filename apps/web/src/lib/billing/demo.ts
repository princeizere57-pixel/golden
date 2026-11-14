// Demo payments: a pretend free trial for local development (`next dev`). Production builds,
// previews included, never allow it, so nobody on a deployed site can give themselves a plan.
// Signed in with the API up, the API's subscriptions decide the plan and the demo cookie is ignored.

export const demoPaymentsAllowed = () => process.env.NODE_ENV !== "production";
