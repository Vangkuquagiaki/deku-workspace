/**
 * Generates a Google Meet style meeting code: abc-defg-hij
 */
export function generateMeetingCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${segment(3)}-${segment(4)}-${segment(3)}`;
}
