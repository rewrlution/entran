const LexerService = require("./src/services/LexerService");

// Sample troubleshooting markdown
const sampleMarkdown = `# Network Connectivity Troubleshooting

## Check Network Interface Status

First, examine the current state of network interfaces.

1. **Gather interface information**: Run \`ip addr show\` to display all network interfaces
2. **Analyze interface state**: Look for the interface state in the output (UP/DOWN)
3. **Check specific interface**: Use \`ip addr show eth0\` if you know the interface name

**If interface is DOWN**: Bring the interface up with \`ip link set eth0 up\`

## Verify DNS Resolution

Test DNS resolution capability.

1. **Test basic DNS**: Use \`nslookup google.com\` to test DNS resolution
2. **Try alternative DNS**: If failed, test with \`nslookup google.com 8.8.8.8\`
3. **Check DNS config**: Examine \`/etc/resolv.conf\` with \`cat /etc/resolv.conf\`

*Output: Record DNS functionality status.*`;

async function testLexer() {
  console.log("🧪 Testing ENTRAN Lexer Service\n");

  const lexer = new LexerService();

  try {
    // Test parsing
    console.log("📝 Testing markdown parsing...");
    const result = await lexer.parse(sampleMarkdown);

    if (result.success) {
      console.log("✅ Parsing successful!");
      console.log(`📊 AST Summary:`);
      console.log(`   - Children: ${result.ast.children.length}`);
      console.log(
        `   - Metadata: ${JSON.stringify(result.ast.metadata, null, 2)}`
      );

      // Show structure
      console.log("\n🏗️  AST Structure:");
      result.ast.children.forEach((child, index) => {
        if (child.type === "heading") {
          console.log(
            `   ${index + 1}. H${child.level}: "${child.text}" (line ${
              child.line
            })`
          );
          if (child.children) {
            child.children.forEach((subchild, subindex) => {
              console.log(
                `      ${subindex + 1}. ${subchild.type} (line ${
                  subchild.line || "N/A"
                })`
              );
            });
          }
        } else {
          console.log(
            `   ${index + 1}. ${child.type} (line ${child.line || "N/A"})`
          );
        }
      });
    } else {
      console.log("❌ Parsing failed with errors:");
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. Line ${error.line}: ${error.message}`);
      });
    }

    // Test validation
    console.log("\n🔍 Testing syntax validation...");
    const validation = lexer.validateSyntax(sampleMarkdown);

    if (validation.valid) {
      console.log("✅ Validation successful - no syntax errors found!");
    } else {
      console.log("❌ Validation found errors:");
      validation.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. Line ${error.line}: ${error.message}`);
      });
    }

    // Test with invalid markdown
    console.log("\n🚫 Testing with invalid markdown...");
    const invalidMarkdown = `# Test
    
\`\`\`bash
echo "unclosed code block
    
## Missing steps

No numbered list here.`;

    const invalidResult = await lexer.parse(invalidMarkdown);
    if (!invalidResult.success) {
      console.log("✅ Correctly detected invalid markdown:");
      invalidResult.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. Line ${error.line}: ${error.message}`);
      });
    }
  } catch (error) {
    console.error("💥 Test failed with error:", error.message);
    process.exit(1);
  }
}

// Run the test
testLexer()
  .then(() => {
    console.log("\n🎉 Lexer service test completed successfully!");
  })
  .catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
  });
