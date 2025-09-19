# Web Server Performance Troubleshooting

## Problem Description

Company website is experiencing slow response times and occasional timeouts. Users report pages taking 10+ seconds to load, and some requests are failing completely.

## Diagnostic Steps

1. **Server resource analysis**

   - Check CPU and memory usage
   - Analyze disk I/O performance
   - Monitor network utilization

2. **Web server status verification**

   - Examine nginx/apache logs
   - Check service status and configuration
   - Review connection limits

3. **Database performance analysis**
   - Monitor database connections
   - Check slow query logs
   - Analyze table locks

## Implementation

### Step 1: System Resource Check

Monitor overall system performance:

```bash
# Check current system load and processes
top -bn1 | head -20

# Memory usage analysis
free -h

# Disk space and I/O statistics
df -h
iostat -x 1 5
```

### Step 2: Web Server Analysis

Examine web server status and logs:

```bash
# Check nginx service status
systemctl status nginx

# Analyze recent error logs
tail -50 /var/log/nginx/error.log

# Check active connections
ss -tuln | grep :80
ss -tuln | grep :443
```

### Step 3: Network Performance

Test network connectivity and performance:

```bash
# Test response times to the server
curl -w "Total time: %{time_total}s\n" -o /dev/null -s http://localhost

# Check for packet loss
ping localhost -c 10

# Monitor network connections
netstat -an | grep :80 | wc -l
```

### Step 4: Database Performance

If using a database, check its performance:

```bash
# MySQL performance check
mysqladmin status
mysqladmin processlist

# Check for slow queries
mysql -e "SHOW GLOBAL STATUS LIKE 'Slow_queries';"

# Database connection count
mysql -e "SHOW STATUS LIKE 'Connections';"
```

### Step 5: Log Analysis

Examine logs for patterns and errors:

```bash
# Analyze access logs for response codes
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c

# Check for high response times
awk '{print $NF}' /var/log/nginx/access.log | sort -n | tail -10

# Look for error patterns
grep -i error /var/log/nginx/error.log | tail -20
```

## Expected Results

### Healthy Server Metrics

- **CPU usage**: Below 70% sustained
- **Memory usage**: Below 80% with minimal swap
- **Response times**: Under 2 seconds for most requests
- **Error rate**: Less than 1% of total requests

### Performance Indicators

- **Load average**: Should be below number of CPU cores
- **Database connections**: Within configured limits
- **Disk I/O wait**: Below 20%
- **Network utilization**: Appropriate for traffic volume

## Common Issues and Solutions

### High CPU Usage

```bash
# Identify CPU-intensive processes
ps aux --sort=-%cpu | head -10

# Check for runaway processes
top -bn1 | grep -E "(nginx|mysql|php)"
```

### Memory Issues

```bash
# Check for memory leaks
ps aux --sort=-%mem | head -10

# Analyze swap usage
swapon -s
```

### Disk Performance

```bash
# Check for disk errors
dmesg | grep -i error

# Monitor disk usage by process
iotop -ao
```

## Resolution Actions

Based on findings:

1. **High resource usage**: Scale resources or optimize applications
2. **Configuration issues**: Adjust web server and database settings
3. **Network problems**: Check firewall rules and bandwidth limits
4. **Application bugs**: Review application logs and code

## Monitoring Setup

Implement ongoing monitoring:

```bash
# Set up basic monitoring script
echo "*/5 * * * * /usr/bin/iostat -x 1 1 >> /var/log/performance.log" | crontab -

# Monitor web server response times
echo "*/1 * * * * curl -w '%{time_total}\n' -o /dev/null -s http://localhost >> /var/log/response-times.log" | crontab -
```

---

This guide demonstrates ENTRAN's ability to handle complex system administration tasks with multiple diagnostic phases and conditional logic.
