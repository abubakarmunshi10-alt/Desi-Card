import React, { useState, useEffect, useRef } from "react";
import { Coins, Crown, Target, Shuffle, RotateCcw, ChevronRight, Info, Search, Plus, Globe, X, Settings, Bell, Headphones, Trophy, ShieldAlert } from "lucide-react";

/* ============================================================
   দেশি কার্ড — single-device prototype
   Simplifications vs. the full spec (flagged, not silently skipped):
   - No real Facebook login / friends graph — invite list is mock data.
   - No real backend — one browser tab, bots simulate other players.
   - "Coins flying across the table" is shown as floating +/- badges on
     each seat rather than a literal animated path (no stable seat
     coordinates to animate between in this layout).
   - Language switcher covers interface chrome; round-by-round log
     stays in Bengali.
   ============================================================ */

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const SUITS = ["♠", "♥", "♦", "♣"];
const RED_SUITS = ["♥", "♦"];
const BOT_NAMES = ["রাহুল", "মিতা", "সাগর", "নদী", "তুষার", "প্রিয়া", "অর্ণব"];
const MOCK_FRIENDS = [
  { name: "কামাল", online: true, board: null, accountNumber: "AC10234581", playsGame: true },
  { name: "শিমু", online: true, board: "সিলভার বোর্ড", accountNumber: "AC10234582", playsGame: true },
  { name: "ফাহিম", online: false, board: null, accountNumber: "AC10234583", playsGame: true },
  { name: "নিতু", online: true, board: null, accountNumber: "AC10234584", playsGame: false },
  { name: "রাজিব", online: false, board: null, accountNumber: "AC10234585", playsGame: false },
];

function genAccountNumber() {
  return "AC" + Math.floor(10000000 + Math.random() * 89999999);
}

const MOCK_NOTICES = [
  { id: "n1", type: "notice", text: "দেশি কার্ডে স্বাগতম! খেলার নিয়মকানুন মেনু থেকে দেখে নিন।" },
];

const BET_PRESETS = [500, 1000, 5000, 10000, 15000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 150000, 200000, 500000, 1000000];

const BOARD_TIERS = [
  { key: "bronze", name: "ব্রোঞ্জ বোর্ড", min: 1, max: 1000, accent: "#C9A227" },
  { key: "silver", name: "সিলভার বোর্ড", min: 1000, max: 10000, accent: "#B8C4CE" },
  { key: "gold", name: "গোল্ড বোর্ড", min: 10000, max: 100000, accent: "#E8A33D" },
  { key: "diamond", name: "ডায়মন্ড বোর্ড", min: 100000, max: 10000000, accent: "#7FD8D0" },
];

const LANGS = {
  bn: {
    appTitle: "দেশি কার্ড", newBoard: "নিউ বোর্ড", search: "সার্চ", searchDesc: "আপনার ব্যালেন্স অনুযায়ী একটা বোর্ডে ঢুকিয়ে দেবে",
    chooseBoard: "বোর্ড বেছে নিন", yourBalance: "আপনার ব্যালেন্স", insufficient: "পর্যাপ্ত ব্যালেন্স নেই",
    maxPlayers: "সর্বোচ্চ খেলোয়াড় (২-৮)", buyIn: "বাই-ইন লিখুন", invite: "ফ্রেন্ড ইনভাইট করুন (মক)", startTable: "টেবিলে বসুন",
    back: "ফিরে যান", leaveTable: "টেবিল ছাড়ুন", round: "রাউন্ড", totalRounds: "মোট রাউন্ড", deck: "ডেক",
    dealerSide: "এপাশ (ডিলার)", selectorSide: "ওপাশ (সিলেক্টর)", yourTurn: "আপনার পালা — একটি কার্ড সিলেক্ট করুন",
    pickSuit: "প্রথমে স্যুট বেছে নিন", pickRank: "এখন কার্ড বেছে নিন", yourBet: "আপনার বাজি বেছে নিন", confirm: "নিশ্চিত করুন",
    othersBetting: "বাকিরা বাজি ধরছে / সিলেক্টর কার্ড বাছছে…", betOn: "বাজি ধরুন", noBet: "বাজি ধরবো না",
    reviewTitle: "বিপরীত বাজি রিভিউ করুন", accept: "গ্রহণ", reject: "বাতিল", mandatory: "বাধ্যতামূলক",
    revealing: "কার্ড উল্টানো হচ্ছে…", dealerWon: "ডিলার জিতেছে", selectorWon: "সিলেক্টর জিতেছে", nextRound: "পরবর্তী রাউন্ড",
    boardClosed: "বোর্ড বন্ধ হয়ে গেছে", newTable: "নতুন টেবিলে বসুন", commissionNote: "বিজয়ীর কয়েন থেকে ২% কমিশন কাটা হয়েছে",
    menu: "মেনু", rules: "খেলার নিয়ম",
    signup: "সাইন আপ", signin: "সাইন ইন", yourName: "আপনার নাম", phoneNumber: "ফোন নাম্বার",
    password: "পাসওয়ার্ড", rePassword: "পাসওয়ার্ড আবার লিখুন", accountNumberLabel: "অ্যাকাউন্ট নাম্বার",
    accountCreatedTitle: "আপনার অ্যাকাউন্ট নাম্বার (মনে রাখুন)", accountCreatedMsg: "অ্যাকাউন্ট তৈরি হয়ে গেছে, হোমপেজে নিয়ে যাওয়া হচ্ছে…",
    wrongCredentials: "অ্যাকাউন্ট নাম্বার বা পাসওয়ার্ড ভুল।", demoAuthNote: "এটা একটা ডেমো লগইন — অ্যাকাউন্ট শুধু এই সেশনে থাকে, আসল ব্যাকএন্ড/ডাটাবেজ যুক্ত হলে স্থায়ীভাবে সংরক্ষিত হবে।",
    invalidName: "নাম লিখুন।", invalidPhone: "সঠিক ফোন নাম্বার লিখুন।", phoneExists: "এই ফোন নাম্বার দিয়ে আগে থেকেই একটা অ্যাকাউন্ট আছে।",
    passwordShort: "পাসওয়ার্ড অন্তত ৪ ক্যারেক্টার হতে হবে।", passwordMismatch: "দুইবার দেওয়া পাসওয়ার্ড মিলছে না।",
    coinSection: "কয়েন", requestCoins: "কয়েন রিকোয়েস্ট করুন", returnCoins: "অবশিষ্ট কয়েন ফেরত দিন", enterAmount: "পরিমাণ লিখুন",
    requestBtn: "রিকোয়েস্ট", returnBtn: "ফেরত দিন", coinHelpNote: "দুটোই কাস্টমার কেয়ারের সাথে চ্যাট ওপেন করবে, পরিমাণটা অটো বসে যাবে।",
    settingsTitle: "সেটিংস", soundLabel: "সাউন্ড এফেক্ট (কার্ড ও কয়েনের শব্দ)", autoBuyInLabel: "অটো বাই-ইন (শেষবার ব্যবহৃত পরিমাণ মনে রাখবে)",
    adminLink: "অ্যাডমিন প্যানেল (ডেমো)", fbNote: "ফেসবুক ফ্রেন্ড ইনভাইট এখন \"নিউ বোর্ড\" পেজের ভেতরে — সেখানে গিয়ে \"Connect with Facebook\" চাপুন।",
    totalReceived: "মোট নেওয়া", totalLoss: "মোট লস", netLabel: "নেট",
    notifTitle: "নোটিফিকেশন", boardInvites: "বোর্ড ইনভাইট", companyNotices: "গেম কোম্পানির নোটিশ", noticeInviteText: "আপনাকে খেলার জন্য আমন্ত্রণ জানিয়েছে বোর্ডে:",
    ccTitle: "কাস্টমার কেয়ার", ccWelcome: "স্বাগতম! আপনাকে কীভাবে সাহায্য করতে পারি?", ccPlaceholder: "মেসেজ লিখুন…", ccSend: "পাঠান",
    ccAutoReply: "ধন্যবাদ, শীঘ্রই একজন প্রতিনিধি আপনার সাথে যোগাযোগ করবেন।",
    ccRequestMsg: "প্লেয়ার কয়েনের জন্য রিকোয়েস্ট করেছে:", ccReturnMsg: "প্লেয়ার কয়েন ফেরত দিতে চেয়েছে:",
    leaderboardTitle: "লিডারবোর্ড", xpTab: "অভিজ্ঞতা লেভেল", profitTab: "টপ উইনার্স", betsSuffix: "বাজি",
    adminTitle: "অ্যাডমিন প্যানেল (ডেমো)", adminNote: "আসল অ্যাডমিন সিস্টেমের জন্য ব্যাকএন্ড + অ্যাডমিন লগইন লাগবে — এটা শুধু UI ডেমো।",
    coinRequestsTitle: "কয়েন রিকোয়েস্ট", noPending: "কোনো পেন্ডিং রিকোয়েস্ট নেই।", approve: "অ্যাপ্রুভ", approvedLabel: "অ্যাপ্রুভড", rejectedLabel: "রিজেক্টেড",
    banTitle: "প্লেয়ার ব্যান করুন", banAccPlaceholder: "অ্যাকাউন্ট নাম্বার", banBtn: "ব্যান করুন",
    durWeek: "১ সপ্তাহ", durMonth: "১ মাস", durYear: "১ বছর", durForever: "আজীবন",
    searchNeedsCoin: "প্রথমে হোমপেজ থেকে কয়েনের জন্য রিকোয়েস্ট করুন।",
    inviteByAccount: "অ্যাকাউন্ট নাম্বার দিয়ে ফ্রেন্ড ইনভাইট করুন", searchBtn: "সার্চ", notFound: "এই অ্যাকাউন্ট নাম্বারে কেউ পাওয়া যায়নি।",
    inviteSent: "ইনভাইট পাঠানো হয়েছে ✓", sendInvite: "ইনভাইট পাঠান", fbInviteTitle: "ফেসবুক দিয়ে ইনভাইট",
    fbFriendsWhoPlay: "এই গেমটি খেলে এমন ফেসবুক ফ্রেন্ডরা:", onlineLabel: "অনলাইন", offlineLabel: "অফলাইন", invitedListLabel: "ইনভাইট করা হয়েছে:",
  },
  en: {
    appTitle: "Deshi Card", newBoard: "New Board", search: "Search", searchDesc: "Auto-joins a board that matches your balance",
    chooseBoard: "Choose a board", yourBalance: "Your balance", insufficient: "Not enough balance",
    maxPlayers: "Max players (2-8)", buyIn: "Enter buy-in", invite: "Invite friends (mock)", startTable: "Sit at table",
    back: "Back", leaveTable: "Leave table", round: "Round", totalRounds: "Total rounds", deck: "Deck",
    dealerSide: "This side (Dealer)", selectorSide: "That side (Selector)", yourTurn: "Your turn — pick a card",
    pickSuit: "Pick a suit first", pickRank: "Now pick a card", yourBet: "Pick your bet", confirm: "Confirm",
    othersBetting: "Others are betting / selector is picking…", betOn: "Bet on", noBet: "No bet",
    reviewTitle: "Review opposing bets", accept: "Accept", reject: "Reject", mandatory: "Mandatory",
    revealing: "Flipping cards…", dealerWon: "Dealer won", selectorWon: "Selector won", nextRound: "Next round",
    boardClosed: "Board closed", newTable: "Sit at a new table", commissionNote: "2% commission cut from the winner's coins",
    menu: "Menu", rules: "Game rules",
    signup: "Sign up", signin: "Sign in", yourName: "Your name", phoneNumber: "Phone number",
    password: "Password", rePassword: "Re-enter password", accountNumberLabel: "Account number",
    accountCreatedTitle: "Your account number (remember it)", accountCreatedMsg: "Account created, taking you to the home page…",
    wrongCredentials: "Wrong account number or password.", demoAuthNote: "This is a demo login — the account only lasts this session; a real backend/database will make it permanent.",
    invalidName: "Please enter your name.", invalidPhone: "Please enter a valid phone number.", phoneExists: "An account already exists with this phone number.",
    passwordShort: "Password must be at least 4 characters.", passwordMismatch: "The two passwords don't match.",
    coinSection: "Coins", requestCoins: "Request coins", returnCoins: "Return remaining coins", enterAmount: "Enter amount",
    requestBtn: "Request", returnBtn: "Return", coinHelpNote: "Both open a customer care chat with the amount pre-filled.",
    settingsTitle: "Settings", soundLabel: "Sound effects (cards & coins)", autoBuyInLabel: "Auto buy-in (remember last amount)",
    adminLink: "Admin panel (demo)", fbNote: "Facebook friend invites are now inside \"New Board\" — tap \"Connect with Facebook\" there.",
    totalReceived: "Total received", totalLoss: "Total loss", netLabel: "Net",
    notifTitle: "Notifications", boardInvites: "Board invites", companyNotices: "Company notices", noticeInviteText: "invited you to play on board:",
    ccTitle: "Customer care", ccWelcome: "Welcome! How can we help?", ccPlaceholder: "Type a message…", ccSend: "Send",
    ccAutoReply: "Thanks, a representative will reach out shortly.",
    ccRequestMsg: "Player requested coins:", ccReturnMsg: "Player wants to return coins:",
    leaderboardTitle: "Leaderboard", xpTab: "Experience level", profitTab: "Top winners", betsSuffix: "bets",
    adminTitle: "Admin panel (demo)", adminNote: "A real admin system needs a backend + admin login — this is UI only.",
    coinRequestsTitle: "Coin requests", noPending: "No pending requests.", approve: "Approve", approvedLabel: "Approved", rejectedLabel: "Rejected",
    banTitle: "Ban a player", banAccPlaceholder: "Account number", banBtn: "Ban",
    durWeek: "1 week", durMonth: "1 month", durYear: "1 year", durForever: "Forever",
    searchNeedsCoin: "Please request coins from the home page first.",
    inviteByAccount: "Invite a friend by account number", searchBtn: "Search", notFound: "No one found with this account number.",
    inviteSent: "Invite sent ✓", sendInvite: "Send invite", fbInviteTitle: "Invite via Facebook",
    fbFriendsWhoPlay: "Facebook friends who play this game:", onlineLabel: "Online", offlineLabel: "Offline", invitedListLabel: "Invited:",
  },
  hi: {
    appTitle: "देसी कार्ड", newBoard: "नया बोर्ड", search: "सर्च", searchDesc: "आपके बैलेंस के हिसाब से बोर्ड में डाल देगा",
    chooseBoard: "बोर्ड चुनें", yourBalance: "आपका बैलेंस", insufficient: "पर्याप्त बैलेंस नहीं",
    maxPlayers: "अधिकतम खिलाड़ी (2-8)", buyIn: "बाय-इन लिखें", invite: "फ्रेंड्स इनवाइट करें (मॉक)", startTable: "टेबल पर बैठें",
    back: "वापस", leaveTable: "टेबल छोड़ें", round: "राउंड", totalRounds: "कुल राउंड", deck: "डेक",
    dealerSide: "इस तरफ (डीलर)", selectorSide: "उस तरफ (सिलेक्टर)", yourTurn: "आपकी बारी — एक कार्ड चुनें",
    pickSuit: "पहले सूट चुनें", pickRank: "अब कार्ड चुनें", yourBet: "अपना दांव चुनें", confirm: "पुष्टि करें",
    othersBetting: "बाकी लोग दांव लगा रहे हैं…", betOn: "दांव लगाएं", noBet: "दांव नहीं",
    reviewTitle: "विरोधी दांव रिव्यू करें", accept: "स्वीकार", reject: "अस्वीकार", mandatory: "अनिवार्य",
    revealing: "कार्ड पलटे जा रहे हैं…", dealerWon: "डीलर जीता", selectorWon: "सिलेक्टर जीता", nextRound: "अगला राउंड",
    boardClosed: "बोर्ड बंद हो गया", newTable: "नई टेबल पर बैठें", commissionNote: "विजेता के कॉइन से 2% कमीशन काटा गया",
    menu: "मेन्यू", rules: "खेल के नियम",
    signup: "साइन अप", signin: "साइन इन", yourName: "आपका नाम", phoneNumber: "फोन नंबर",
    password: "पासवर्ड", rePassword: "पासवर्ड दोबारा लिखें", accountNumberLabel: "अकाउंट नंबर",
    accountCreatedTitle: "आपका अकाउंट नंबर (याद रखें)", accountCreatedMsg: "अकाउंट बन गया, होमपेज पर ले जाया जा रहा है…",
    wrongCredentials: "अकाउंट नंबर या पासवर्ड गलत है।", demoAuthNote: "यह एक डेमो लॉगिन है — अकाउंट सिर्फ इस सेशन में रहेगा, असली बैकएंड/डेटाबेस जुड़ने पर स्थायी होगा।",
    invalidName: "नाम लिखें।", invalidPhone: "सही फोन नंबर लिखें।", phoneExists: "इस फोन नंबर से पहले से एक अकाउंट है।",
    passwordShort: "पासवर्ड कम से कम 4 अक्षर का होना चाहिए।", passwordMismatch: "दोनों पासवर्ड मेल नहीं खाते।",
    coinSection: "कॉइन", requestCoins: "कॉइन रिक्वेस्ट करें", returnCoins: "बचे हुए कॉइन वापस करें", enterAmount: "राशि लिखें",
    requestBtn: "रिक्वेस्ट", returnBtn: "वापस करें", coinHelpNote: "दोनों कस्टमर केयर चैट खोलेंगे, राशि अपने आप भर जाएगी।",
    settingsTitle: "सेटिंग्स", soundLabel: "साउंड इफेक्ट (कार्ड व कॉइन की आवाज़)", autoBuyInLabel: "ऑटो बाय-इन (पिछली राशि याद रखेगा)",
    adminLink: "एडमिन पैनल (डेमो)", fbNote: "फेसबुक फ्रेंड इनवाइट अब \"नया बोर्ड\" पेज के अंदर है — वहां \"Connect with Facebook\" दबाएं।",
    totalReceived: "कुल प्राप्त", totalLoss: "कुल नुकसान", netLabel: "नेट",
    notifTitle: "नोटिफिकेशन", boardInvites: "बोर्ड इनवाइट", companyNotices: "कंपनी की सूचनाएं", noticeInviteText: "ने आपको इस बोर्ड पर खेलने के लिए आमंत्रित किया:",
    ccTitle: "कस्टमर केयर", ccWelcome: "स्वागत है! हम आपकी कैसे मदद कर सकते हैं?", ccPlaceholder: "मेसेज लिखें…", ccSend: "भेजें",
    ccAutoReply: "धन्यवाद, जल्द ही एक प्रतिनिधि आपसे संपर्क करेगा।",
    ccRequestMsg: "प्लेयर ने कॉइन के लिए रिक्वेस्ट की:", ccReturnMsg: "प्लेयर कॉइन वापस करना चाहता है:",
    leaderboardTitle: "लीडरबोर्ड", xpTab: "अनुभव स्तर", profitTab: "टॉप विनर्स", betsSuffix: "दांव",
    adminTitle: "एडमिन पैनल (डेमो)", adminNote: "असली एडमिन सिस्टम के लिए बैकएंड + एडमिन लॉगिन चाहिए — यह सिर्फ UI डेमो है।",
    coinRequestsTitle: "कॉइन रिक्वेस्ट", noPending: "कोई पेंडिंग रिक्वेस्ट नहीं।", approve: "अप्रूव", approvedLabel: "अप्रूव्ड", rejectedLabel: "रिजेक्टेड",
    banTitle: "प्लेयर को बैन करें", banAccPlaceholder: "अकाउंट नंबर", banBtn: "बैन करें",
    durWeek: "1 सप्ताह", durMonth: "1 महीना", durYear: "1 साल", durForever: "हमेशा के लिए",
    searchNeedsCoin: "पहले होमपेज से कॉइन के लिए रिक्वेस्ट करें।",
    inviteByAccount: "अकाउंट नंबर से फ्रेंड इनवाइट करें", searchBtn: "सर्च", notFound: "इस अकाउंट नंबर पर कोई नहीं मिला।",
    inviteSent: "इनवाइट भेजा गया ✓", sendInvite: "इनवाइट भेजें", fbInviteTitle: "फेसबुक से इनवाइट करें",
    fbFriendsWhoPlay: "यह गेम खेलने वाले फेसबुक फ्रेंड्स:", onlineLabel: "ऑनलाइन", offlineLabel: "ऑफलाइन", invitedListLabel: "इनवाइट किए गए:",
  },
};

/* ---------------- sound effects (synthesized, no audio files needed) ---------------- */
let audioCtx = null;
let soundEnabled = true;
function setSoundEnabled(v) { soundEnabled = v; }
function getCtx() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
function playCoinSound() {
  if (!soundEnabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  [1100, 1500, 1900].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.06);
    gain.gain.setValueAtTime(0.0001, now + i * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.14, now + i * 0.06 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + i * 0.06);
    osc.stop(now + i * 0.06 + 0.32);
  });
}
function playCardSound() {
  if (!soundEnabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const bufferSize = Math.floor(ctx.sampleRate * 0.1);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 3200;
  filter.Q.value = 0.6;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start(now);
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5 cursor-pointer">
      <span className="text-[12px] text-[#F3EAD3]/80">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition relative shrink-0 ${checked ? "bg-[#C9A227]" : "bg-white/15"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition ${checked ? "left-4" : "left-0.5"}`} />
      </button>
    </label>
  );
}

function bn(num) {
  return Math.round(num).toLocaleString("bn-BD");
}
function fmt(num, lang) {
  return lang === "bn" ? bn(num) : Math.round(num).toLocaleString();
}
function buildDeck() {
  const deck = [];
  let id = 0;
  for (const rank of RANKS) for (const suit of SUITS) deck.push({ id: id++, rank, suit });
  return deck;
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function Coin({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <defs>
        <radialGradient id="coinGrad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#F4D488" />
          <stop offset="55%" stopColor="#D9A22B" />
          <stop offset="100%" stopColor="#93650F" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="url(#coinGrad)" stroke="#6B4A0E" strokeWidth="1" />
      <circle cx="16" cy="16" r="11" fill="none" stroke="#6B4A0E" strokeWidth="0.75" opacity="0.6" />
      <path d="M16 9 L18.5 14 L23 15 L19.5 18.3 L20.4 23 L16 20.6 L11.6 23 L12.5 18.3 L9 15 L13.5 14 Z" fill="#6B4A0E" opacity="0.55" />
    </svg>
  );
}

function CardFace({ card, back = false, small = false, locked = false }) {
  const w = small ? 34 : 46;
  const h = small ? 48 : 64;
  if (back || !card) {
    return (
      <div style={{ width: w, height: h }} className="rounded-md border-2 border-[#C9A227]/70 bg-gradient-to-br from-[#123B2C] to-[#0A2921] shadow-md flex items-center justify-center">
        <div className="w-2/3 h-2/3 rounded-sm border border-[#C9A227]/40" />
      </div>
    );
  }
  const isRed = RED_SUITS.includes(card.suit);
  return (
    <div style={{ width: w, height: h }} className={`rounded-md bg-[#F3EAD3] shadow-md flex flex-col items-center justify-center border ${locked ? "border-[#7FD8D0] border-2" : "border-black/10"} leading-none`}>
      <span className={`font-bold ${small ? "text-xs" : "text-sm"} ${isRed ? "text-[#B33A3A]" : "text-[#1a1a1a]"}`}>{card.rank}</span>
      <span className={`${small ? "text-sm" : "text-lg"} ${isRed ? "text-[#B33A3A]" : "text-[#1a1a1a]"}`}>{card.suit}</span>
    </div>
  );
}

function KeyframeStyles() {
  return (
    <style>{`
      @keyframes floatUp { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-38px); opacity: 0; } }
      .float-badge { animation: floatUp 1.3s ease-out forwards; }
    `}</style>
  );
}

/* ---------------- Auth (sign up / sign in) ---------------- */
function AuthScreen({ lang, setLang, registeredPhones, onSignup, onSignin, signinError }) {
  const t = LANGS[lang];
  const [mode, setMode] = useState("signup");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [accountNumber, setAccountNumber] = useState(null);
  const [error, setError] = useState("");

  const [siAccount, setSiAccount] = useState("");
  const [siPassword, setSiPassword] = useState("");

  function handleSignup() {
    setError("");
    if (!name.trim()) return setError(t.invalidName);
    if (!/^[0-9+]{7,15}$/.test(phone)) return setError(t.invalidPhone);
    if (registeredPhones.includes(phone)) return setError(t.phoneExists);
    if (password.length < 4) return setError(t.passwordShort);
    if (password !== rePassword) return setError(t.passwordMismatch);
    const acc = genAccountNumber();
    setAccountNumber(acc);
    onSignup({ name, phone, password, accountNumber: acc });
  }

  return (
    <div className="min-h-screen bg-[#0A2921] text-[#F3EAD3] flex flex-col items-center justify-center px-4 py-10" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-1">
            <Globe size={13} className="text-[#F3EAD3]/50" />
            {Object.keys(LANGS).map((k) => (
              <button key={k} onClick={() => setLang(k)} className={`text-[11px] px-1.5 py-0.5 rounded-full ${lang === k ? "bg-[#C9A227] text-[#0A2921] font-semibold" : "text-[#F3EAD3]/50"}`}>
                {k.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-1 text-[#E8C46A]" style={{ fontFamily: "'Baloo Da 2', sans-serif" }}>{t.appTitle}</h1>
        <div className="flex gap-2 my-6">
          <button onClick={() => { setMode("signup"); setError(""); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${mode === "signup" ? "bg-[#C9A227] text-[#0A2921]" : "bg-white/10"}`}>{t.signup}</button>
          <button onClick={() => { setMode("signin"); setError(""); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${mode === "signin" ? "bg-[#C9A227] text-[#0A2921]" : "bg-white/10"}`}>{t.signin}</button>
        </div>

        {mode === "signup" && !accountNumber && (
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.yourName}
              className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2.5 text-sm outline-none" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.phoneNumber} inputMode="tel"
              className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2.5 text-sm outline-none" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.password}
              className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2.5 text-sm outline-none" />
            <input type="password" value={rePassword} onChange={(e) => setRePassword(e.target.value)} placeholder={t.rePassword}
              className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2.5 text-sm outline-none" />
            {error && <div className="text-[12px] text-[#B33A3A]">{error}</div>}
            <button onClick={handleSignup} className="w-full py-2.5 rounded-lg bg-[#C9A227] text-[#0A2921] font-bold text-sm">{t.signup}</button>
          </div>
        )}

        {mode === "signup" && accountNumber && (
          <div className="text-center bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-[12px] text-[#F3EAD3]/60 mb-1">{t.accountCreatedTitle}</div>
            <div className="text-xl font-bold text-[#E8C46A] tracking-wider mb-3">{accountNumber}</div>
            <div className="text-[11px] text-[#F3EAD3]/50">{t.accountCreatedMsg}</div>
          </div>
        )}

        {mode === "signin" && (
          <div className="space-y-3">
            <input value={siAccount} onChange={(e) => setSiAccount(e.target.value)} placeholder={t.accountNumberLabel}
              className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2.5 text-sm outline-none" />
            <input type="password" value={siPassword} onChange={(e) => setSiPassword(e.target.value)} placeholder={t.password}
              className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2.5 text-sm outline-none" />
            {signinError && <div className="text-[12px] text-[#B33A3A]">{signinError}</div>}
            <button onClick={() => onSignin({ accountNumber: siAccount, password: siPassword })} className="w-full py-2.5 rounded-lg bg-[#C9A227] text-[#0A2921] font-bold text-sm">{t.signin}</button>
          </div>
        )}

        <div className="mt-4 text-[11px] text-[#F3EAD3]/40 flex gap-1.5">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>{t.demoAuthNote}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Notifications ---------------- */
function NotificationsScreen({ lang, onBack, notices, invites, onRespondInvite }) {
  const t = LANGS[lang];
  return (
    <div className="min-h-screen bg-[#0A2921] text-[#F3EAD3] px-4 py-6" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
      <div className="max-w-sm mx-auto">
        <button onClick={onBack} className="text-[12px] text-[#F3EAD3]/50 mb-4">← {t.back}</button>
        <h2 className="text-lg font-bold mb-4 text-[#E8C46A]" style={{ fontFamily: "'Baloo Da 2', sans-serif" }}>{t.notifTitle}</h2>

        {invites.length > 0 && (
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-wider text-[#F3EAD3]/40 mb-2">{t.boardInvites}</div>
            <div className="space-y-2">
              {invites.map((inv) => (
                <div key={inv.id} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                  <div className="text-[13px] mb-2">{inv.from} {t.noticeInviteText} {inv.board}</div>
                  <div className="flex gap-2">
                    <button onClick={() => onRespondInvite(inv.id, "accepted")} className="flex-1 py-1.5 rounded-md bg-[#7FD8D0] text-[#0A2921] text-xs font-semibold">{t.accept}</button>
                    <button onClick={() => onRespondInvite(inv.id, "rejected")} className="flex-1 py-1.5 rounded-md bg-white/10 text-xs font-semibold">{t.reject}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-[11px] uppercase tracking-wider text-[#F3EAD3]/40 mb-2">{t.companyNotices}</div>
        <div className="space-y-2">
          {notices.map((n) => (
            <div key={n.id} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-[#F3EAD3]/80">{n.text}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Customer care chat ---------------- */
function CustomerCareScreen({ lang, onBack, initialAmount, mode }) {
  const t = LANGS[lang];
  const [messages, setMessages] = useState(() => {
    const seed = [{ from: "rep", text: t.ccWelcome }];
    if (mode === "request" && initialAmount) seed.push({ from: "system", text: `${t.ccRequestMsg} ${fmt(initialAmount, lang)}` });
    if (mode === "return" && initialAmount) seed.push({ from: "system", text: `${t.ccReturnMsg} ${fmt(initialAmount, lang)}` });
    return seed;
  });
  const [text, setText] = useState("");

  function send() {
    if (!text.trim()) return;
    setMessages((m) => [...m, { from: "me", text }]);
    setText("");
    setTimeout(() => setMessages((m) => [...m, { from: "rep", text: t.ccAutoReply }]), 700);
  }

  return (
    <div className="min-h-screen bg-[#0A2921] text-[#F3EAD3] flex flex-col" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
        <button onClick={onBack} className="text-[12px] text-[#F3EAD3]/50">← {t.back}</button>
        <div className="font-bold text-[#E8C46A]">{t.ccTitle}</div>
      </div>
      <div className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[80%] rounded-lg px-3 py-2 text-[13px] ${
            m.from === "me" ? "ml-auto bg-[#C9A227] text-[#0A2921]" : m.from === "system" ? "mx-auto bg-white/5 text-[#F3EAD3]/50 text-[11px] text-center" : "bg-white/10"
          }`}>{m.text}</div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-white/10 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t.ccPlaceholder} className="flex-1 bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm outline-none" />
        <button onClick={send} className="px-4 rounded-md bg-[#C9A227] text-[#0A2921] font-bold text-sm">{t.ccSend}</button>
      </div>
    </div>
  );
}

/* ---------------- Leaderboard ---------------- */
function LeaderboardScreen({ lang, onBack, players }) {
  const t = LANGS[lang];
  const [tab, setTab] = useState("xp");
  const sorted = [...players].sort((a, b) => (tab === "xp" ? b.playCount - a.playCount : b.netProfit - a.netProfit));
  return (
    <div className="min-h-screen bg-[#0A2921] text-[#F3EAD3] px-4 py-6" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
      <div className="max-w-sm mx-auto">
        <button onClick={onBack} className="text-[12px] text-[#F3EAD3]/50 mb-4">← {t.back}</button>
        <h2 className="text-lg font-bold mb-4 text-[#E8C46A]" style={{ fontFamily: "'Baloo Da 2', sans-serif" }}>{t.leaderboardTitle}</h2>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("xp")} className={`flex-1 py-2 rounded-lg text-xs font-semibold ${tab === "xp" ? "bg-[#C9A227] text-[#0A2921]" : "bg-white/10"}`}>{t.xpTab}</button>
          <button onClick={() => setTab("profit")} className={`flex-1 py-2 rounded-lg text-xs font-semibold ${tab === "profit" ? "bg-[#C9A227] text-[#0A2921]" : "bg-white/10"}`}>{t.profitTab}</button>
        </div>
        <div className="space-y-1.5">
          {sorted.map((p, i) => (
            <div key={p.name} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 text-[13px]">
              <span>{i + 1}. {p.name}</span>
              <span className={tab === "profit" && p.netProfit < 0 ? "text-[#B33A3A]" : "text-[#7FD8D0]"}>
                {tab === "xp" ? `${p.playCount} ${t.betsSuffix}` : `${p.netProfit >= 0 ? "+" : ""}${fmt(p.netProfit, lang)}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Admin panel (demo) ---------------- */
function AdminScreen({ lang, onBack, coinRequests, onResolveRequest }) {
  const t = LANGS[lang];
  const [banAccount, setBanAccount] = useState("");
  const [banDuration, setBanDuration] = useState("week");
  const [banned, setBanned] = useState([]);
  return (
    <div className="min-h-screen bg-[#0A2921] text-[#F3EAD3] px-4 py-6" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
      <div className="max-w-sm mx-auto">
        <button onClick={onBack} className="text-[12px] text-[#F3EAD3]/50 mb-4">← {t.back}</button>
        <h2 className="text-lg font-bold mb-1 text-[#E8C46A]" style={{ fontFamily: "'Baloo Da 2', sans-serif" }}>{t.adminTitle}</h2>
        <div className="text-[11px] text-[#F3EAD3]/40 mb-4">{t.adminNote}</div>

        <div className="mb-6">
          <div className="text-[11px] uppercase tracking-wider text-[#F3EAD3]/40 mb-2">{t.coinRequestsTitle}</div>
          {coinRequests.length === 0 && <div className="text-[12px] text-[#F3EAD3]/40">{t.noPending}</div>}
          <div className="space-y-2">
            {coinRequests.map((r) => (
              <div key={r.id} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 flex items-center justify-between">
                <div className="text-[13px]">{r.name} — {r.kind === "return" ? (lang === "bn" ? "ফেরত " : lang === "hi" ? "वापसी " : "return ") : ""}{fmt(r.amount, lang)}</div>
                {r.status === "pending" ? (
                  <div className="flex gap-1.5">
                    <button onClick={() => onResolveRequest(r.id, "approved")} className="px-2.5 py-1 rounded-md bg-[#7FD8D0] text-[#0A2921] text-[11px] font-semibold">{t.approve}</button>
                    <button onClick={() => onResolveRequest(r.id, "rejected")} className="px-2.5 py-1 rounded-md bg-white/10 text-[11px] font-semibold">{t.reject}</button>
                  </div>
                ) : <span className={`text-[11px] ${r.status === "approved" ? "text-[#7FD8D0]" : "text-[#B33A3A]"}`}>{r.status === "approved" ? t.approvedLabel : t.rejectedLabel}</span>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#F3EAD3]/40 mb-2">{t.banTitle}</div>
          <input value={banAccount} onChange={(e) => setBanAccount(e.target.value)} placeholder={t.banAccPlaceholder}
            className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm outline-none mb-2" />
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {[["week", t.durWeek], ["month", t.durMonth], ["year", t.durYear], ["forever", t.durForever]].map(([k, l]) => (
              <button key={k} onClick={() => setBanDuration(k)} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${banDuration === k ? "bg-[#B33A3A]" : "bg-white/10"}`}>{l}</button>
            ))}
          </div>
          <button onClick={() => { if (banAccount) { setBanned((b) => [...b, { account: banAccount, duration: banDuration }]); setBanAccount(""); } }}
            className="w-full py-2 rounded-lg bg-[#B33A3A]/80 text-sm font-semibold">{t.banBtn}</button>
          {banned.length > 0 && (
            <div className="mt-3 space-y-1">
              {banned.map((b, i) => <div key={i} className="text-[12px] text-[#F3EAD3]/60">{b.account} — {b.duration}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ lang, setLang, wallet, user, stats, pendingInviteCount, onNewBoard, onSearch, onOpenNotifications, onOpenCustomerCare, onOpenLeaderboard, onOpenAdmin, onRequestCoins, onReturnCoins, soundOn, setSoundOn, autoBuyIn, setAutoBuyIn }) {
  const t = LANGS[lang];
  const [reqAmount, setReqAmount] = useState("");
  const [returnAmount, setReturnAmount] = useState("");

  return (
    <div className="min-h-screen bg-[#0A2921] text-[#F3EAD3] flex flex-col items-center px-4 py-6" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <button onClick={onOpenNotifications} className="relative p-2 rounded-full bg-white/5 hover:bg-white/10">
              <Bell size={16} />
              {pendingInviteCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#B33A3A] text-[9px] flex items-center justify-center">{pendingInviteCount}</span>}
            </button>
            <button onClick={() => onOpenCustomerCare("general", 0)} className="p-2 rounded-full bg-white/5 hover:bg-white/10"><Headphones size={16} /></button>
            <button onClick={onOpenLeaderboard} className="p-2 rounded-full bg-white/5 hover:bg-white/10"><Trophy size={16} /></button>
          </div>
          <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-1">
            <Globe size={13} className="text-[#F3EAD3]/50" />
            {Object.keys(LANGS).map((k) => (
              <button key={k} onClick={() => setLang(k)} className={`text-[11px] px-1.5 py-0.5 rounded-full ${lang === k ? "bg-[#C9A227] text-[#0A2921] font-semibold" : "text-[#F3EAD3]/50"}`}>
                {k.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-1 text-[#E8C46A]" style={{ fontFamily: "'Baloo Da 2', sans-serif" }}>{t.appTitle}</h1>

        <div className="text-center bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
          <div className="font-semibold">{user.name}</div>
          <div className="text-[11px] text-[#F3EAD3]/40 tracking-wider mb-1">{user.accountNumber}</div>
          <div className="text-sm flex items-center justify-center gap-1.5 mb-2"><Coin size={13} /> {t.yourBalance}: {fmt(wallet, lang)}</div>
          <div className="flex justify-center gap-4 text-[11px] text-[#F3EAD3]/60">
            <span>{t.totalReceived}: {fmt(stats.totalReceived, lang)}</span>
            <span>{t.totalLoss}: {fmt(stats.totalLoss, lang)}</span>
            <span className={stats.netProfit >= 0 ? "text-[#7FD8D0]" : "text-[#B33A3A]"}>{t.netLabel}: {stats.netProfit >= 0 ? "+" : ""}{fmt(stats.netProfit, lang)}</span>
          </div>
        </div>

        <button onClick={onNewBoard} className="w-full py-4 rounded-xl bg-[#C9A227] text-[#0A2921] font-bold mb-3 flex items-center justify-center gap-2 hover:bg-[#E8C46A] transition">
          <Plus size={18} /> {t.newBoard}
        </button>
        <button onClick={onSearch} className="w-full py-4 rounded-xl bg-white/10 border border-white/15 font-bold flex items-center justify-center gap-2 hover:bg-white/15 transition">
          <Search size={18} /> {t.search}
        </button>
        <div className="text-center text-[11px] text-[#F3EAD3]/40 mt-2">{t.searchDesc}</div>

        <div className="mt-5 rounded-lg bg-white/5 border border-white/10 p-3">
          <div className="text-[11px] uppercase tracking-wider text-[#F3EAD3]/40 mb-2">{t.coinSection}</div>
          <div className="mb-2.5">
            <div className="text-[12px] text-[#F3EAD3]/60 mb-1">{t.requestCoins}</div>
            <div className="flex gap-1.5">
              <input value={reqAmount} onChange={(e) => setReqAmount(e.target.value)} type="number" placeholder={t.enterAmount}
                className="flex-1 bg-white/10 border border-white/15 rounded-md px-2.5 py-1.5 text-sm outline-none" />
              <button onClick={() => { if (Number(reqAmount) > 0) { onRequestCoins(Number(reqAmount)); setReqAmount(""); } }}
                className="px-3 rounded-md bg-[#C9A227] text-[#0A2921] text-[12px] font-bold shrink-0">{t.requestBtn}</button>
            </div>
          </div>
          <div>
            <div className="text-[12px] text-[#F3EAD3]/60 mb-1">{t.returnCoins}</div>
            <div className="flex gap-1.5">
              <input value={returnAmount} onChange={(e) => setReturnAmount(e.target.value)} type="number" max={wallet} placeholder={t.enterAmount}
                className="flex-1 bg-white/10 border border-white/15 rounded-md px-2.5 py-1.5 text-sm outline-none" />
              <button onClick={() => { if (Number(returnAmount) > 0 && Number(returnAmount) <= wallet) { onReturnCoins(Number(returnAmount)); setReturnAmount(""); } }}
                className="px-3 rounded-md bg-white/15 text-[12px] font-bold shrink-0">{t.returnBtn}</button>
            </div>
          </div>
          <div className="text-[10px] text-[#F3EAD3]/35 mt-2">{t.coinHelpNote}</div>
        </div>

        <div className="mt-4 rounded-lg bg-white/5 border border-white/10 p-3">
          <div className="text-[11px] uppercase tracking-wider text-[#F3EAD3]/40 mb-1 flex items-center gap-1"><Settings size={12} /> {t.settingsTitle}</div>
          <Toggle checked={soundOn} onChange={setSoundOn} label={t.soundLabel} />
          <Toggle checked={autoBuyIn} onChange={setAutoBuyIn} label={t.autoBuyInLabel} />
        </div>

        <button onClick={onOpenAdmin} className="mt-4 w-full text-[11px] text-[#F3EAD3]/30 flex items-center justify-center gap-1 py-1">
          <ShieldAlert size={12} /> {t.adminLink}
        </button>

        <div className="mt-2 text-[11px] text-[#F3EAD3]/40 flex gap-1.5">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>{t.fbNote}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- New board setup ---------------- */
function NewBoardScreen({ lang, wallet, onBack, onStart, defaultBuyIn }) {
  const t = LANGS[lang];
  const [tierKey, setTierKey] = useState(null);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [buyIn, setBuyIn] = useState("");
  const [invited, setInvited] = useState([]);
  const [searchAcc, setSearchAcc] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [fbConnected, setFbConnected] = useState(false);
  const tier = BOARD_TIERS.find((x) => x.key === tierKey);

  function handleAccountSearch() {
    const found = MOCK_FRIENDS.find((f) => f.accountNumber === searchAcc.trim());
    setSearchResult(found || "not_found");
  }
  function invite(name) {
    if (!invited.includes(name)) setInvited((prev) => [...prev, name]);
  }
  useEffect(() => {
    if (tier && defaultBuyIn && defaultBuyIn >= tier.min && defaultBuyIn <= Math.min(tier.max, wallet)) {
      setBuyIn(String(defaultBuyIn));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tierKey]);

  if (!tier) {
    return (
      <div className="min-h-screen bg-[#0A2921] text-[#F3EAD3] px-4 py-10" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
        <div className="max-w-sm mx-auto">
          <button onClick={onBack} className="text-[12px] text-[#F3EAD3]/50 mb-4">← {t.back}</button>
          <h2 className="text-xl font-bold mb-4 text-[#E8C46A]" style={{ fontFamily: "'Baloo Da 2', sans-serif" }}>{t.chooseBoard}</h2>
          <div className="space-y-2">
            {BOARD_TIERS.map((b) => {
              const ok = wallet >= b.min;
              return (
                <button key={b.key} disabled={!ok} onClick={() => setTierKey(b.key)}
                  className={`w-full text-left rounded-lg px-4 py-3 border ${ok ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-white/5 bg-white/[0.02] opacity-40"}`}>
                  <div className="font-semibold" style={{ color: b.accent }}>{b.name}</div>
                  <div className="text-[11px] text-[#F3EAD3]/60">{fmt(b.min, lang)} – {fmt(b.max, lang)}</div>
                  {!ok && <div className="text-[10px] text-[#B33A3A] mt-0.5">{t.insufficient}</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const maxBuyIn = Math.min(tier.max, wallet);

  return (
    <div className="min-h-screen bg-[#0A2921] text-[#F3EAD3] px-4 py-10" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
      <div className="max-w-sm mx-auto">
        <button onClick={() => setTierKey(null)} className="text-[12px] text-[#F3EAD3]/50 mb-4">← {t.back}</button>
        <h2 className="text-lg font-bold mb-4" style={{ color: tier.accent, fontFamily: "'Baloo Da 2', sans-serif" }}>{tier.name}</h2>

        <div className="mb-5">
          <div className="text-xs text-[#F3EAD3]/50 mb-1.5">{t.maxPlayers}</div>
          <div className="flex gap-2 flex-wrap">
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button key={n} onClick={() => setMaxPlayers(n)} className={`w-9 h-9 rounded-full text-sm font-semibold border ${maxPlayers === n ? "bg-[#C9A227] text-[#0A2921] border-[#C9A227]" : "border-white/20 text-[#F3EAD3]/70"}`}>{n}</button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <div className="text-xs text-[#F3EAD3]/50 mb-1.5">{t.buyIn} ({fmt(tier.min, lang)} – {fmt(maxBuyIn, lang)})</div>
          <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-md px-2.5 py-2">
            <Coin size={14} />
            <input type="number" min={tier.min} max={maxBuyIn} value={buyIn}
              onChange={(e) => setBuyIn(e.target.value)}
              placeholder={`${fmt(tier.min, lang)} - ${fmt(maxBuyIn, lang)}`}
              className="bg-transparent outline-none text-sm w-full" />
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs text-[#F3EAD3]/50 mb-1.5">{t.inviteByAccount}</div>
          <div className="flex gap-1.5 mb-1.5">
            <input value={searchAcc} onChange={(e) => setSearchAcc(e.target.value)} placeholder="AC10234581"
              className="flex-1 bg-white/10 border border-white/15 rounded-md px-2.5 py-1.5 text-sm outline-none" />
            <button onClick={handleAccountSearch} className="px-3 rounded-md bg-white/15 text-[12px] font-semibold shrink-0">{t.searchBtn}</button>
          </div>
          {searchResult === "not_found" && <div className="text-[11px] text-[#B33A3A]">{t.notFound}</div>}
          {searchResult && searchResult !== "not_found" && (
            <div className="flex items-center justify-between bg-white/5 rounded-md px-2.5 py-1.5 text-[13px]">
              <span>{searchResult.name}</span>
              <button onClick={() => invite(searchResult.name)} className="px-2.5 py-1 rounded-md bg-[#C9A227] text-[#0A2921] text-[11px] font-semibold">
                {invited.includes(searchResult.name) ? t.inviteSent : t.sendInvite}
              </button>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="text-xs text-[#F3EAD3]/50 mb-1.5">{t.fbInviteTitle}</div>
          {!fbConnected ? (
            <button onClick={() => setFbConnected(true)} className="w-full py-2.5 rounded-lg bg-[#3b5998] text-white text-sm font-semibold">
              Connect with Facebook
            </button>
          ) : (
            <div>
              <div className="text-[11px] text-[#F3EAD3]/40 mb-1.5">{t.fbFriendsWhoPlay}</div>
              <div className="space-y-1 mb-2">
                {MOCK_FRIENDS.filter((f) => f.playsGame).map((f) => (
                  <div key={f.name} className="flex items-center justify-between bg-white/5 rounded-md px-2.5 py-1.5 text-[13px]">
                    <span>{f.name} <span className="text-[10px] text-[#F3EAD3]/40">({f.online ? t.onlineLabel : t.offlineLabel})</span></span>
                    <button onClick={() => invite(f.name)} className="px-2.5 py-1 rounded-md bg-[#C9A227] text-[#0A2921] text-[11px] font-semibold">
                      {invited.includes(f.name) ? "✓" : "Invite Friend"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {invited.length > 0 && (
          <div className="mb-6 text-[11px] text-[#F3EAD3]/50">{t.invitedListLabel} {invited.join(", ")}</div>
        )}

        <button
          disabled={!buyIn || Number(buyIn) < tier.min || Number(buyIn) > maxBuyIn}
          onClick={() => onStart({ tier, buyIn: Number(buyIn), maxPlayers })}
          className="w-full py-3 rounded-lg bg-[#C9A227] text-[#0A2921] font-bold disabled:opacity-30">
          {t.startTable}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Avatar popover ---------------- */
function AvatarPopover({ player, lang, onClose, onReact }) {
  const t = LANGS[lang];
  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center px-6" onClick={onClose}>
      <div className="bg-[#123B2C] border border-white/15 rounded-xl p-4 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-2">
          <div className="font-bold text-[#E8C46A]">{player.name}</div>
          <button onClick={onClose}><X size={16} /></button>
        </div>
        <div className="text-sm flex items-center gap-1.5 mb-1"><Coin size={13} /> {fmt(player.balance, lang)}</div>
        <div className="text-xs text-[#F3EAD3]/60 mb-3">র‍্যাংক #{player.rank}</div>
        <div className="flex gap-2">
          <button onClick={() => onReact("💣")} className="flex-1 py-2 rounded-md bg-white/10 hover:bg-white/15 text-lg">💣</button>
          <button onClick={() => onReact("❤️")} className="flex-1 py-2 rounded-md bg-white/10 hover:bg-white/15 text-lg">❤️</button>
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ lang, setLang, soundOn, setSoundOn, onClose, onLeave, t }) {
  const rulesList = {
    bn: ["ডিলার কার্ড ফেলে, সিলেক্টর একটা নির্দিষ্ট কার্ড বাছে (স্যুট+র‍্যাংক)।", "কার্ড দুই সাইডে (ডিলার/সিলেক্টর) পালা করে পড়ে, বাছা কার্ড যে সাইডে পড়ে সেই সাইড জেতে।", "১০ সেকেন্ডে বাছাই ও বাজি, তারপর ১০ সেকেন্ডে বিপরীত বাজি অ্যাক্সেপ্ট/রিজেক্ট।", "জেতা কয়েন থেকে ২% কমিশন কাটা হয়।", "সিলেক্টর জিতলে সে নতুন ডিলার হয়।"],
    en: ["Dealer deals, selector picks one exact card (suit+rank).", "Cards fall alternately to dealer/selector side; whichever side gets the picked card wins.", "10s to pick & bet, then 10s to accept/reject opposing bets.", "2% commission is cut from the winner's coins.", "If the selector wins, they become the new dealer."],
    hi: ["डीलर कार्ड फेंकता है, सिलेक्टर एक कार्ड चुनता है (सूट+रैंक)।", "कार्ड बारी-बारी दोनों तरफ गिरते हैं, जिस तरफ चुना हुआ कार्ड गिरे वो जीतता है।", "10 सेकंड चुनने/दांव के लिए, फिर 10 सेकंड विरोधी दांव स्वीकार/अस्वीकार के लिए।", "जीत की राशि से 2% कमीशन कटता है।", "सिलेक्टर जीते तो वह नया डीलर बनता है।"],
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[#123B2C] border border-white/15 rounded-t-2xl sm:rounded-2xl p-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <div className="font-bold text-[#E8C46A]">{t.menu}</div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="mb-4">
          <div className="text-[11px] text-[#F3EAD3]/50 mb-1.5 flex items-center gap-1"><Globe size={12} /> Language</div>
          <div className="flex gap-1.5">
            {Object.keys(LANGS).map((k) => (
              <button key={k} onClick={() => setLang(k)} className={`px-3 py-1 rounded-full text-xs font-semibold ${lang === k ? "bg-[#C9A227] text-[#0A2921]" : "bg-white/10"}`}>{k.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <Toggle checked={soundOn} onChange={setSoundOn} label={t.soundLabel} />
        </div>
        <div className="mb-4">
          <div className="text-[11px] text-[#F3EAD3]/50 mb-1.5">{t.rules}</div>
          <ul className="text-[12px] text-[#F3EAD3]/75 space-y-1 list-disc pl-4">
            {rulesList[lang].map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
        <button onClick={onLeave} className="w-full py-2.5 rounded-lg bg-[#B33A3A]/80 font-semibold text-sm">{t.leaveTable}</button>
      </div>
    </div>
  );
}

function TableScreen({ lang, config, wallet, onExit, onWalletChange, humanName, onLoss, soundOn, setSoundOn }) {
  const t = LANGS[lang];
  const { tier, buyIn, maxPlayers } = config;
  const humanIdx = 0;

  const [players, setPlayers] = useState(() => {
    const list = [{ id: 0, name: humanName || "আপনি", isHuman: true, balance: buyIn, busted: false, rank: randInt(1, 99) }];
    for (let i = 1; i < maxPlayers; i++) {
      list.push({ id: i, name: BOT_NAMES[i - 1] || `P${i + 1}`, isHuman: false, balance: randInt(Math.floor(tier.max * 0.3), tier.max), busted: false, rank: randInt(1, 99) });
    }
    return list;
  });

  const [deck, setDeck] = useState(() => shuffle(buildDeck()));
  const [discard, setDiscard] = useState([]);
  const [leftPile, setLeftPile] = useState([]);
  const [rightPile, setRightPile] = useState([]);

  const [dealerIdx, setDealerIdx] = useState(0);
  const [selectorIdx, setSelectorIdx] = useState(nextActiveStatic(1, [0], maxPlayers));
  const [selectedSuit, setSelectedSuit] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectorBet, setSelectorBet] = useState(0);
  const [bets, setBets] = useState({});

  const [phase, setPhase] = useState("select_bet");
  const [timer, setTimer] = useState(10);
  const [flippedCard, setFlippedCard] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [round, setRound] = useState(1);
  const [log, setLog] = useState([]);
  const [commissionPool, setCommissionPool] = useState(0);
  const [popoverIdx, setPopoverIdx] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [badges, setBadges] = useState([]);

  const [humanSideBet, setHumanSideBet] = useState(null);
  const [humanSideAmount, setHumanSideAmount] = useState(0);

  const timers = useRef([]);
  const betsRef = useRef({});
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const after = (ms, fn) => { const id = setTimeout(fn, ms); timers.current.push(id); return id; };
  useEffect(() => clearTimers, []);

  function nextActive(fromIdx, exclude = []) {
    let i = fromIdx;
    for (let s = 0; s < players.length; s++) {
      i = (i + 1) % players.length;
      if (!players[i].busted && !exclude.includes(i)) return i;
    }
    return fromIdx;
  }
  function pushLog(text) { setLog((l) => [text, ...l].slice(0, 40)); }
  function addBadge(idx, text, color) {
    const key = Math.random().toString(36).slice(2);
    setBadges((b) => [...b, { key, idx, text, color }]);
    after(1300, () => setBadges((b) => b.filter((x) => x.key !== key)));
  }

  useEffect(() => {
    if (phase !== "select_bet" && phase !== "review") return;
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((s) => s - 1), 1000);
    timers.current.push(id);
    return () => clearTimeout(id);
  }, [phase, timer]);

  useEffect(() => {
    if (phase === "select_bet" && timer === 0) {
      if (!selectedCard) {
        setTimer(10);
        pushLog("সময় বাড়ানো হলো — সিলেক্টর এখনো কার্ড বাছেনি।");
      } else {
        beginReview();
      }
    }
    if (phase === "review" && timer === 0) {
      finalizeReview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, phase]);

  useEffect(() => {
    if (phase !== "select_bet") return;
    if (selectorIdx === humanIdx) return;
    after(1200 + randInt(0, 1500), () => {
      const suit = SUITS[randInt(0, 3)];
      const rank = RANKS[randInt(0, 12)];
      const bal = players[selectorIdx].balance;
      const amount = BET_PRESETS.filter((p) => p <= bal);
      const bet = amount.length ? amount[randInt(0, amount.length - 1)] : Math.max(1, Math.floor(bal * 0.1));
      setSelectedSuit(suit);
      setSelectedCard({ rank, suit });
      setSelectorBet(bet);
      pushLog(`${players[selectorIdx].name} কার্ড সিলেক্ট করলো: ${rank}${suit} (বাজি ${bn(bet)})`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selectorIdx]);

  useEffect(() => {
    if (phase !== "select_bet") return;
    const eligible = players.map((_, i) => i).filter((i) => i !== dealerIdx && i !== selectorIdx && !players[i].busted);
    eligible.forEach((i) => {
      if (i === humanIdx) return;
      after(1000 + randInt(0, 6000), () => {
        if (Math.random() < 0.65) {
          const bal = players[i].balance;
          const opts = BET_PRESETS.filter((p) => p <= bal);
          if (!opts.length) return;
          const amount = opts[randInt(0, opts.length - 1)];
          const side = Math.random() < 0.5 ? "dealer" : "selector";
          setBets((b) => {
            const nb = { ...b, [i]: { side, amount, status: "pending" } };
            betsRef.current = nb;
            return nb;
          });
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function submitHumanSelection(suit, card, betAmount) {
    setSelectedSuit(suit);
    setSelectedCard(card);
    setSelectorBet(betAmount);
    pushLog(`আপনি কার্ড সিলেক্ট করলেন: ${card.rank}${card.suit} (বাজি ${bn(betAmount)})`);
  }

  function submitHumanSideBet() {
    if (!humanSideBet || humanSideAmount <= 0) return;
    setBets((b) => {
      const nb = { ...b, [humanIdx]: { side: humanSideBet, amount: humanSideAmount, status: "pending" } };
      betsRef.current = nb;
      return nb;
    });
  }

  function beginReview() {
    clearTimers();
    const finalBets = { ...betsRef.current, [selectorIdx]: { side: "selector", amount: selectorBet, status: "accepted" } };
    betsRef.current = finalBets;
    setBets(finalBets);

    if (dealerIdx !== humanIdx) {
      Object.keys(finalBets).forEach((k) => {
        const idx = Number(k);
        if (finalBets[idx].side === "selector" && idx !== selectorIdx) {
          finalBets[idx].status = Math.random() < 0.85 ? "accepted" : "rejected";
        }
      });
    }
    if (selectorIdx !== humanIdx) {
      Object.keys(finalBets).forEach((k) => {
        const idx = Number(k);
        if (finalBets[idx].side === "dealer") {
          finalBets[idx].status = Math.random() < 0.85 ? "accepted" : "rejected";
        }
      });
    }
    betsRef.current = { ...finalBets };
    setBets({ ...finalBets });
    setTimer(10);
    setPhase("review");
  }

  function setBetStatus(idx, status) {
    setBets((b) => {
      const nb = { ...b, [idx]: { ...b[idx], status } };
      betsRef.current = nb;
      return nb;
    });
  }

  function finalizeReview() {
    clearTimers();
    setBets((b) => {
      const nb = {};
      Object.entries(b).forEach(([k, v]) => { nb[k] = v.status === "pending" ? { ...v, status: "accepted" } : v; });
      betsRef.current = nb;
      return nb;
    });
    setPhase("reveal");
  }

  useEffect(() => {
    if (phase !== "reveal") return;
    let cancelled = false;
    let localDeck = deck;
    let localDiscard = discard;
    let flipIndex = leftPile.length + rightPile.length;

    async function run() {
      while (!cancelled) {
        if (localDeck.length === 0) {
          localDeck = shuffle(localDiscard);
          localDiscard = [];
          pushLog("ডেক শেষ — বাতিল কার্ড শাফল করা হলো।");
        }
        const card = localDeck[0];
        localDeck = localDeck.slice(1);
        const side = flipIndex % 2 === 0 ? "dealer" : "selector";
        flipIndex++;
        setDeck(localDeck);
        setFlippedCard(card);
        playCardSound();
        if (side === "dealer") setLeftPile((p) => [...p, card]);
        else setRightPile((p) => [...p, card]);

        await new Promise((res) => after(600, res));
        if (cancelled) return;

        if (card.rank === selectedCard.rank && card.suit === selectedCard.suit) {
          settleRound(side, card);
          return;
        }
      }
    }
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function settleRound(winnerSide, card) {
    playCoinSound();
    let commissionGained = 0;
    let humanLoss = 0;
    setPlayers((prev) => {
      const next = prev.map((p) => ({ ...p }));
      const dealer = next[dealerIdx];
      Object.entries(betsRef.current).forEach(([k, b]) => {
        const idx = Number(k);
        if (idx === dealerIdx || b.status !== "accepted") return;
        const won = b.side === winnerSide;
        if (won) {
          const commission = Math.round(b.amount * 0.02);
          const net = b.amount - commission;
          next[idx].balance += net;
          dealer.balance -= b.amount;
          commissionGained += commission;
          addBadge(idx, `+${bn(net)}`, "#7FD8D0");
          if (dealerIdx === humanIdx) humanLoss += b.amount;
        } else {
          next[idx].balance -= b.amount;
          dealer.balance += b.amount;
          addBadge(idx, `-${bn(b.amount)}`, "#B33A3A");
          if (idx === humanIdx) humanLoss += b.amount;
        }
      });
      next.forEach((p) => { if (p.balance <= 0) { p.balance = 0; p.busted = true; } });
      return next;
    });
    setCommissionPool((c) => c + commissionGained);
    if (humanLoss > 0 && onLoss) onLoss(humanLoss);
    pushLog(winnerSide === "selector"
      ? `কার্ড (${card.rank}${card.suit}) সিলেক্টরের পাশে পড়েছে — ${players[selectorIdx].name} জিতে নতুন ডিলার হলো।`
      : `কার্ড (${card.rank}${card.suit}) ডিলারের পাশে পড়েছে — ${players[dealerIdx].name} ডিলারই থেকে গেল।`);
    setLastResult({ winnerSide, card });
    setPhase("result");
  }

  function goNextRound() {
    const activeCount = players.filter((p) => !p.busted).length;
    if (activeCount < 2) { setPhase("gameover"); return; }

    let newDealer = dealerIdx, newSelector;
    if (lastResult?.winnerSide === "selector") {
      newDealer = selectorIdx;
      newSelector = nextActive(newDealer, [newDealer]);
    } else {
      newSelector = nextActive(selectorIdx, [dealerIdx]);
    }
    setDiscard((d) => [...d, ...leftPile, ...rightPile]);
    setLeftPile([]); setRightPile([]);
    setDealerIdx(newDealer); setSelectorIdx(newSelector);
    setSelectedSuit(null); setSelectedCard(null); setSelectorBet(0);
    setBets({}); betsRef.current = {};
    setFlippedCard(null); setLastResult(null);
    setHumanSideBet(null); setHumanSideAmount(0);
    setTimer(10);
    setRound((r) => r + 1);
    setPhase("select_bet");
  }

  function leaveTable() {
    onWalletChange(wallet - buyIn + players[humanIdx].balance);
    onExit();
  }

  const me = players[humanIdx];
  const isHumanSelector = selectorIdx === humanIdx;
  const isHumanDealer = dealerIdx === humanIdx;
  const isHumanEligibleBettor = !isHumanDealer && !isHumanSelector && !me.busted && !bets[humanIdx];

  if (phase === "gameover") {
    return (
      <div className="min-h-screen bg-[#0A2921] text-[#F3EAD3] flex flex-col items-center justify-center px-4 text-center" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
        <h2 className="text-2xl font-bold text-[#E8C46A] mb-3" style={{ fontFamily: "'Baloo Da 2', sans-serif" }}>{t.boardClosed}</h2>
        <div className="space-y-1 mb-6 text-sm">
          {[...players].sort((a, b) => b.balance - a.balance).map((p) => (
            <div key={p.id} className="flex items-center gap-2 justify-center">
              <span className={p.isHuman ? "text-[#E8C46A] font-semibold" : "text-[#F3EAD3]/80"}>{p.name}</span>
              <Coin size={12} /> {fmt(p.balance, lang)} {p.busted && <span className="text-[#B33A3A] text-xs">(আউট)</span>}
            </div>
          ))}
        </div>
        <button onClick={leaveTable} className="px-6 py-2.5 rounded-lg bg-[#C9A227] text-[#0A2921] font-bold">{t.newTable}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A2921] text-[#F3EAD3] pb-8" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
      <KeyframeStyles />
      {popoverIdx !== null && (
        <AvatarPopover player={players[popoverIdx]} lang={lang} onClose={() => setPopoverIdx(null)}
          onReact={(emoji) => { addBadge(popoverIdx, emoji, "#E8C46A"); setPopoverIdx(null); }} />
      )}
      {showSettings && (
        <SettingsModal lang={lang} setLang={setLang} soundOn={soundOn} setSoundOn={setSoundOn} t={t} onClose={() => setShowSettings(false)} onLeave={leaveTable} />
      )}

      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0A2921]/95 backdrop-blur z-20">
        <div>
          <div className="text-sm font-bold" style={{ color: tier.accent, fontFamily: "'Baloo Da 2', sans-serif" }}>{tier.name}</div>
          <div className="text-[11px] text-[#F3EAD3]/50">{t.totalRounds}: {round} · {t.deck} {deck.length}</div>
        </div>
        {(phase === "select_bet" || phase === "review") && (
          <div className="text-lg font-bold text-[#E8C46A] tabular-nums">{timer}s</div>
        )}
        <button onClick={() => setShowSettings(true)} className="p-1.5 rounded-full hover:bg-white/10"><Settings size={18} /></button>
      </div>

      <div className="mx-4 mt-4 relative" style={{ aspectRatio: "5 / 4" }}>
        <div className="absolute inset-0 rounded-[50%] bg-[#6b4a1e] shadow-2xl" />
        <div className="absolute inset-[9px] rounded-[50%] bg-gradient-to-b from-[#154434] to-[#0A2921] border border-black/30" />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="text-center">
              <div className="text-[8px] sm:text-[9px] text-[#F3EAD3]/50 mb-0.5">{players[dealerIdx].name}</div>
              {leftPile.length === 0 ? <CardFace back small /> : <CardFace card={leftPile[leftPile.length - 1]} small />}
            </div>
            <div className="text-center">
              {selectedCard ? (
                <>
                  <CardFace card={selectedCard} small locked />
                  <div className="text-[8px] text-[#7FD8D0] mt-0.5">টার্গেট</div>
                </>
              ) : <CardFace back small />}
            </div>
            <div className="text-center">
              <div className="text-[8px] sm:text-[9px] text-[#F3EAD3]/50 mb-0.5">{players[selectorIdx].name}</div>
              {rightPile.length === 0 ? <CardFace back small /> : <CardFace card={rightPile[rightPile.length - 1]} small />}
            </div>
          </div>
        </div>

        {players.map((p, i) => {
          const k = (i - humanIdx + players.length) % players.length;
          const angle = ((90 + k * (360 / players.length)) * Math.PI) / 180;
          const rx = 43, ry = 40;
          const left = `${50 + rx * Math.cos(angle)}%`;
          const top = `${50 + ry * Math.sin(angle)}%`;
          return (
            <button key={p.id} onClick={() => setPopoverIdx(i)} style={{ left, top }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 w-16">
              <div className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 bg-[#1a4433] ${
                p.busted ? "opacity-30 border-white/10" : i === dealerIdx ? "border-[#E8C46A]" : i === selectorIdx ? "border-[#7FD8D0]" : "border-white/20"
              } ${i === humanIdx ? "ring-2 ring-white/70" : ""}`}>
                {p.name.slice(0, 1)}
                {i === dealerIdx && <Crown size={12} className="absolute -top-2.5 -right-1 text-[#E8C46A]" />}
                {i === selectorIdx && <Target size={12} className="absolute -top-2.5 -right-1 text-[#7FD8D0]" />}
                {badges.filter((b) => b.idx === i).map((b) => (
                  <span key={b.key} className="float-badge absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap" style={{ color: b.color }}>{b.text}</span>
                ))}
              </div>
              <div className="text-[10px] font-semibold mt-0.5 truncate max-w-full">{p.name}</div>
              <div className="text-[9px] text-[#F3EAD3]/60 flex items-center gap-0.5"><Coin size={8} />{fmt(p.balance, lang)}</div>
              {i === selectorIdx && selectedCard && <div className="mt-0.5"><CardFace card={selectedCard} small locked /></div>}
              {bets[i] && (
                <div className={`text-[8px] mt-0.5 ${bets[i].status === "rejected" ? "line-through text-[#F3EAD3]/30" : bets[i].side === "selector" ? "text-[#7FD8D0]" : "text-[#E8C46A]"}`}>
                  {bn(bets[i].amount)}
                </div>
              )}
              {p.busted && <div className="text-[8px] text-[#B33A3A]">আউট</div>}
            </button>
          );
        })}
      </div>

      <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-b from-[#123B2C] to-[#0D2E22] border border-white/10 p-4">
        {phase === "select_bet" && isHumanSelector && (
          <HumanSelectPanel me={me} onSubmit={submitHumanSelection} selectedCard={selectedCard} t={t} lang={lang} />
        )}

        {phase === "select_bet" && !isHumanSelector && (
          <div className="text-center text-sm text-[#F3EAD3]/60 py-1 mb-2">
            {!selectedCard ? `${players[selectorIdx].name} কার্ড সিলেক্ট করছে…` : `${t.othersBetting}`}
          </div>
        )}

        {phase === "select_bet" && isHumanEligibleBettor && selectedCard && (
          <HumanSideBetPanel me={me} dealerName={players[dealerIdx].name} selectorName={players[selectorIdx].name}
            side={humanSideBet} setSide={setHumanSideBet} amount={humanSideAmount} setAmount={setHumanSideAmount}
            onConfirm={submitHumanSideBet} confirmed={!!bets[humanIdx]} t={t} lang={lang} />
        )}

        {phase === "review" && (
          <ReviewPanel players={players} bets={bets} betsRef={betsRef} setBets={setBets} setBetStatus={setBetStatus}
            dealerIdx={dealerIdx} selectorIdx={selectorIdx} isHumanDealer={isHumanDealer} isHumanSelector={isHumanSelector}
            humanIdx={humanIdx} t={t} lang={lang} />
        )}

        {phase === "reveal" && (
          <div className="text-center py-3">
            {flippedCard && <div className="flex justify-center mb-2"><CardFace card={flippedCard} /></div>}
            <div className="text-sm text-[#F3EAD3]/60 animate-pulse">{t.revealing}</div>
          </div>
        )}

        {phase === "result" && lastResult && (
          <div className="text-center py-1">
            <div className="flex justify-center mb-2"><CardFace card={lastResult.card} /></div>
            <div className={`text-sm font-semibold mb-1 ${lastResult.winnerSide === "selector" ? "text-[#7FD8D0]" : "text-[#E8A33D]"}`}>
              {lastResult.winnerSide === "selector" ? `${t.selectorWon}! (${players[selectorIdx].name}) 🎉` : `${t.dealerWon}! (${players[dealerIdx].name})`}
            </div>
            <div className="text-[10px] text-[#F3EAD3]/40 mb-3">{t.commissionNote}</div>
            <button onClick={goNextRound} className="px-5 py-2 rounded-lg bg-[#C9A227] text-[#0A2921] font-bold text-sm hover:bg-[#E8C46A] transition">{t.nextRound}</button>
          </div>
        )}
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-white/5 border border-white/10 p-3">
        <div className="text-[11px] uppercase tracking-wider text-[#F3EAD3]/40 mb-2 flex items-center gap-1"><Shuffle size={12} /> খেলার লগ</div>
        <div className="space-y-1 max-h-40 overflow-y-auto text-[12px] text-[#F3EAD3]/70">
          {log.length === 0 && <div className="text-[#F3EAD3]/30">এখনো কিছু হয়নি।</div>}
          {log.map((l, i) => <div key={i} className="border-b border-white/5 pb-1">{l}</div>)}
        </div>
      </div>
    </div>
  );
}

function HumanSelectPanel({ me, onSubmit, t, lang }) {
  const [suit, setSuit] = useState(null);
  const [rank, setRank] = useState(null);
  const [amount, setAmount] = useState(null);
  return (
    <div className="pt-1">
      <div className="text-center text-sm font-semibold mb-2 text-[#7FD8D0]">{t.yourTurn}</div>
      {!suit && (
        <div>
          <div className="text-[11px] text-[#F3EAD3]/50 mb-1.5 text-center">{t.pickSuit}</div>
          <div className="grid grid-cols-4 gap-2">
            {SUITS.map((s) => (
              <button key={s} onClick={() => setSuit(s)} className={`py-3 rounded-md text-2xl border border-white/15 hover:bg-white/10 ${RED_SUITS.includes(s) ? "text-[#B33A3A]" : "text-[#F3EAD3]"}`}>{s}</button>
            ))}
          </div>
        </div>
      )}
      {suit && !rank && (
        <div>
          <div className="text-[11px] text-[#F3EAD3]/50 mb-1.5 text-center">{t.pickRank}</div>
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {RANKS.map((r) => (
              <button key={r} onClick={() => setRank(r)} className="rounded-md border border-white/15 hover:bg-white/10">
                <CardFace card={{ rank: r, suit }} small />
              </button>
            ))}
          </div>
          <button onClick={() => setSuit(null)} className="text-[11px] text-[#F3EAD3]/40">← স্যুট বদলান</button>
        </div>
      )}
      {suit && rank && !amount && (
        <div>
          <div className="text-[11px] text-[#F3EAD3]/50 mb-1.5 text-center">{t.yourBet}</div>
          <div className="grid grid-cols-4 gap-1.5">
            {BET_PRESETS.filter((p) => p <= me.balance).map((p) => (
              <button key={p} onClick={() => setAmount(p)} className="py-1.5 rounded-md text-[11px] font-semibold border border-white/15 hover:bg-white/10">{bn(p)}</button>
            ))}
          </div>
        </div>
      )}
      {suit && rank && amount && (
        <div className="text-center">
          <div className="mb-2 text-sm">{rank}{suit} — <span className="text-[#E8C46A] font-semibold">{bn(amount)}</span></div>
          <button onClick={() => onSubmit(suit, { rank, suit }, amount)} className="px-5 py-2 rounded-lg bg-[#C9A227] text-[#0A2921] font-bold text-sm flex items-center gap-1 mx-auto">
            {t.confirm} <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function HumanSideBetPanel({ me, dealerName, selectorName, side, setSide, amount, setAmount, onConfirm, confirmed, t, lang }) {
  if (confirmed) return <div className="text-center text-xs text-[#F3EAD3]/50 py-2">বাজি কনফার্ম হয়েছে ✓</div>;
  return (
    <div className="pt-1">
      <div className="flex gap-2 justify-center mb-2">
        <button onClick={() => setSide("dealer")} className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${side === "dealer" ? "bg-[#E8C46A] text-[#0A2921] border-[#E8C46A]" : "border-white/15"}`}>{t.betOn} {dealerName}</button>
        <button onClick={() => setSide("selector")} className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${side === "selector" ? "bg-[#7FD8D0] text-[#0A2921] border-[#7FD8D0]" : "border-white/15"}`}>{t.betOn} {selectorName}</button>
        <button onClick={() => { setSide(null); setAmount(0); }} className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${side === null ? "bg-white/15 border-white/30" : "border-white/15"}`}>{t.noBet}</button>
      </div>
      {side && (
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {BET_PRESETS.filter((p) => p <= me.balance).map((p) => (
            <button key={p} onClick={() => setAmount(p)} className={`py-1.5 rounded-md text-[11px] font-semibold border ${amount === p ? "bg-[#C9A227] text-[#0A2921] border-[#C9A227]" : "border-white/15 hover:bg-white/10"}`}>{bn(p)}</button>
          ))}
        </div>
      )}
      <button onClick={onConfirm} disabled={side && amount <= 0} className="w-full py-1.5 rounded-md bg-[#C9A227] text-[#0A2921] text-sm font-bold disabled:opacity-30">{t.confirm}</button>
    </div>
  );
}

function ReviewPanel({ players, bets, setBetStatus, dealerIdx, selectorIdx, isHumanDealer, isHumanSelector, humanIdx, t }) {
  const dealerReviews = Object.entries(bets).filter(([k, b]) => b.side === "selector" && Number(k) !== selectorIdx);
  const selectorReviews = Object.entries(bets).filter(([k, b]) => b.side === "dealer");

  if (!isHumanDealer && !isHumanSelector) {
    return <div className="text-center text-xs text-[#F3EAD3]/50 py-3">{players[dealerIdx].name} ও {players[selectorIdx].name} বিপরীত বাজি রিভিউ করছে…</div>;
  }

  const list = isHumanDealer ? dealerReviews : selectorReviews;
  return (
    <div className="pt-1">
      <div className="text-center text-sm font-semibold mb-2 text-[#E8C46A]">{t.reviewTitle}</div>
      {list.length === 0 && <div className="text-center text-xs text-[#F3EAD3]/40 py-2">কেউ বিপক্ষে বাজি ধরেনি।</div>}
      <div className="space-y-1.5">
        {list.map(([k, b]) => {
          const idx = Number(k);
          return (
            <div key={k} className="flex items-center justify-between bg-white/5 rounded-md px-2.5 py-1.5">
              <span className="text-[12px]">{players[idx].name} — {bn(b.amount)}</span>
              <div className="flex gap-1">
                <button onClick={() => setBetStatus(idx, "accepted")} className={`px-2 py-0.5 rounded text-[10px] font-semibold ${b.status === "accepted" ? "bg-[#7FD8D0] text-[#0A2921]" : "bg-white/10"}`}>{t.accept}</button>
                <button onClick={() => setBetStatus(idx, "rejected")} className={`px-2 py-0.5 rounded text-[10px] font-semibold ${b.status === "rejected" ? "bg-[#B33A3A]" : "bg-white/10"}`}>{t.reject}</button>
              </div>
            </div>
          );
        })}
      </div>
      {isHumanDealer && (
        <div className="mt-2 text-[10px] text-[#F3EAD3]/40 flex items-center justify-between bg-white/5 rounded-md px-2.5 py-1.5">
          <span>{players[selectorIdx].name} (নিজের বাজি)</span>
          <span className="text-[#7FD8D0]">{t.mandatory}</span>
        </div>
      )}
    </div>
  );
}

function nextActiveStatic(fromIdx, exclude, total) {
  let i = fromIdx;
  for (let s = 0; s < total; s++) { if (!exclude.includes(i)) return i; i = (i + 1) % total; }
  return fromIdx;
}

export default function App() {
  const [lang, setLang] = useState("bn");
  const [wallet, setWallet] = useState(0);
  const [screen, setScreen] = useState("auth");
  const [tableConfig, setTableConfig] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const [autoBuyIn, setAutoBuyIn] = useState(false);
  const [lastBuyIn, setLastBuyIn] = useState(null);

  const [accounts, setAccounts] = useState([]);
  const [user, setUser] = useState(null);
  const [signinError, setSigninError] = useState("");
  const [stats, setStats] = useState({ totalReceived: 0, totalLoss: 0 });
  const [coinRequests, setCoinRequests] = useState([]);
  const [ccMode, setCcMode] = useState({ mode: "general", amount: 0 });
  const [invites, setInvites] = useState([
    { id: "inv1", from: "কামাল", board: "সিলভার বোর্ড", status: "pending" },
  ]);

  useEffect(() => setSoundEnabled(soundOn), [soundOn]);

  function handleSignup({ name, phone, password, accountNumber }) {
    const acc = { name, phone, password, accountNumber };
    setAccounts((a) => [...a, acc]);
    setUser(acc);
    setTimeout(() => setScreen("home"), 900);
  }
  function handleSignin({ accountNumber, password }) {
    const found = accounts.find((a) => a.accountNumber === accountNumber && a.password === password);
    if (!found) return setSigninError("অ্যাকাউন্ট নাম্বার বা পাসওয়ার্ড ভুল।");
    setSigninError("");
    setUser(found);
    setScreen("home");
  }

  function startTable(cfg) {
    setWallet((w) => w - cfg.buyIn);
    setLastBuyIn(cfg.buyIn);
    setTableConfig(cfg);
    setScreen("table");
  }
  function handleSearch() {
    if (wallet <= 0) { alert(LANGS[lang].searchNeedsCoin); return; }
    const eligible = BOARD_TIERS.filter((b) => wallet >= b.min);
    const tier = eligible[eligible.length - 1] || BOARD_TIERS[0];
    startTable({ tier, buyIn: Math.min(tier.max, wallet), maxPlayers: randInt(4, 8) });
  }
  function handleRequestCoins(amount) {
    setCoinRequests((r) => [...r, { id: Math.random().toString(36).slice(2), name: user?.name || "আপনি", amount, kind: "request", status: "pending" }]);
    setCcMode({ mode: "request", amount });
    setScreen("customerCare");
  }
  function handleReturnCoins(amount) {
    setWallet((w) => w - amount);
    setCoinRequests((r) => [...r, { id: Math.random().toString(36).slice(2), name: user?.name || "আপনি", amount, kind: "return", status: "pending" }]);
    setCcMode({ mode: "return", amount });
    setScreen("customerCare");
  }
  function resolveRequest(id, status) {
    setCoinRequests((rs) => rs.map((r) => {
      if (r.id !== id) return r;
      if (status === "approved" && r.kind === "request") setStats((s) => ({ ...s, totalReceived: s.totalReceived + r.amount }));
      if (status === "approved" && r.kind === "request") setWallet((w) => w + r.amount);
      return { ...r, status };
    }));
  }
  function respondInvite(id, status) {
    setInvites((inv) => inv.map((i) => (i.id === id ? { ...i, status } : i)));
  }

  const leaderboardPlayers = [
    { name: user?.name || "আপনি", playCount: 12, netProfit: stats.totalReceived - stats.totalLoss },
    ...BOT_NAMES.map((n) => ({ name: n, playCount: randInt(3, 60), netProfit: randInt(-20000, 40000) })),
  ];
  const pendingInviteCount = invites.filter((i) => i.status === "pending").length;

  return (
    <div>
      <link href="https://fonts.googleapis.com/css2?family=Baloo+Da+2:wght@600;800&family=Hind+Siliguri:wght@400;500;600&display=swap" rel="stylesheet" />
      {screen === "auth" && (
        <AuthScreen lang={lang} setLang={setLang} registeredPhones={accounts.map((a) => a.phone)} onSignup={handleSignup} onSignin={handleSignin} signinError={signinError} />
      )}
      {screen === "home" && user && (
        <HomeScreen lang={lang} setLang={setLang} wallet={wallet} user={user} stats={{ ...stats, netProfit: stats.totalReceived - stats.totalLoss }}
          pendingInviteCount={pendingInviteCount} onNewBoard={() => setScreen("newBoard")} onSearch={handleSearch}
          onOpenNotifications={() => setScreen("notifications")} onOpenCustomerCare={(mode, amount) => { setCcMode({ mode, amount }); setScreen("customerCare"); }}
          onOpenLeaderboard={() => setScreen("leaderboard")} onOpenAdmin={() => setScreen("admin")}
          onRequestCoins={handleRequestCoins} onReturnCoins={handleReturnCoins}
          soundOn={soundOn} setSoundOn={setSoundOn} autoBuyIn={autoBuyIn} setAutoBuyIn={setAutoBuyIn} />
      )}
      {screen === "notifications" && (
        <NotificationsScreen lang={lang} onBack={() => setScreen("home")} notices={MOCK_NOTICES} invites={invites.filter((i) => i.status === "pending")} onRespondInvite={respondInvite} />
      )}
      {screen === "customerCare" && (
        <CustomerCareScreen lang={lang} onBack={() => setScreen("home")} initialAmount={ccMode.amount} mode={ccMode.mode} />
      )}
      {screen === "leaderboard" && <LeaderboardScreen lang={lang} onBack={() => setScreen("home")} players={leaderboardPlayers} />}
      {screen === "admin" && <AdminScreen lang={lang} onBack={() => setScreen("home")} coinRequests={coinRequests} onResolveRequest={resolveRequest} />}
      {screen === "newBoard" && (
        <NewBoardScreen lang={lang} wallet={wallet} onBack={() => setScreen("home")} onStart={startTable}
          defaultBuyIn={autoBuyIn ? lastBuyIn : null} />
      )}
      {screen === "table" && (
        <TableScreen key={JSON.stringify(tableConfig) + Math.random()} lang={lang} config={tableConfig} wallet={wallet} humanName={user?.name || "আপনি"}
          onExit={() => setScreen("home")} onWalletChange={setWallet} onLoss={(amt) => setStats((s) => ({ ...s, totalLoss: s.totalLoss + amt }))}
          soundOn={soundOn} setSoundOn={setSoundOn} />
      )}
    </div>
  );
   }
