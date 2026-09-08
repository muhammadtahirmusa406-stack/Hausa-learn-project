/**
 * Browser speech is only used when the browser explicitly exposes a Hausa
 * voice. An English or generic West African voice is not a Hausa substitute.
 */
export function speakHausa(text: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;

  const voices = window.speechSynthesis.getVoices();
  const hausaVoice = voices.find((voice) => {
    const language = voice.lang.toLowerCase();
    return language === "ha" || language.startsWith("ha-");
  });
  if (!hausaVoice) return false;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = hausaVoice.lang;
  utterance.voice = hausaVoice;
  utterance.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}