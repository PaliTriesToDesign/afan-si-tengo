// Firestore security rules measure string length in UTF-8 *bytes*, not
// characters — this is what caused a real support issue: a donation
// list full of emoji (🏠🧼🍚) and accented Spanish (ó, í, á, ñ) looked
// like a normal-length paragraph on screen, but each emoji costs 3-4
// bytes and each accented letter costs 2, so the post silently blew
// past the byte cap and got rejected with no useful error message.
//
// This mirrors that exact measurement client-side, so any counter or
// validation shown to a poster matches what the server will actually
// enforce — no more "it looked short but got rejected anyway."
export function byteLength(str) {
  return new TextEncoder().encode(str).length;
}
