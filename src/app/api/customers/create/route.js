import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Customer from "@/lib/db/models/customer";

// Helper to escape XML entities
const escapeXML = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

// Helper to build Customer XML for Tally
function buildCustomerXML(customer) {
  const name = escapeXML(customer.name || customer.businessName || customer.phone || "Unknown Customer");
  const mongoId = escapeXML(customer._id.toString());
  const mailingName = escapeXML(customer.businessName || customer.name || customer.phone || "Unknown Customer");
  
  const address = escapeXML(customer.address || "");
  const city = escapeXML(customer.city || "");
  const state = escapeXML(customer.state || "Maharashtra");
  const pincode = escapeXML(customer.pincode || "");
  
  const phone = escapeXML(customer.phone || "");
  const email = escapeXML(customer.email || "");
  const gstNumber = escapeXML(customer.gstNumber || ""); 

  let addressXml = "";
  if (address || city) {
    addressXml = `<ADDRESS.LIST TYPE="String">
              ${address ? `<ADDRESS>${address}</ADDRESS>` : ''}
              ${city ? `<ADDRESS>${city}</ADDRESS>` : ''}
            </ADDRESS.LIST>`;
  }

  return `<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES><SVCURRENTCOMPANY>Unifoods</SVCURRENTCOMPANY></STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="${name}" ACTION="Create">
            <NAME>${name}</NAME>
            <LANGUAGENAME.LIST>
              <NAME.LIST TYPE="String">
                <NAME>${name}</NAME>
                <NAME>${mongoId}</NAME>
              </NAME.LIST>
              <LANGUAGECODE> 1033</LANGUAGECODE>
            </LANGUAGENAME.LIST>
            <PARENT>Sundry Debtors</PARENT>
            <ISBILLWISEON>Yes</ISBILLWISEON>
            <MAILINGNAME>${mailingName}</MAILINGNAME>
            ${addressXml}
            <STATENAME>${state}</STATENAME>
            <COUNTRYNAME>India</COUNTRYNAME>
            ${pincode ? `<PINCODE>${pincode}</PINCODE>` : ''}
            ${phone ? `<MOBILE>${phone}</MOBILE>` : ''}
            ${email ? `<EMAIL>${email}</EMAIL>` : ''}
            <GSTREGISTRATIONTYPE>${gstNumber ? 'Regular' : 'Unregistered'}</GSTREGISTRATIONTYPE>
            ${gstNumber ? `<PARTYGSTIN>${gstNumber}</PARTYGSTIN>` : ''}
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

// Helper to parse Tally responses
function parseTallyResponse(xmlString) {
  if (!xmlString) return { success: false, error: "Empty response from Tally" };

  const createdMatch = xmlString.match(/<CREATED>(\d+)<\/CREATED>/);
  const alteredMatch = xmlString.match(/<ALTERED>(\d+)<\/ALTERED>/);
  
  const createdCount = createdMatch ? parseInt(createdMatch[1], 10) : 0;
  const alteredCount = alteredMatch ? parseInt(alteredMatch[1], 10) : 0;

  if (createdCount > 0 || alteredCount > 0) {
    return { success: true };
  }

  const errorMatch = xmlString.match(/<LINEERROR>([\s\S]*?)<\/LINEERROR>/);
  if (errorMatch && errorMatch[1]) {
    return { success: false, error: errorMatch[1].trim() };
  }

  return { success: false, error: "Failed to parse Tally response", raw: xmlString };
}


export async function POST(request) {
  console.log("🔥 HIT /api/customers/create");

  try {
    await dbConnect();
    console.log("🟢 MongoDB Connected");

    const body = await request.json().catch(() => ({}));
    console.log("📩 Request Body:", body);

    const { phone, name, email, address, city, state, pincode, lat, lng } = body;

    if (!phone) {
      console.log("❌ Missing phone");
      return NextResponse.json(
        { success: false, error: "Phone is required" },
        { status: 400 }
      );
    }

    console.log("➡️ Phone:", phone);

    // Normalize: strip non-digits
    const numericPhone = phone.replace(/\D/g, "");
    // Standardize: ensure +91 for 10-digit Indian numbers
    const standardizedPhone = (numericPhone.length === 10) ? `+91${numericPhone}` : 
                              (numericPhone.length === 12 && numericPhone.startsWith("91")) ? `+${numericPhone}` :
                              phone.trim();

    // Look for variations to match existing users
    const variations = [phone.trim(), standardizedPhone, numericPhone];
    if (numericPhone.length === 12 && numericPhone.startsWith("91")) {
        variations.push(numericPhone.slice(2)); // handle without 91
    } else if (numericPhone.length === 10) {
        variations.push("91" + numericPhone); // handle with 91
    }

    // Does customer already exist?
    let customer = await Customer.findOne({ phone: { $in: variations } });

    if (customer) {
      console.log("🟡 Existing customer found:", customer._id);

      // Update lastLoginAt
      customer.lastLoginAt = new Date();
      await customer.save();

      return NextResponse.json({
        success: true,
        message: "Customer already exists. Returning record.",
        data: customer,
      });
    }

    // Create new customer
    console.log("🆕 Creating new customer…");

    const newCustomer = await Customer.create({
      phone: standardizedPhone,
      name: name ?? null,
      email: email ?? null,
      address: address ?? null,
      city: city ?? null,
      state: state ?? null,
      pincode: pincode ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
      location: lat != null && lng != null ? { type: "Point", coordinates: [lng, lat] } : undefined,
      lastLoginAt: new Date(),
    });

    console.log("🟢 Customer Created:", newCustomer._id);

    // Sync Customer Ledger to Tally Prime 9
    const tallyUrl = process.env.TALLY_URL || 'https://yummy-freebee-circular.ngrok-free.dev';
    let tallyCustomerSynced = false;
    let tallyCustomerError = null;

    try {
      const xmlPayload = buildCustomerXML(newCustomer);
      const tallyResponse = await fetch(tallyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'ngrok-skip-browser-warning': 'true'
        },
        body: xmlPayload
      });

      if (tallyResponse.ok) {
        const responseText = await tallyResponse.text();
        const parsed = parseTallyResponse(responseText);
        if (parsed.success) {
          tallyCustomerSynced = true;
          console.log(`[Tally Sync] Customer synced successfully to Tally.`);
          
          // Fetch the generated GUID from Tally and store it
          try {
            const guidPayload = `<ENVELOPE>
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
                    <SVCURRENTCOMPANY>${escapeXML(process.env.TALLY_SALES_COMPANY || 'Unifoods')}</SVCURRENTCOMPANY>
                  </STATICVARIABLES>
                  <TDL>
                    <TDLMESSAGE>
                      <COLLECTION NAME="LedgerCollection">
                        <TYPE>Ledger</TYPE>
                        <FETCH>GUID</FETCH>
                        <FILTER>NameFilter</FILTER>
                      </COLLECTION>
                      <SYSTEM TYPE="Formulae" NAME="NameFilter">
                        $_Id = "${escapeXML(newCustomer._id.toString())}"
                      </SYSTEM>
                    </TDLMESSAGE>
                  </TDL>
                </DESC>
              </BODY>
            </ENVELOPE>`;
            
            const guidResponse = await fetch(tallyUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/xml' },
              body: guidPayload
            });
            
            if (guidResponse.ok) {
              const guidXml = await guidResponse.text();
              const guidMatch = guidXml.match(/<GUID>([^<]+)<\/GUID>/);
              if (guidMatch && guidMatch[1]) {
                newCustomer.tallyId = guidMatch[1];
                await newCustomer.save();
                console.log(`[Tally Sync] Fetched and stored Tally GUID: ${newCustomer.tallyId}`);
              }
            }
          } catch (guidErr) {
            console.error(`[Tally Sync] Failed to fetch GUID for customer:`, guidErr);
          }
        } else {
          tallyCustomerError = parsed.error;
          console.error(`[Tally Sync] Tally error syncing customer:`, parsed.error);
        }
      } else {
        tallyCustomerError = `Tally server responded with status ${tallyResponse.status}`;
        console.error(`[Tally Sync] Tally server responded with status ${tallyResponse.status}`);
      }
    } catch (err) {
      tallyCustomerError = err.message || String(err);
      console.error(`[Tally Sync] Exception syncing customer:`, err);
    }

    return NextResponse.json({
      success: true,
      message: "Customer created successfully",
      data: newCustomer,
      tallyCustomerSynced,
      tallyCustomerError
    });
  } catch (err) {
    console.error("❌ ERROR in /api/customers/create:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
