# SSH Connection Troubleshooting

## Problem Description

Unable to SSH into production server `prod-web-01.company.com`. Connection times out after 30 seconds.

## Diagnostic Steps

1. **Network connectivity test**
2. **SSH service verification**
3. **Authentication check**

## Implementation

### Step 1: Basic Network Test

Test if the server is reachable:

```bash
ping prod-web-01.company.com -c 3
telnet prod-web-01.company.com 22
```

### Step 2: SSH Service Check

Verify SSH daemon is running:

```bash
ssh -v user@prod-web-01.company.com
nmap -p 22 prod-web-01.company.com
```

### Step 3: Key Authentication

Test SSH key authentication:

```bash
ssh-add -l
ssh -i ~/.ssh/id_rsa user@prod-web-01.company.com
```

### Step 4: Alternative Access

If direct SSH fails, try jump host:

```bash
ssh -J jump-host.company.com user@prod-web-01.company.com
ssh user@jump-host.company.com "ssh prod-web-01"
```

## Expected Results

- **Ping**: Should get replies with <50ms latency
- **Telnet port 22**: Should connect successfully
- **SSH verbose**: Should show key exchange process
- **Authentication**: Should complete without password prompt

## Troubleshooting Variables

- Target server: `prod-web-01.company.com`
- SSH port: `22`
- Username: `user`
- Key file: `~/.ssh/id_rsa`
- Jump host: `jump-host.company.com`

---

_This demo showcases ENTRAN's ability to parse structured troubleshooting docs with variables, commands, and logical flow._
