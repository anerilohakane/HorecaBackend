import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Customer from "@/lib/db/models/customer";

const TALLY_URL = process.env.TALLY_URL || "https://yummy-freebee-circular.ngrok-free.dev";
const TALLY_COMPANY = process.env.TALLY_SALES_COMPANY || "Unifoods";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    const xmlPayload = `<ENVELOPE>
      <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>EXPORT</TALLYREQUEST>
        <TYPE>COLLECTION</TYPE>
        <ID>Ledger</ID>
      </HEADER>
      <BODY>
        <DESC>
          <STATICVARIABLES>
            <SVCURRENTCOMPANY>${TALLY_COMPANY}</SVCURRENTCOMPANY>
            <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          </STATICVARIABLES>
          <FETCH>
            NAME,
            PARENT,
            CLOSINGBALANCE
          </FETCH>
          <FILTER>CustomerFilter</FILTER>
          <SYSTEM TYPE="Formulae" NAME="CustomerFilter">
            $Name = "${id}"
          </SYSTEM>
        </DESC>
      </BODY>
    </ENVELOPE>`;

    const tallyResponse = await fetch(TALLY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        "ngrok-skip-browser-warning": "true"
      },
      body: xmlPayload
    });

    if (!tallyResponse.ok) {
      throw new Error(`Tally HTTP ${tallyResponse.status}`);
    }

    const xmlData = await tallyResponse.text();
    const bills = [];

    // Parse the XML to find the ledger that has the ID inside its NAME.LIST or NAME
    const regex = new RegExp(`<LEDGER NAME="([^"]+)"[^>]*>([\\s\\S]*?)</LEDGER>`, "gi");
    let match;
    let targetBlock = null;
    
    while ((match = regex.exec(xmlData)) !== null) {
      const ledgerName = match[1];
      const block = match[2];
      
      if (ledgerName === id || block.includes(`<NAME>${id}</NAME>`)) {
        targetBlock = block;
        break;
      }
    }

    if (targetBlock) {
      const closingBalanceMatch = targetBlock.match(/<CLOSINGBALANCE[^>]*>([^<]+)<\/CLOSINGBALANCE>/i);
      if (closingBalanceMatch) {
        let balanceStr = closingBalanceMatch[1].trim();
        let balanceVal = parseFloat(balanceStr.replace(/[^\d.-]/g, '')) || 0;
        let isCredit = false;

        if (balanceStr.toLowerCase().includes('cr') || balanceStr.startsWith('-')) {
          isCredit = true;
        } else if (balanceStr.toLowerCase().includes('dr')) {
          isCredit = false;
        }

        const balance = Math.abs(balanceVal);
        
        // Only return if there is an outstanding balance
        if (balance > 0) {
          bills.push({
            id: id,
            name: "Total Outstanding Balance",
            date: new Date().toISOString().split('T')[0],
            creditPeriod: "-",
            balance: balance,
            isCredit: isCredit,
            source: "Tally"
          });
        }
      }
    }

    return NextResponse.json({ success: true, pendingBills: bills });

  } catch (error) {
    console.error("Error fetching pending bills:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch pending bills" },
      { status: 500 }
    );
  }
}
