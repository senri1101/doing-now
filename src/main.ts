import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

const STORAGE_KEY = "notch_now.text";
const EMPHASIS_DURATION_MS = 2000;

const bubble = document.querySelector<HTMLDivElement>("#bubble");
const label = document.querySelector<HTMLSpanElement>("#label");
const input = document.querySelector<HTMLInputElement>("#input");

if (!bubble || !label || !input) {
  throw new Error("UI root elements are missing.");
}

let emphasisTimerId: number | null = null;

const setClickThrough = async (enable: boolean) => {
  try {
    await invoke("set_click_through", { enable });
  } catch (error) {
    console.error("failed to set click-through state", error);
  }
};

const readStoredText = () => (localStorage.getItem(STORAGE_KEY) ?? "").slice(0, 20);

const setText = (rawText: string) => {
  const text = rawText.slice(0, 20);
  localStorage.setItem(STORAGE_KEY, text);
  label.textContent = text.length > 0 ? `◉ ${text}` : "◉";
};

const clearEmphasisTimer = () => {
  if (emphasisTimerId !== null) {
    window.clearTimeout(emphasisTimerId);
    emphasisTimerId = null;
  }
};

const enterNormalMode = () => {
  clearEmphasisTimer();
  bubble.classList.remove("emphasis");
  input.classList.add("hidden");
  label.classList.remove("hidden");
  void setClickThrough(true);
};

const enterEmphasisMode = () => {
  clearEmphasisTimer();
  bubble.classList.add("emphasis");
  emphasisTimerId = window.setTimeout(() => {
    bubble.classList.remove("emphasis");
    emphasisTimerId = null;
  }, EMPHASIS_DURATION_MS);
};

const enterEditMode = () => {
  clearEmphasisTimer();
  bubble.classList.add("emphasis");
  label.classList.add("hidden");
  input.classList.remove("hidden");
  input.value = readStoredText();
  void setClickThrough(false).finally(() => {
    requestAnimationFrame(() => {
      input.focus();
      input.select();
    });
  });
};

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    setText(input.value);
    enterNormalMode();
    return;
  }

  if (event.key === "Escape") {
    enterNormalMode();
  }
});

void listen("mode", (event) => {
  const mode = String(event.payload);
  if (mode === "emphasis") {
    enterEmphasisMode();
    return;
  }
  if (mode === "edit") {
    enterEditMode();
  }
});

setText(readStoredText());
enterNormalMode();
