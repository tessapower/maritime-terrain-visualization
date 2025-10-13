/// GUIManager.ts: Central GUI that other modules can register with

import GUI from "lil-gui";

/**
 * Interface that GUI modules must implement to register with GUIManager
 */
export interface IGuiModule {
  /**
   * Sets up controls using the provided GUI instance
   * @param gui The lil-gui instance to add controls to
   */
  setupControls(gui: GUI): void;

  /**
   * Get the name for this module's folder
   */
  getFolderName?(): string;
}

export class GuiManager {
  private readonly gui: GUI;
  private modules: Map<string, IGuiModule> = new Map();

  constructor() {
    this.gui = new GUI();
  }

  /**
   * Registers a GUI module
   * @param name Unique identifier for this module
   * @param module The module implementing IGUIModule
   */
  register(name: string, module: IGuiModule): void {
    if (this.modules.has(name)) {
      console.warn(`GUI module "${name}" already registered. Skipping.`);
      return;
    }

    this.modules.set(name, module);

    // Setup controls for this module
    module.setupControls(this.gui);
  }

  /**
   * Unregisters a GUI module
   * @param name The module identifier to remove
   */
  unregister(name: string): void {
    this.modules.delete(name);
  }

  /**
   * Gets the main GUI instance
   */
  getGUI(): GUI {
    return this.gui;
  }

  /**
   * Cleans up all GUI resources
   */
  dispose(): void {
    this.modules.clear();
    this.gui.destroy();
  }
}
