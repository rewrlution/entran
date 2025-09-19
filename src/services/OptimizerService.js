/**
 * OptimizerService - Transform human-friendly markdown into LLM-optimized structure
 * This service takes informal troubleshooting notes and converts them into
 * properly structured markdown that works well with the ENTRAN pipeline
 */
class OptimizerService {
  constructor() {
    this.patterns = {
      // Common informal patterns and their structured equivalents
      actionWords: [
        "test",
        "check",
        "verify",
        "ensure",
        "confirm",
        "validate",
        "ping",
        "curl",
        "run",
        "execute",
        "look at",
        "examine",
      ],
      networkTerms: [
        "connectivity",
        "connection",
        "network",
        "internet",
        "dns",
        "ping",
        "server",
        "host",
        "website",
        "url",
        "ip",
        "port",
      ],
      troubleshootingKeywords: [
        "problem",
        "issue",
        "error",
        "fail",
        "broken",
        "not working",
        "slow",
        "timeout",
        "unreachable",
        "down",
      ],
    };
  }

  /**
   * Optimize human-friendly markdown for LLM processing
   * @param {string} markdown - Informal markdown content
   * @returns {Object} - Optimization result
   */
  async optimize(markdown) {
    try {
      console.log("🔧 Optimizing markdown for LLM processing");

      const analysis = this.analyzeContent(markdown);
      const optimizedMarkdown = this.generateStructuredMarkdown(analysis);

      const result = {
        success: true,
        optimized_markdown: optimizedMarkdown,
        analysis: analysis,
        metadata: {
          optimization_applied: true,
          original_length: markdown.length,
          optimized_length: optimizedMarkdown.length,
          structure_improvements: analysis.improvements,
          timestamp: new Date().toISOString(),
        },
      };

      console.log("✅ Markdown optimization completed");
      return result;
    } catch (error) {
      console.error("❌ Optimization failed:", error);
      return {
        success: false,
        error: error.message,
        optimized_markdown: markdown, // Fallback to original
        metadata: {
          optimization_applied: false,
          error_count: 1,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Analyze informal content and extract structure
   * @param {string} markdown - Input markdown
   * @returns {Object} - Content analysis
   */
  analyzeContent(markdown) {
    const lines = markdown.split("\n").filter((line) => line.trim());
    const analysis = {
      intent: "unknown",
      actions: [],
      commands: [],
      expectations: [],
      improvements: [],
    };

    // Detect troubleshooting intent
    const lowerContent = markdown.toLowerCase();
    if (this.containsNetworkTerms(lowerContent)) {
      analysis.intent = "network_troubleshooting";
      analysis.improvements.push("Detected network troubleshooting intent");
    }

    // Extract actions and commands
    for (const line of lines) {
      const trimmedLine = line.trim().toLowerCase();

      // Look for action items (bullet points, numbered items, or action words)
      if (this.isActionLine(trimmedLine)) {
        const action = this.extractAction(trimmedLine);
        if (action) {
          analysis.actions.push(action);
        }
      }

      // Look for commands or tools mentioned
      const commands = this.extractCommands(trimmedLine);
      analysis.commands.push(...commands);

      // Look for expectations/results
      if (this.isExpectationLine(trimmedLine)) {
        analysis.expectations.push(this.cleanExpectation(line.trim()));
      }
    }

    // Remove duplicates
    analysis.commands = [...new Set(analysis.commands)];
    analysis.improvements.push(`Extracted ${analysis.actions.length} actions`);
    analysis.improvements.push(`Found ${analysis.commands.length} commands`);

    return analysis;
  }

  /**
   * Generate properly structured markdown from analysis
   * @param {Object} analysis - Content analysis
   * @returns {string} - Structured markdown
   */
  generateStructuredMarkdown(analysis) {
    const title = this.generateTitle(analysis);
    const sections = [];

    // Title
    sections.push(`# ${title}`);
    sections.push("");

    // Problem Description
    sections.push("## Problem Description");
    sections.push(this.generateProblemDescription(analysis));
    sections.push("");

    // Diagnostic Steps
    if (analysis.actions.length > 0) {
      sections.push("## Diagnostic Steps");
      sections.push("");
      analysis.actions.forEach((action, index) => {
        sections.push(`${index + 1}. ${action}`);
      });
      sections.push("");
    }

    // Implementation
    sections.push("## Implementation");
    sections.push("");

    const stepGroups = this.groupActionsByCategory(
      analysis.actions,
      analysis.commands
    );
    stepGroups.forEach((group, index) => {
      sections.push(`### Step ${index + 1}: ${group.name}`);
      sections.push("```bash");
      group.commands.forEach((cmd) => {
        sections.push(cmd);
      });
      sections.push("```");
      sections.push("");
    });

    // Expected Results
    if (analysis.expectations.length > 0) {
      sections.push("## Expected Results");
      analysis.expectations.forEach((expectation) => {
        sections.push(`- ${expectation}`);
      });
      sections.push("");
    }

    return sections.join("\n");
  }

  /**
   * Check if content contains network-related terms
   */
  containsNetworkTerms(content) {
    return this.patterns.networkTerms.some((term) => content.includes(term));
  }

  /**
   * Check if line represents an action item
   */
  isActionLine(line) {
    // Bullet points, numbers, or starts with action words
    return (
      line.match(/^[-*•]\s/) ||
      line.match(/^\d+\.?\s/) ||
      this.patterns.actionWords.some((word) => line.startsWith(word))
    );
  }

  /**
   * Extract action from line
   */
  extractAction(line) {
    // Clean up the line and extract meaningful action
    let action = line.replace(/^[-*•]\s*/, "").replace(/^\d+\.?\s*/, "");

    // Ensure it starts with a capital letter
    action = action.charAt(0).toUpperCase() + action.slice(1);

    // Ensure it doesn't end with period if it's not a complete sentence
    if (!action.includes(" ") && action.endsWith(".")) {
      action = action.slice(0, -1);
    }

    return action.length > 3 ? action : null;
  }

  /**
   * Extract commands from text
   */
  extractCommands(line) {
    const commands = [];
    const commonCommands = [
      "ping",
      "curl",
      "nslookup",
      "dig",
      "traceroute",
      "netstat",
      "ss",
      "ip",
      "ifconfig",
      "route",
      "iptables",
      "ufw",
    ];

    commonCommands.forEach((cmd) => {
      if (line.includes(cmd)) {
        // Try to extract full command with arguments
        const regex = new RegExp(`${cmd}\\s+[^\\s,;.]+`, "g");
        const matches = line.match(regex);
        if (matches) {
          commands.push(...matches);
        } else {
          commands.push(cmd);
        }
      }
    });

    return commands;
  }

  /**
   * Check if line represents an expectation or result
   */
  isExpectationLine(line) {
    const expectationWords = [
      "should",
      "expect",
      "result",
      "return",
      "show",
      "display",
    ];
    return (
      expectationWords.some((word) => line.includes(word)) ||
      line.includes("ms") ||
      line.includes("200") ||
      line.includes("ip")
    );
  }

  /**
   * Clean expectation text
   */
  cleanExpectation(line) {
    return line.replace(/^and\s+/i, "").replace(/^you\s+should\s+/i, "");
  }

  /**
   * Generate appropriate title based on analysis
   */
  generateTitle(analysis) {
    switch (analysis.intent) {
      case "network_troubleshooting":
        return "Network Connectivity Troubleshooting";
      default:
        return "System Troubleshooting Guide";
    }
  }

  /**
   * Generate problem description
   */
  generateProblemDescription(analysis) {
    switch (analysis.intent) {
      case "network_troubleshooting":
        return "Check network connectivity and diagnose connection issues.";
      default:
        return "Diagnose and resolve system issues through systematic testing.";
    }
  }

  /**
   * Group actions by category for implementation steps
   */
  groupActionsByCategory(actions, commands) {
    const groups = [];
    const networkCommands = ["ping", "curl", "telnet"];
    const dnsCommands = ["nslookup", "dig"];

    // Basic connectivity group
    const connectivityActions = actions.filter(
      (action) =>
        action.toLowerCase().includes("connect") ||
        action.toLowerCase().includes("ping") ||
        action.toLowerCase().includes("test")
    );

    if (
      connectivityActions.length > 0 ||
      commands.some((cmd) => networkCommands.some((nc) => cmd.includes(nc)))
    ) {
      groups.push({
        name: "Connectivity Test",
        commands:
          commands.filter((cmd) =>
            networkCommands.some((nc) => cmd.includes(nc))
          ).length > 0
            ? commands.filter((cmd) =>
                networkCommands.some((nc) => cmd.includes(nc))
              )
            : ["ping google.com -c 3", "curl -I https://google.com"],
      });
    }

    // DNS group
    const dnsActions = actions.filter(
      (action) =>
        action.toLowerCase().includes("dns") ||
        action.toLowerCase().includes("resolve")
    );

    if (
      dnsActions.length > 0 ||
      commands.some((cmd) => dnsCommands.some((dc) => cmd.includes(dc)))
    ) {
      groups.push({
        name: "DNS Check",
        commands:
          commands.filter((cmd) => dnsCommands.some((dc) => cmd.includes(dc)))
            .length > 0
            ? commands.filter((cmd) =>
                dnsCommands.some((dc) => cmd.includes(dc))
              )
            : ["nslookup google.com", "dig google.com"],
      });
    }

    // Default group if nothing specific found
    if (groups.length === 0) {
      groups.push({
        name: "System Check",
        commands:
          commands.length > 0
            ? commands
            : ['echo "No specific commands detected"'],
      });
    }

    return groups;
  }
}

module.exports = OptimizerService;
