const dbConnect = require('./src/lib/db/connect').default;
const Supplier = require('./src/lib/db/models/supplier').default;
const dotenv = require('dotenv');

dotenv.config();

async function test() {
  await dbConnect();
  console.log("DB Connected");

  const email = "test@supplier.com"; // Change to an existing supplier email
  const password = "password123";

  const supplier = await Supplier.findOne({ email });
  if (!supplier) {
    console.log("Supplier not found");
    process.exit(0);
  }

  const isMatched = await supplier.isPasswordCorrect(password);
  console.log(`Password match for ${email}: ${isMatched}`);
  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
