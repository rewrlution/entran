# Network Connectivity Troubleshooting Guide

## Problem Description

User reports unable to access company website and other internet resources from their workstation. The issue appeared suddenly during normal business hours.

## Diagnostic Steps

1. **Basic connectivity verification**

   - Test local network access
   - Verify internet connectivity
   - Check DNS resolution

2. **Network configuration analysis**

   - Examine IP configuration
   - Review routing table
   - Inspect firewall settings

3. **Service status verification**
   - Check network service status
   - Verify DHCP assignment
   - Test port accessibility

## Implementation

### Step 1: Basic Connectivity Test

First, let's verify basic network connectivity:

```bash
# Test internet connectivity with a reliable host
ping google.com -c 4

# Test local network connectivity
ping 192.168.1.1 -c 3

# Verify DNS resolution is working
nslookup google.com
```

### Step 2: Network Configuration Check

Examine the current network configuration:

```bash
# Display all network interfaces and their status
ip addr show

# Check the routing table
ip route show

# Display network statistics
ss -tuln
```

### Step 3: DNS and Service Verification

Test DNS functionality and related services:

```bash
# Test DNS with different servers
dig @8.8.8.8 google.com
dig @1.1.1.1 google.com

# Check if DNS service is running
systemctl status systemd-resolved

# Test HTTP connectivity
curl -I https://google.com --connect-timeout 10
```

### Step 4: Advanced Diagnostics

If basic tests fail, perform deeper analysis:

```bash
# Check for packet loss and latency
mtr google.com -c 10

# Examine network interface errors
cat /proc/net/dev

# Check system logs for network-related errors
journalctl -u NetworkManager --since "1 hour ago"
```

### Step 5: Firewall and Security

Verify firewall configuration isn't blocking connections:

```bash
# Check iptables rules
sudo iptables -L -n -v

# If using ufw, check its status
sudo ufw status verbose

# Check for any blocking rules
sudo iptables -L OUTPUT -n -v
```

## Expected Results

### Normal Operations

- **Ping responses**: Should receive replies with RTT < 100ms
- **DNS resolution**: Should return valid IP addresses within 1-2 seconds
- **HTTP responses**: Should return status codes 200-299
- **Network interfaces**: Should show UP status with assigned IP addresses

### Common Failure Patterns

- **No ping responses**: Indicates network connectivity issues
- **DNS timeouts**: Suggests DNS server problems or firewall blocking
- **Connection refused**: Service is down or firewall blocking specific ports
- **No route to host**: Routing configuration issues

## Resolution Steps

Based on diagnostic results:

1. **If ping fails to gateway**: Check physical connections and interface status
2. **If DNS fails**: Switch to alternative DNS servers (8.8.8.8, 1.1.1.1)
3. **If firewall blocking**: Review and adjust firewall rules
4. **If service down**: Restart network services or contact system administrator

## Escalation Criteria

Contact network administrator if:

- Multiple users experiencing the same issue
- Network infrastructure changes were recent
- Advanced diagnostics reveal hardware failures
- Security policies prevent implementing fixes

---

This troubleshooting guide can be processed through ENTRAN's 4-stage compilation pipeline to create an executable diagnostic program with step-by-step debugging capabilities.
