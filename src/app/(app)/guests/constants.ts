// Kept out of actions.ts deliberately — a "use server" file can only export
// async functions; a plain constant export there gets serialized into an
// opaque server-action reference instead of the real array, breaking with
// "ID_PROOF_TYPES.map is not a function" on the client. Shared by both the
// server action (actions.ts) and the client form (guest-forms.tsx).
//
// Passport and Driving License are here alongside Aadhaar/PAN specifically
// because Indian law requires Passport (not Aadhaar/PAN) to register a
// foreign national — leaving them out would mean no valid option for that
// guest.
export const ID_PROOF_TYPES = [
  "Aadhaar",
  "PAN",
  "Passport",
  "Driving License",
  "Voter ID",
  "Other",
] as const;
