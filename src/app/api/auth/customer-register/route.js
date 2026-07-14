import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db/connect";
import Customer from "@/lib/db/models/customer";
import { logger } from "@/lib/logger";

const JWT_SECRET = process.env.JWT_SECRET;

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


export async function POST(req) {
  try {
    const body = await req.json();
    const {
      username, password, email, phone, businessName, gstNumber,
      licenseImage, name, locations, supplierId, category, poMandatory,
      lat, lng
    } = body;

    if (!username || username.length < 3) {
      return NextResponse.json({ success: false, error: "Username must be at least 3 characters" }, { status: 400 });
    }

    if (!category || !['A', 'B', 'C'].includes(category)) {
      return NextResponse.json({ success: false, error: "Valid customer tier (A, B, C) is required" }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email address" }, { status: 400 });
    }

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ success: false, error: "Invalid phone number" }, { status: 400 });
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: "Full name is required" }, { status: 400 });
    }

    if (!businessName || businessName.trim().length < 2) {
      return NextResponse.json({ success: false, error: "Business name is required" }, { status: 400 });
    }

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstNumber || !gstRegex.test(gstNumber.toUpperCase())) {
      return NextResponse.json({ success: false, error: "Valid GST number is required" }, { status: 400 });
    }

    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json({ success: false, error: "At least one business location is required" }, { status: 400 });
    }

    // Validate the first location at least
    const primaryLocation = locations[0];
    if (!primaryLocation.address || primaryLocation.address.trim().length < 5) {
      return NextResponse.json({ success: false, error: "Valid business address is required" }, { status: 400 });
    }
    if (!primaryLocation.city || primaryLocation.city.trim().length < 2) {
      return NextResponse.json({ success: false, error: "City is required" }, { status: 400 });
    }
    if (!primaryLocation.state || primaryLocation.state.trim().length < 2) {
      return NextResponse.json({ success: false, error: "State is required" }, { status: 400 });
    }
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!primaryLocation.pincode || !pinRegex.test(primaryLocation.pincode)) {
      return NextResponse.json({ success: false, error: "Valid 6-digit PIN code is required" }, { status: 400 });
    }

    // Ensure all locations are valid and structured
    const formattedLocations = locations.map((loc, index) => ({
      address: loc.address?.trim() || "",
      city: loc.city?.trim() || "",
      state: loc.state?.trim() || "",
      pincode: loc.pincode?.trim() || "",
      lat: loc.lat != null ? loc.lat : (index === 0 && lat != null ? lat : null),
      lng: loc.lng != null ? loc.lng : (index === 0 && lng != null ? lng : null),
      isPrimary: index === 0
    }));

    const finalLat = lat != null ? lat : (formattedLocations[0]?.lat != null ? formattedLocations[0].lat : null);
    const finalLng = lng != null ? lng : (formattedLocations[0]?.lng != null ? formattedLocations[0].lng : null);


    await dbConnect();

    // Check if user already exists
    const existingUser = await Customer.findOne({
      $or: [{ username }, { email }, { phone }]
    });

    if (existingUser) {
      let conflictField = "User";
      if (existingUser.username === username) conflictField = "Username";
      else if (existingUser.email === email) conflictField = "Email";
      else if (existingUser.phone === phone) conflictField = "Phone number";

      return NextResponse.json({ success: false, error: `${conflictField} already exists` }, { status: 409 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Normalize Phone
    const numericPhone = phone.replace(/\D/g, "");
    const standardizedPhone = (numericPhone.length === 10) ? `+91${numericPhone}` :
      (numericPhone.length === 12 && numericPhone.startsWith("91")) ? `+${numericPhone}` :
        phone.trim();

    // Create user
    const newUser = await Customer.create({
      username,
      password: hashedPassword,
      email: email.toLowerCase(),
      phone: standardizedPhone,
      name: name.trim(),
      address: primaryLocation.address.trim(),
      city: primaryLocation.city || null,
      state: primaryLocation.state || null,
      pincode: primaryLocation.pincode || null,
      lat: finalLat,
      lng: finalLng,
      location: finalLat != null && finalLng != null ? { type: "Point", coordinates: [finalLng, finalLat] } : undefined,
      locations: formattedLocations,
      businessName: businessName.trim(),
      gstNumber: gstNumber || null,
      licenseImage,
      category,
      poMandatory: poMandatory || false,
      supplierId: supplierId || null,
      lastLoginAt: new Date()
    });

    await logger({
      level: 'info',
      message: `New customer registered: ${newUser.username}`,
      action: 'CUSTOMER_REGISTERED',
      userId: newUser._id,
      userModel: 'Customer',
      metadata: { username, email },
      req
    });

    // Create JWT
    const token = jwt.sign(
      { _id: newUser._id, phone: newUser.phone, category: newUser.category, username: newUser.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Sync Customer Ledger to Tally Prime 9
    const tallyUrl = process.env.TALLY_URL || 'https://yummy-freebee-circular.ngrok-free.dev';
    let tallyCustomerSynced = false;
    let tallyCustomerError = null;

    try {
      const xmlPayload = buildCustomerXML(newUser);
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
                        $_Id = "${escapeXML(newUser._id.toString())}"
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
                newUser.tallyId = guidMatch[1];
                await newUser.save();
                console.log(`[Tally Sync] Fetched and stored Tally GUID: ${newUser.tallyId}`);
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
      data: {
        accessToken: token,
        tallyCustomerSynced,
        tallyCustomerError,
        user: {
          id: newUser._id,
          username: newUser.username,
          phone: newUser.phone,
          email: newUser.email,
          name: newUser.name,
          businessName: newUser.businessName,
          category: newUser.category
        },
      },
    });
  } catch (err) {
    console.error("🔥 CUSTOMER REGISTRATION ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
