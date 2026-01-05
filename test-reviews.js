
const baseUrl = "http://localhost:3000/api";

async function runTest() {
    console.log("Starting Verification...");

    // 1. Seed Data
    console.log("1. Seeding data...");
    const seedRes = await fetch(`${baseUrl}/test-seed`, { method: "POST" });
    if (!seedRes.ok) {
        console.error("Seed failed:", seedRes.status, seedRes.statusText);
        console.error("Response:", await seedRes.text());
        return;
    }
    const seedData = await seedRes.json();
    console.log("Seed Data:", seedData);
    const { userId, productId, orderId } = seedData;

    // 2. Create Review
    console.log("\n2. Creating Review...");
    const reviewPayload = {
        userId,
        productId,
        orderId,
        rating: 5,
        comment: "Excellent product! Highly recommended.",
        images: [{ url: "http://example.com/image.jpg" }, { url: "http://example.com/image2.jpg" }]
    };
    
    const reviewRes = await fetch(`${baseUrl}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewPayload)
    });
    
    const reviewData = await reviewRes.json();
    console.log("Create Review Response:", reviewData);
    
    // 3. List Reviews
    console.log("\n3. Listing Reviews...");
    const listReviewRes = await fetch(`${baseUrl}/reviews?productId=${productId}`);
    const listReviewData = await listReviewRes.json();
    console.log("List Reviews Response:", JSON.stringify(listReviewData, null, 2));

    // 4. Create Return Request
    console.log("\n4. Creating Return Request...");
    const returnPayload = {
        orderId,
        requesterId: userId,
        type: "return",
        items: [
            {
                product: productId,
                quantity: 1,
                reason: "Changed mind",
                condition: "unopened"
            }
        ],
        notes: "Please pick up tomorrow"
    };

    const returnRes = await fetch(`${baseUrl}/return-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(returnPayload)
    });

    const returnData = await returnRes.json();
    console.log("Create Return Response:", returnData);

    // 5. List Return Requests
    console.log("\n5. Listing Return Requests...");
    const listReturnRes = await fetch(`${baseUrl}/return-order?orderId=${orderId}`);
    const listReturnData = await listReturnRes.json();
    console.log("List Returns Response:", JSON.stringify(listReturnData, null, 2));
}

runTest().catch(console.error);
