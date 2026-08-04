import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const xmlPayload = `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>CustomGroupsCollection</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVCURRENTCOMPANY>Unifoods</SVCURRENTCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="CustomGroupsCollection">
            <TYPE>Group</TYPE>
            <FETCH>NAME,PARENT</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

    const TALLY_ENDPOINT = process.env.TALLY_URL || "https://yummy-freebee-circular.ngrok-free.dev";
    console.log("[Tally Groups API Backend] Querying Tally Prime Groups from:", TALLY_ENDPOINT);

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
      // Find all <GROUP ...> blocks in the XML response
      const groupBlocks = xmlText.match(/<GROUP[\s\S]*?<\/GROUP>/g) || [];
      console.log(`[Tally Groups API Backend] Found ${groupBlocks.length} total group blocks in Tally response.`);

      const debtorGroups = ["Sundry Debtors"]; // Default/parent group is always available

      groupBlocks.forEach(block => {
        const nameMatch = block.match(/<GROUP[^>]*\sNAME="([^"]+)"/);
        const parentMatch = block.match(/<PARENT[^>]*>([^<]+)<\/PARENT>/);
        const name = nameMatch ? nameMatch[1]?.trim() : null;
        const parent = parentMatch ? parentMatch[1]?.trim() : null;

        // Only include groups that are directly child sub-groups of Sundry Debtors
        if (name && parent === "Sundry Debtors" && name !== "Sundry Debtors") {
          debtorGroups.push(name);
        }
      });

      console.log("[Tally Groups API Backend] Filtered Debtor Groups for UI dropdown:", debtorGroups);
      return NextResponse.json({ success: true, data: debtorGroups });
    } else {
      console.error("[Tally Groups API Backend] Error (GET Groups):", xmlText);
      return NextResponse.json({ success: false, error: "Failed to fetch Groups from Tally" }, { status: 500 });
    }
  } catch (error) {
    console.error("[Tally Groups API Backend] Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
