import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import {
  POST_STATUS,
  HELPER_PING_EXPIRY_MS,
  COVERED_VOTE_EXPIRY_MS,
  COVERED_VOTE_THRESHOLD,
  STILL_NEEDED_VOTE_THRESHOLD,
} from './constants'
// Note: Firebase Storage (for the optional post photo) is deliberately
// not wired up. As of late 2024, enabling Storage requires switching
// the whole Firebase project to the pay-as-you-go "Blaze" plan (usage
// would still be free at this app's scale, but it does require adding
// a billing method). Skipped for now — see README for how to add it
// back later if that trade-off becomes worth it.

// ============================================================
// Fill these in from your Firebase project settings
// (Project settings > General > Your apps > SDK setup and config).
// See README.md for the full setup walkthrough.
//
// Values are read from a .env file (see .env.example) so this
// file itself never needs to be edited or hold real secrets.
// ============================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

const POSTS_COLLECTION = 'posts'
const REPORTS_COLLECTION = 'reports'
const IDEAS_COLLECTION = 'ideas'
const BUG_REPORTS_COLLECTION = 'bugReports'
const OFFICIAL_SITE_SUGGESTIONS_COLLECTION = 'officialSiteSuggestions'

// No accounts, no login — anyone can create a post. The editToken
// is a random string only the poster receives (via the manage link
// and their own browser's localStorage). It's not a real security
// boundary, it's a "don't show delete/resolve controls to strangers"
// mechanism, matching the app's deliberately low-friction trust model.
export function generateEditToken() {
  return crypto.randomUUID()
}

export async function createPost({
  category,
  description,
  bloodTypes, // optional string[] — only meaningful when category === 'blood', see constants.js BLOOD_TYPES
  location, // { lat, lng, address }
  locationNote, // optional string — landmark/reference when the address alone isn't enough
  urgency,
  contact, // optional string
}) {
  const editToken = generateEditToken()

  const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
    category,
    description,
    bloodTypes: bloodTypes || [],
    location,
    locationNote: locationNote || null,
    urgency,
    contact: contact || null,
    status: POST_STATUS.OPEN,
    helperPings: [], // see constants.js — array of client-side ms timestamps from "Voy a ayudar" taps
    coveredVotes: [], // "Ya tienen suficiente" votes — see addCoveredVote
    stillNeededVotes: [], // "Todavía se necesita ayuda" votes — see addStillNeededVote
    editToken,
    reportCount: 0,
    createdAt: serverTimestamp(),
  })

  return { id: docRef.id, editToken }
}

// Live subscription to all posts still worth showing on Give Help
// (open, being helped, or crowd-flagged covered), newest first.
// COVERED posts are included — GiveHelp.jsx is responsible for
// graying them out and hiding them behind the "mostrar cubiertas"
// toggle, not this query — so the reciprocal "todavía se necesita
// ayuda" vote stays reachable. Resolved posts are the only ones that
// actually drop off: still readable via getPost() (e.g. from a
// manage link or an old share-image link) but no longer surfaced here.
export function listenToOpenPosts(callback) {
  const q = query(
    collection(db, POSTS_COLLECTION),
    where('status', 'in', [POST_STATUS.OPEN, POST_STATUS.IN_PROGRESS, POST_STATUS.COVERED]),
    orderBy('createdAt', 'desc'),
  )
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(posts)
  })
}

export async function getPost(postId) {
  const snap = await getDoc(doc(db, POSTS_COLLECTION, postId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Status is poster-controlled and authoritative (set only from the
// ManagePost page, gated by the editToken match). These three are the
// only transitions the poster can make — see the "Give Help status
// tracking" decision.
export async function markPostInProgress(postId) {
  await updateDoc(doc(db, POSTS_COLLECTION, postId), {
    status: POST_STATUS.IN_PROGRESS,
  })
}

export async function markPostOpen(postId) {
  await updateDoc(doc(db, POSTS_COLLECTION, postId), {
    status: POST_STATUS.OPEN,
  })
}

export async function markPostResolved(postId) {
  await updateDoc(doc(db, POSTS_COLLECTION, postId), {
    status: POST_STATUS.RESOLVED,
  })
}

// "Voy a ayudar" — a non-authoritative helper signal, separate from
// status. `currentPings` is the post's existing helperPings array
// (passed in from the caller's already-subscribed post data, so this
// doesn't need an extra read). We prune anything already past
// HELPER_PING_EXPIRY_MS before adding the new one, so the array
// doesn't grow forever and the "active" count Give Help shows always
// matches what's actually still in the document.
export async function addHelperPing(postId, currentPings = []) {
  const cutoff = Date.now() - HELPER_PING_EXPIRY_MS
  const active = currentPings.filter((t) => t > cutoff)
  active.push(Date.now())
  await updateDoc(doc(db, POSTS_COLLECTION, postId), {
    helperPings: active,
  })
}

// "Ya tienen suficiente" — see constants.js for the full design note.
// `post` is the post's current subscribed data (coveredVotes,
// stillNeededVotes, status), passed in so this doesn't need an extra
// read. Always writes coveredVotes + stillNeededVotes + status
// together (even when only one actually changes) so every write from
// this pathway has the same shape — see firestore.rules, which
// matches on that exact three-key shape rather than trying to
// special-case "field changed vs. field re-sent unchanged."
export async function addCoveredVote(postId, post) {
  const cutoff = Date.now() - COVERED_VOTE_EXPIRY_MS
  const active = (post.coveredVotes || []).filter((t) => t > cutoff)
  active.push(Date.now())

  const crossedThreshold = active.length >= COVERED_VOTE_THRESHOLD
  const canCover = post.status === POST_STATUS.OPEN || post.status === POST_STATUS.IN_PROGRESS
  const nextStatus = crossedThreshold && canCover ? POST_STATUS.COVERED : post.status

  await updateDoc(doc(db, POSTS_COLLECTION, postId), {
    coveredVotes: active,
    stillNeededVotes: post.stillNeededVotes || [],
    status: nextStatus,
  })
}

// "Todavía se necesita ayuda" — only shown once a post is COVERED.
// Crossing STILL_NEEDED_VOTE_THRESHOLD reopens the post and clears
// coveredVotes so a handful of stale votes can't immediately re-cover
// it the moment someone pings "voy a ayudar" again.
export async function addStillNeededVote(postId, post) {
  const cutoff = Date.now() - COVERED_VOTE_EXPIRY_MS
  const active = (post.stillNeededVotes || []).filter((t) => t > cutoff)
  active.push(Date.now())

  const crossedThreshold = active.length >= STILL_NEEDED_VOTE_THRESHOLD
  const reopening = crossedThreshold && post.status === POST_STATUS.COVERED

  await updateDoc(doc(db, POSTS_COLLECTION, postId), {
    coveredVotes: reopening ? [] : post.coveredVotes || [],
    stillNeededVotes: reopening ? [] : active,
    status: reopening ? POST_STATUS.OPEN : post.status,
  })
}

export async function reportPost(postId, reason) {
  await addDoc(collection(db, REPORTS_COLLECTION), {
    postId,
    reason: reason || null,
    createdAt: serverTimestamp(),
  })
}

// Feedback channels, same zero-login shape as reportPost: anyone can
// write, nobody can read/edit/delete from the client — reviewed by
// hand via the Firebase console. No confirmation email or ticket
// number, since there's no account to send one to.
export async function submitIdea(text) {
  await addDoc(collection(db, IDEAS_COLLECTION), {
    text: text.trim(),
    createdAt: serverTimestamp(),
  })
}

export async function submitBugReport(text) {
  await addDoc(collection(db, BUG_REPORTS_COLLECTION), {
    text: text.trim(),
    createdAt: serverTimestamp(),
  })
}

// "Sugerir otro" on the Give Help official sites section — same
// zero-login, write-only, hand-reviewed shape as ideas/bugReports.
// Nothing here goes live automatically: a suggestion only becomes a
// real pin/card once someone (Pali) reviews it in the Firebase
// console and adds it to OFFICIAL_SITES in officialSites.js.
export async function submitOfficialSiteSuggestion({ name, address, website, instagram, notes }) {
  await addDoc(collection(db, OFFICIAL_SITE_SUGGESTIONS_COLLECTION), {
    name: name.trim(),
    address: address.trim(),
    website: website?.trim() || null,
    instagram: instagram?.trim() || null,
    notes: notes?.trim() || null,
    createdAt: serverTimestamp(),
  })
}

// ============================================================
// Local "my posts" registry — so a poster who stays on the same
// device/browser can find and manage their own posts without a
// login, in addition to the manage link they're given at creation.
// ============================================================
const MY_POSTS_KEY = 'ayudaManizales.myPosts'

export function saveMyPost(postId, editToken) {
  const list = getMyPosts()
  list.push({ postId, editToken, savedAt: Date.now() })
  localStorage.setItem(MY_POSTS_KEY, JSON.stringify(list))
}

export function getMyPosts() {
  try {
    return JSON.parse(localStorage.getItem(MY_POSTS_KEY)) || []
  } catch {
    return []
  }
}
