const https = require('https');

const tallyUrl = 'https://yummy-freebee-circular.ngrok-free.dev/';
const id = '6a2a56aee1c2a7d6c68aa591';

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
        <SVCURRENTCOMPANY>${id ? 'Unifoods' : 'Unifoods'}</SVCURRENTCOMPANY>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="LedgerCollection">
            <TYPE>Ledger</TYPE>
            <FETCH>NAME,MAILINGNAME,ADDRESS,STATENAME,COUNTRYNAME,PINCODE,LEDGERPHONE,EMAIL,PARTYGSTIN</FETCH>
            <FILTER>NameFilter</FILTER>
          </COLLECTION>
          <SYSTEM TYPE="Formulae" NAME="NameFilter">
            $Name = "${id}" OR $Name = "${id}"
          </SYSTEM>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

const req = https.request(tallyUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let xmlText = '';
  res.on('data', d => xmlText += d);
  res.on('end', () => {
    const names = [];
    const nameRegex = /<NAME>([^<]+)<\/NAME>/g;
    let match;
    while ((match = nameRegex.exec(xmlText)) !== null) {
      names.push(match[1]);
    }
    const mailMatch = xmlText.match(/<MAILINGNAME>([^<]+)<\/MAILINGNAME>/);
    console.log('--- CUSTOMER FETCHED FROM TALLY ---');
    console.log('Customer ID:', id);
    console.log('Primary Name in Tally:', names.length > 0 ? names[0] : 'N/A');
    console.log('Aliases in Tally:', names.length > 1 ? names.slice(1).join(", ") : 'N/A');
    console.log('Mailing Name:', mailMatch ? mailMatch[1] : 'N/A');
    console.log('Raw XML snippet:', xmlText);
  });
});

req.on('error', console.error);
req.write(payload);
req.end();
