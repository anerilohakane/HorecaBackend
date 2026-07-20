const mongoose = require('mongoose');

const mapLegacyField = (f) => {
    f = f.trim();
    const l = f.toLowerCase();
    let mappingType = "blank";
    let mappedField = "";
    
    if (l.includes("product") && l.includes("code")) { mappingType = "product_field"; mappedField = "sku"; }
    else if (l.includes("product") && l.includes("name")) { mappingType = "product_field"; mappedField = "name"; }
    else if (l.includes("sku")) { mappingType = "product_field"; mappedField = "sku"; }
    else if (l.includes("base") && l.includes("price")) { mappingType = "product_field"; mappedField = "basePrice"; }
    else if (l.includes("margin")) { mappingType = "product_field"; mappedField = "assuredMargin"; }
    else if (l.includes("expected")) { mappingType = "claim_field"; mappedField = "expectedSellingPrice"; }
    else if (l.includes("actual")) { mappingType = "claim_field"; mappedField = "actualSellingPrice"; }
    else if (l.includes("loss")) { mappingType = "claim_field"; mappedField = "lossAmount"; }
    
    return {
        id: `migrated-${Math.random().toString(36).substring(2, 9)}`,
        columnName: f,
        mappingType,
        mappedField,
        defaultValue: ""
    };
};

mongoose.connect('mongodb+srv://unifoodshrms:Qaz%241234@cluster0.p0fch.mongodb.net/Horeca?retryWrites=true&w=majority&appName=Cluster0')
.then(async () => {
    const ClaimTemplate = require('./src/lib/db/models/ClaimTemplate').default;
    
    const templates = await ClaimTemplate.find({});
    let migratedCount = 0;
    
    for (const t of templates) {
        if (!t.headers && t._doc.fields && t._doc.fields.length > 0) {
            const newHeaders = t._doc.fields.map(mapLegacyField);
            
            // Add Party Name (Customer) and Order Date if they are missing
            if (!newHeaders.find(h => h.columnName.toLowerCase().includes("party"))) {
                 newHeaders.push({
                     id: `migrated-${Math.random().toString(36).substring(2, 9)}`,
                     columnName: "Party Name",
                     mappingType: "customer_field",
                     mappedField: "companyName",
                     defaultValue: ""
                 });
            }
            if (!newHeaders.find(h => h.columnName.toLowerCase().includes("order date"))) {
                 newHeaders.push({
                     id: `migrated-${Math.random().toString(36).substring(2, 9)}`,
                     columnName: "Order Date",
                     mappingType: "order_field",
                     mappedField: "createdAt",
                     defaultValue: ""
                 });
            }

            // We must bypass strict mode to modify the mixed type or just use standard save
            t.headers = newHeaders;
            await t.save();
            console.log(`Migrated template: ${t.name}`);
            migratedCount++;
        }
    }
    
    console.log(`Successfully migrated ${migratedCount} templates.`);
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
