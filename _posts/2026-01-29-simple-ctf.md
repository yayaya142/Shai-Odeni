---
title: "Simple: Following the Smallest Lead to Full Compromise"
date: 2026-01-29 09:00:00 +0300
category: cybersecurity
subcategories:
  - ctf
  - web-security
  - privilege-escalation
tags:
  - CTF
  - TryHackMe
  - Web
  - SQLi
  - SSH
  - Privilege Escalation
type: technical-breakdown
summary: "A CMS Made Simple foothold turns into SSH access and root through disciplined enumeration, SQL injection, and an unsafe sudo rule on vim."
featured: false
pin: true
---

Machine: [Simple CTF](https://tryhackme.com/room/easyctf)

## Introduction

Simple was the kind of target I like documenting because it was not about exotic exploitation or a long chain of tricks. The machine fell by following a narrow sequence of signals, keeping weak leads short, and only going deeper when the evidence justified it. That is the part I find worth writing about: not just that I got root, but how I reduced the attack surface, made decisions under uncertainty, and kept the path disciplined from enumeration to privilege escalation.

At a high level, the compromise came from discovering a CMS instance under `/simple`, abusing a known SQL injection to recover credentials, reusing those credentials over SSH, and then escalating through an unsafe `sudo` rule on `vim`. None of those steps were especially novel on their own. What made the box interesting was how cleanly each one depended on recognizing what did *not* matter as much as what did.

## Initial Enumeration

I began with a service scan to see where the machine was likely to give me the most leverage.

```bash
nmap -sV 10.114.141.205
```

```text
PORT     STATE SERVICE VERSION
21/tcp   open  ftp     vsftpd 3.0.3
80/tcp   open  http    Apache httpd 2.4.18 ((Ubuntu))
2222/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.8
```

The scan exposed FTP, HTTP, and SSH on the nonstandard port `2222`. At that point I had a few possible directions, but they were not equally attractive.

FTP was visible, but nothing suggested anonymous access or a misconfiguration I could act on immediately. SSH was interesting, but without credentials it was not a practical entry point, and brute-forcing it that early would have been noisy and low value. HTTP, on the other hand, usually gives more room for structured enumeration, especially when the target is small and likely to hide the real attack surface behind a web application.

That is why I prioritized the web service first. The decision was less about HTTP being inherently better and more about it being the most information-rich surface at that stage.

## Web Enumeration

Before going deeper, I briefly checked whether the Apache version pointed to anything directly usable.

```bash
searchsploit apache 2.4.18
```

That produced some generic results, but nothing that looked like a credible path forward for this host. This was one of the first small decision points on the box: I had something technically related to the exposed service, but not something strong enough to justify chasing. Rather than forcing a version-based exploit path, I moved to content discovery.

```bash
gobuster dir -u http://10.114.141.205 -w /usr/share/wordlists/dirb/common.txt
```

```text
/index.html
/robots.txt
/server-status
/simple
```

The important result was `/simple/`.

That immediately changed the character of the target. Up to that point I was looking at a generic Apache host. Once `/simple/` appeared, I was looking at an application. That mattered because application-specific enumeration is often where low-complexity CTF boxes and many real internal targets become much more predictable.

CMS deployments are especially useful from an attack perspective because they tend to combine recognizable fingerprints, public exploit history, and credential-bearing backends. Once I had that path, it made more sense to identify the application than to keep expanding the generic web surface.

## Identifying the Vulnerability

With the `/simple/` path in hand, I checked whether the application matched anything known.

```bash
searchsploit "CMS Made Simple 2.2"
searchsploit -x 46635
```

```text
CMS Made Simple < 2.2.10 - SQL Injection
CVE-2019-9053
```

This was the first strong lead on the machine.

At that point I still did not know whether the target was definitely vulnerable, but this was already much better than the earlier Apache lead. It was tied to the actual application I had discovered, it matched the CMS versioning, and it offered a realistic payoff: credential extraction rather than just limited proof-of-concept behavior.

That distinction mattered. I was not just looking for a way to say the app was vulnerable. I wanted a path that could plausibly transition from web enumeration to system access.

SQL injection in older CMS deployments is also a very real pattern outside of labs. These platforms often accumulate legacy code paths, plugins, and weak input handling over time, which makes “small, old, internet-facing admin software” a recurring source of credential exposure.

## Exploiting CMS Made Simple

I copied the exploit locally and ran it against the application.

```bash
searchsploit -m 46635
python2 46635.py -u http://10.114.141.205/simple --crack -w /usr/share/seclists/Passwords/Common-Credentials/best110.txt
```

There was a bit of friction here because the exploit expected Python 2. That was not an interesting obstacle in itself, so I did not spend much time treating it as part of the attack logic. The only reason it mattered was that it briefly forced me to separate tooling issues from target behavior.

Once the script ran properly, it returned the data that actually moved the compromise forward:

```text
Salt for password found: 1dac0d92e9fa6bb2
Username found: mitch
Email found: admin@admin.com
Password found: 0c01f4468bd75d7a84c7eb73846e8d96
Password cracked: secret
```

This was the real pivot on the box. The SQL injection was useful not because it proved database access, but because it collapsed discovery and initial access into the same step. I now had a username and a cracked password instead of just a vulnerable parameter.

I did consider whether the credentials might only be valid inside the CMS, but the presence of SSH made system-level reuse likely enough to test immediately. In practice, credential reuse between application and operating system contexts is still common, especially on lightly managed hosts where a single user administers both.

## From Web Credentials to a Shell

With `mitch:secret` recovered, SSH became the obvious place to validate them.

```bash
ssh mitch@10.114.141.205 -p 2222
```

After logging in, I checked the session context and looked for the user flag.

```bash
whoami
pwd
ls
cat user.txt
```

```text
mitch
/home/mitch
G00d j0b, keep up!
```

This confirmed that the CMS credentials were also valid at the host level.

That crossover is one of the most common ways a web foothold turns into meaningful access. From a defensive standpoint, the problem is not only weak passwords. It is the habit of treating application accounts, administrative habits, and local users as if they were separate trust zones when, operationally, they often are not.

I also noted another home directory on the system, `sunbath`, but it did not open an immediate path. That was a good example of something worth observing without overcommitting to. The better next step was still local privilege escalation from the shell I already had.

## Privilege Escalation

Once I had a stable session as `mitch`, I checked `sudo` privileges.

```bash
sudo -l
```

```text
User mitch may run the following commands on Machine:
    (root) NOPASSWD: /usr/bin/vim
```

That was the decisive misconfiguration.

This is the sort of finding that appears in both labs and real environments because it often comes from convenience, not from someone intentionally granting shell access. Administrators think in terms of “this user only needs to edit one file as root,” but tools like `vim` are not narrow editors in security terms. They are full-featured programs that can execute commands and spawn shells.

Once I saw `vim`, I did not need to spend time hunting for kernel issues, writable paths, or more elaborate escalation vectors. The box had already told me what mattered.

I launched `vim` through `sudo` and escaped to a shell:

```bash
sudo vim
```

Inside the editor:

```bash
:!sh
```

Then I verified the result:

```bash
whoami
```

```text
root
```

From there I moved to `/root` and read the final flag.

```bash
cd /root
cat root.txt
```

```text
W3ll d0n3. You made it!
```

## Conclusion

The full chain was compact: enumerate services, ignore the low-value temptation to force FTP or SSH too early, discover `/simple/`, identify CMS Made Simple, exploit `CVE-2019-9053` to recover `mitch`'s password, reuse those credentials over SSH, and escalate through `sudo vim`.

What made Simple worth documenting was not the novelty of any single step. It was the shape of the decision-making. I did not need broad exploitation or a long bag of tricks. I needed to choose the richest surface first, drop weak leads quickly, and act on the first finding that meaningfully connected web access to system access.

That is also the real-world lesson here. A lot of compromises do not come from one dramatic flaw. They come from ordinary issues lining up: an exposed CMS, reusable credentials, and an administrative shortcut that quietly grants root. My approach on boxes like this is to keep that chain visible, because the technical win is only half the story. The other half is being able to recognize which details deserve depth and which ones should be discarded.
