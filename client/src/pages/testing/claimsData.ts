// claimsData.js

const subjects = [
  "The Ticker",
  "Intuition",
  "$TRUST",
  "Portfolio",
  "Market",
  "Analytics",
];

const verbs = [
  "is",
  "has tag",
  "contains",
  "shows",
  "predicts",
  "tracks",
  "flags",
  "indicates",
  "suggests",
  "adds",
  "warns",
  "rises",
  "declines",
  "labels",
  "monitors",
];

const objects = [
  "$TRUST",
  "HODL",
  "LOCKED IN",
  "Bullish",
  "Volatile",
  "Momentum",
  "Growth",
  "ALERT",
  "RISKY",
  "Fast",
  "Slightly",
  "Now",
];

export const claims = Array.from({ length: 1000 }, (_, i) => {
  const support = Math.floor(Math.random() * 70) + 20;
  const oppose = Math.floor(Math.random() * 25) + 5;

  // Independent TRUST amounts
  const supportTrust = Math.floor(Math.random() * 500) + 50;
  const opposeTrust = Math.floor(Math.random() * 300) + 20;

  return {
    id: i + 1,
    icon: "/the-ticker.png",
    subject: subjects[i % subjects.length],
    verb: verbs[i % verbs.length],
    object: objects[i % objects.length],
    support,
    oppose,
    portalClaims: support + oppose,

    // Now independent
    supportLabel: supportTrust,
    opposeLabel: opposeTrust,
  };
});