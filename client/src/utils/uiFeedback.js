const TECHNICAL_MESSAGE_PATTERN = /failed to fetch|networkerror|network request failed|load failed|http\s*\d+|unexpected token|cannot read|undefined/i;

export function getReadableFeedbackMessage(message, fallbackMessage) {
  const normalizedMessage = String(message || '').trim();
  const normalizedFallback = String(fallbackMessage || '').trim();

  if (!normalizedMessage) {
    return normalizedFallback;
  }

  if (TECHNICAL_MESSAGE_PATTERN.test(normalizedMessage)) {
    return normalizedFallback || normalizedMessage;
  }

  return normalizedMessage;
}
