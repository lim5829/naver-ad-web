// ─── theme.js ───
// 라이트 테마 및 앱 설정
const { useState, useEffect, useCallback } = React;

const theme = {
  bg: "#F5F6FA", surface: "#FFFFFF", surfaceLight: "#F0F2F7",
  border: "#E2E6EF", accent: "#03C75A", accentDim: "rgba(3,199,90,0.08)",
  accentGlow: "rgba(3,199,90,0.2)", accentDark: "#02A94C",
  text: "#1A1D26", textDim: "#8892A6",
  danger: "#E8384F", dangerDim: "rgba(232,56,79,0.08)",
  warning: "#F5A623", warningDim: "rgba(245,166,35,0.1)",
  blue: "#4285F4", blueDim: "rgba(66,133,244,0.08)",
  cardShadow: "0 2px 16px rgba(0,0,0,0.06)",
};

// ⚠️ 배포 후 이 URL만 변경하세요
const PRODUCTION_PROXY_URL = "https://naver-ad-proxy.lim5829.workers.dev";
const PROXY_BASE = localStorage.getItem("__dev_proxy_url") || PRODUCTION_PROXY_URL;

const DEFAULT_PRESETS = [70, 500, 1000, 2000, 5000, 10000];
