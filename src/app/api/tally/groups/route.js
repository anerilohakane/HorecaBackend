import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const xmlPayload = `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>Group</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVCURRENTCOMPANY>Unifoods</SVCURRENTCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <FETCH>NAME,PARENT</FETCH>
    </DESC>
  </BODY>
</ENVELOPE>`;

    const TALLY_ENDPOINT = process.env.TALLY_URL || "https://yummy-freebee-circular.ngrok-free.dev";

    const response = await fetch(TALLY_ENDPOINT, {
      method: "POST",
      headers: { 
        "Content-Type": "application/xml",
        "ngrok-skip-browser-warning": "true"
      },
      body: xmlPayload,
    });

    const xmlText = await response.text();

    if (response.ok) {
      // Extract Group Names using regex for simple/fast parsing
      const matches = [...xmlText.matchAll(/<GROUP[^>]*\sNAME="([^"]+)"/g)];
      let groupNames = matches.map(m => m[1]);
      
      if (groupNames.length === 0) {
        const nameMatches = [...xmlText.matchAll(/<NAME>([^<]+)<\/NAME>/g)];
        groupNames = nameMatches.map(m => m[1]);
      }

      groupNames = [...new Set(groupNames.map(g => g.trim()))];

      if (groupNames.length === 0) {
        groupNames = ["Sundry Debtors", "Sundry Creditors", "Duties & Taxes", "Bank Accounts", "Cash-in-hand"];
      }

      return NextResponse.json({ success: true, data: groupNames });
    } else {
      console.error("Tally API Error (GET Groups):", xmlText);
      return NextResponse.json({ success: false, error: "Failed to fetch Groups from Tally" }, { status: 500 });
    }
  } catch (error) {
    console.error("API Error fetching groups:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
