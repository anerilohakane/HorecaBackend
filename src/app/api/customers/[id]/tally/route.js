import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Customer from "@/lib/db/models/customer";

const escapeXML = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

export async function GET(request, { params }) {
  await dbConnect();

  try {
    const { id } = params;

    // Verify customer exists
    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    const tallyUrl = process.env.TALLY_URL || 'https://yummy-freebee-circular.ngrok-free.dev';
    const tallyCompany = process.env.TALLY_SALES_COMPANY || 'Unifoods';
    const ledgerName = id; // Since we saved mongoId as an alias

    const payload = `<ENVELOPE>
      <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>EXPORT</TALLYREQUEST>
        <TYPE>COLLECTION</TYPE>
        <ID>LedgerCollection</ID>
      </HEADER>
      <BODY>
        <DESC>
          <STATICVARIABLES>
            <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
            <SVCURRENTCOMPANY>${escapeXML(tallyCompany)}</SVCURRENTCOMPANY>
          </STATICVARIABLES>
          <TDL>
            <TDLMESSAGE>
              <COLLECTION NAME="LedgerCollection">
                <TYPE>Ledger</TYPE>
                <FETCH>NAME,MAILINGNAME,ADDRESS,STATENAME,COUNTRYNAME,PINCODE,LEDGERPHONE,EMAIL,PARTYGSTIN</FETCH>
                <FILTER>NameFilter</FILTER>
              </COLLECTION>
              <SYSTEM TYPE="Formulae" NAME="NameFilter">
                $Name = "${escapeXML(ledgerName)}" OR $_Id = "${escapeXML(ledgerName)}"
              </SYSTEM>
            </TDLMESSAGE>
          </TDL>
        </DESC>
      </BODY>
    </ENVELOPE>`;

    const res = await fetch(tallyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: payload
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Tally responded with status ${res.status}` }, { status: 502 });
    }

    const xmlText = await res.text();

    if (xmlText.includes('<LINEERROR>')) {
      const errorMatch = xmlText.match(/<LINEERROR>([^<]+)<\/LINEERROR>/);
      return NextResponse.json({ success: false, error: errorMatch ? errorMatch[1] : 'Error fetching from Tally' }, { status: 400 });
    }

    // Extract all NAME tags
    const names = [];
    const nameRegex = /<NAME>([^<]+)<\/NAME>/g;
    let match;
    while ((match = nameRegex.exec(xmlText)) !== null) {
      names.push(match[1]);
    }

    // Extract MAILINGNAME
    const mailingNameMatch = xmlText.match(/<MAILINGNAME>([^<]+)<\/MAILINGNAME>/);
    const mailingName = mailingNameMatch ? mailingNameMatch[1] : null;

    return NextResponse.json({
      success: true,
      data: {
        tallyId: ledgerName,
        customerNameInDB: customer.name || customer.businessName || "Unknown",
        primaryName: names.length > 0 ? names[0] : null,
        aliases: names.length > 1 ? names.slice(1) : [],
        mailingName: mailingName,
        rawXml: xmlText
      }
    });
  } catch (error) {
    console.error("🔥 ERROR in GET /api/customers/[id]/tally:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
