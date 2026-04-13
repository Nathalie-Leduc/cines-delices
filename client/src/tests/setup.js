import '@testing-library/jest-dom';

// Mock window.scrollTo — non implémenté par jsdom
window.scrollTo = () => {};
