export function setupSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    let theme = ss.getSpreadsheetTheme();

    if (!theme) {
        theme = ss.resetSpreadsheetTheme();
    }

    theme.setFontFamily("Montserrat");
    ss.setSpreadsheetTheme(theme);

    ss.setSpreadsheetLocale("es_MX");
}
