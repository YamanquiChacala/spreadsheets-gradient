import { colorDistinctCells, colorDistinctGrid, fillGradient } from "./gradient";
import { setupSheet } from "./sheet-preparation";

/**
 * Main trigger for the library.
 */
export function onInstall() {
    onOpen();
}

/**
 * Main trigger as a embedded script.
 */
export function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu("Gradient Tools")
        .addItem("🏳️‍🌈 Fill Gradient", fillGradient.name)
        .addItem("🚥 Fill Distinct Linear", colorDistinctCells.name)
        .addItem("🎨 Fill Distinct Grid", colorDistinctGrid.name)
        .addSeparator()
        .addItem("🏁 Setup Spreadsheet", setupSheet.name)
        .addToUi();
}
