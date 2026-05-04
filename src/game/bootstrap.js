export function mountKurczokerGame() {}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-kurczoker-game]").forEach((root) => mountKurczokerGame(root));
  });
}
