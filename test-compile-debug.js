const axios = require("axios");

const sampleInput = `# Network issue troubleshooting guide

## Instructions
- test networking connectivity by pinging google
- check the dns resolution works properly  
- verify http response: you should be able to see the ping is within 100ms, and http returns 200 status and dns resolves to valid IP address.

## References:
- [terminologies](https://en.wikipedia.org/wiki/Network_troubleshooting)`;

async function testPipeline() {
  try {
    console.log("🔧 Testing ENTRAN pipeline...\n");

    // Step 1: Test Optimizer
    console.log("STEP 1: Testing Optimizer...");
    const optimizeResponse = await axios.post(
      "http://localhost:3001/api/optimizer/optimize",
      {
        text: sampleInput,
      }
    );

    if (optimizeResponse.data.success) {
      console.log("✅ Optimizer success");
      console.log(
        "Optimized length:",
        optimizeResponse.data.optimizedText.length
      );
      console.log(
        "First 200 chars:",
        optimizeResponse.data.optimizedText.substring(0, 200) + "...\n"
      );
    } else {
      console.log("❌ Optimizer failed:", optimizeResponse.data.error);
      return;
    }

    // Step 2: Test Compiler/Lexer
    console.log("STEP 2: Testing Compiler (Lexer)...");
    const compileResponse = await axios.post(
      "http://localhost:3001/api/lexer/parse",
      {
        markdown: optimizeResponse.data.optimizedText,
      }
    );

    if (compileResponse.data.success) {
      console.log("✅ Compiler success");
      console.log(
        "AST sections:",
        compileResponse.data.ast.sections?.length || 0
      );
      console.log("AST structure keys:", Object.keys(compileResponse.data.ast));
    } else {
      console.log("❌ Compiler failed");
      console.log(
        "Error details:",
        JSON.stringify(compileResponse.data, null, 2)
      );
    }
  } catch (error) {
    console.error("❌ Error in pipeline test:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error(
        "Response data:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
  }
}

testPipeline();
