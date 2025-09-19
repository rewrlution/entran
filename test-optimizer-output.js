const axios = require("axios");

const sampleInput = `# Network issue troubleshooting guide

## Instructions
- test networking connectivity by pinging google
- check the dns resolution works properly  
- verify http response: you should be able to see the ping is within 100ms, and http returns 200 status and dns resolves to valid IP address.

## References:
- [terminologies](https://en.wikipedia.org/wiki/Network_troubleshooting)`;

async function testOptimizer() {
  try {
    console.log("🔧 Testing optimizer with sample input...\n");
    console.log("INPUT:");
    console.log(sampleInput);
    console.log("\n" + "=".repeat(60) + "\n");

    const response = await axios.post(
      "http://localhost:3001/api/optimizer/optimize",
      {
        text: sampleInput,
      }
    );

    console.log("OUTPUT:");
    console.log(response.data.optimizedText);
    console.log("\n" + "=".repeat(60) + "\n");
    console.log("✅ Optimizer test completed successfully!");
  } catch (error) {
    console.error("❌ Error testing optimizer:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

testOptimizer();
