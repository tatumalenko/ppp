import { google, Auth, sheets_v4 as sheets } from "googleapis";
import { config } from "../../config/config";

export default class SheetsClient {
  private client: sheets.Sheets | null = null;

  private async _initIfNeeded(): Promise<void> {
    if (!this.client) {
      this.client = await this._getGoogleSheetClient();
    }
  }

  private async _getGoogleSheetClient(): Promise<sheets.Sheets> {
    const auth: Auth.GoogleAuth = new google.auth.GoogleAuth({
      credentials: config.google,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    return google.sheets({
      auth: auth,
      version: "v4",
    });
  }

  async _getSheet(
    sheetId: string,
    tabName: string,
    range: string
  ): Promise<any[][] | null | undefined> {
    this._initIfNeeded();
    const res = await this.client!.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tabName}!${range}`,
    });

    return res.data.values;
  }

  async updateCell(
    sheetId: string,
    tabName: string,
    cell: string,
    value: number
  ): Promise<void> {
    await this._initIfNeeded();
    const range = `${tabName}!${cell}`;
    const _ = await this.client!.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: range,
      valueInputOption: "USER_ENTERED",
      requestBody: { range: range, majorDimension: "ROWS", values: [[value]] },
    });
  }

  async getCell(sheetId: string, tabName: string, cell: string): Promise<any> {
    await this._initIfNeeded();
    const range = `${tabName}!${cell}`;

    const res = await this.client!.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    return res.data.values?.at(0)?.at(0);
  }
}
