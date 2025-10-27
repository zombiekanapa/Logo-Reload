
// types/global.d.ts
// This file declares global types and interfaces for the application.

declare global {
  /**
   * Interface for the `window.aistudio` object, used for AI Studio specific functionalities
   * like checking and opening API key selection dialogs.
   */
  interface AIStudio {
    /**
     * Checks if an API key has been selected by the user.
     * @returns A promise that resolves to `true` if a key is selected, `false` otherwise.
     */
    hasSelectedApiKey: () => Promise<boolean>;
    /**
     * Opens the dialog for the user to select or configure their API key.
     * @returns A promise that resolves when the dialog operation is complete.
     */
    openSelectKey: () => Promise<void>;
  }

  /**
   * Augment the global `Window` interface to include the `aistudio` property.
   */
  interface Window {
    aistudio: AIStudio;
  }
}

// Fix: Add an empty export statement to make this a module,
// allowing `declare global` to properly augment the global scope.
export {};
