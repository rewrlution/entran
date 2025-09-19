const OptimizerService = require("./src/services/OptimizerService");

async function testOptimizer() {
  const optimizer = new OptimizerService();
  const testInput = "- test networking connectivity by pinging google";

  try {
    console.log("Testing optimizer with input:", testInput);
    const result = await optimizer.optimize(testInput);
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

testOptimizer();
