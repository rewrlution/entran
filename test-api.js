const axios = require("axios");

const BASE_URL = "http://localhost:3001";

async function testAPI() {
  console.log("🧪 Testing ENTRAN API Endpoints\n");

  try {
    // Test health endpoint
    console.log("1. Testing Health Endpoint...");
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Health Check:", healthResponse.data);

    // Test lexer endpoint
    console.log("\n2. Testing Lexer Endpoint...");
    const sampleMarkdown = `# Network Troubleshooting

## Check Interface Status

1. Run \`ip addr show\` to check interface status
2. Look for UP/DOWN state
3. If DOWN, run \`ip link set eth0 up\`

## Test Connectivity

- Ping gateway: \`ping 192.168.1.1\`
- Test DNS: \`nslookup google.com\``;

    const lexerResponse = await axios.post(`${BASE_URL}/api/lexer/parse`, {
      markdown: sampleMarkdown,
    });

    console.log("✅ Lexer Parse:", {
      success: lexerResponse.data.success,
      sections: lexerResponse.data.ast?.children?.length || 0,
      procedures: lexerResponse.data.metadata?.procedures || 0,
    });

    // Test transpiler endpoint
    console.log("\n3. Testing Transpiler Endpoint...");
    const transpilerResponse = await axios.post(
      `${BASE_URL}/api/transpiler/transpile`,
      {
        ast: lexerResponse.data.ast,
      }
    );

    console.log("✅ Transpiler:", {
      success: transpilerResponse.data.success,
      procedures: transpilerResponse.data.program?.procedures?.length || 0,
      tools: transpilerResponse.data.program?.tools?.length || 0,
    });

    // Test analyzer endpoint
    console.log("\n4. Testing Analyzer Endpoint...");
    const analyzerResponse = await axios.post(
      `${BASE_URL}/api/analyzer/analyze`,
      {
        program: transpilerResponse.data.program,
      }
    );

    console.log("✅ Analyzer:", {
      success: analyzerResponse.data.success,
      confidence: analyzerResponse.data.analysis?.confidence || 0,
      procedures: analyzerResponse.data.analysis?.procedures?.length || 0,
    });

    // Test execution endpoint
    console.log("\n5. Testing Execution Endpoint...");
    const executionResponse = await axios.post(
      `${BASE_URL}/api/execution/start`,
      {
        program: transpilerResponse.data.program,
        analysis: analyzerResponse.data.analysis,
      }
    );

    console.log("✅ Execution Start:", {
      success: executionResponse.data.success,
      execution_id: executionResponse.data.execution_id,
      status: executionResponse.data.state?.status,
    });

    // Test step execution
    if (executionResponse.data.execution_id) {
      console.log("\n6. Testing Step Execution...");
      const stepResponse = await axios.post(`${BASE_URL}/api/execution/step`, {
        execution_id: executionResponse.data.execution_id,
        command: "step_over",
      });

      console.log("✅ Step Execution:", {
        success: stepResponse.data.success,
        status: stepResponse.data.state?.status,
      });
    }

    console.log("\n🎉 All API endpoints working correctly!");
  } catch (error) {
    console.error("❌ API Test Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

// Install axios if not present, then run test
async function main() {
  try {
    require("axios");
    await testAPI();
  } catch (e) {
    console.log("Installing axios...");
    const { exec } = require("child_process");
    exec("npm install axios", async (error) => {
      if (error) {
        console.error("Failed to install axios:", error);
        return;
      }
      console.log("Axios installed, running tests...\n");
      delete require.cache[require.resolve("axios")];
      await testAPI();
    });
  }
}

main();
