import { decryptToken, encryptPayload } from "../lib/tokenEngine";

async function main() {
  const token = process.argv[2] || "";
  
  if (!token) {
    console.error("No token provided");
    console.log("\nTesting with a generated token instead...\n");
    
    // Generate a test token
    const testPayload = {
      linkId: "test-link-123",
      email: "test@example.com",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      type: "personalized" as const
    };
    
    const generatedToken = encryptPayload(testPayload);
    console.log("Generated token:", generatedToken);
    console.log("\nNow decrypting...\n");
    
    try {
      const result = decryptToken(generatedToken);
      console.log("✅ SUCCESS - DECRYPTED TOKEN:");
      console.log(JSON.stringify(result, null, 2));
      console.log("-------------------------");
    } catch (err) {
      console.error("❌ ERROR:");
      console.error(err);
      process.exit(1);
    }
  } else {
    try {
      const result = decryptToken(token);
      console.log("✅ SUCCESS - DECRYPTED TOKEN:");
      console.log(JSON.stringify(result, null, 2));
      console.log("-------------------------");
    } catch (err) {
      console.error("❌ ERROR:");
      console.error(err);
      process.exit(1);
    }
  }
}

main();

